const express = require('express');
const router  = express.Router();
const authMiddleware = require('../middleware/auth');

const MarketplaceOrder = require('../models/MarketplaceOrder');
const UserActivity     = require('../models/UserActivity');
const Wishlist         = require('../models/Wishlist');
const Subscription     = require('../models/Subscription');
const Product          = require('../models/Product');
const User             = require('../models/User');

const { GoogleGenerativeAI } = require('@google/generative-ai');
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

// ── Admin-only guard (isAdmin OR isSuperAdmin) ────────────────────────────────
function requireAdmin(req, res, next) {
  if (!req.user?.isAdmin && !req.user?.isSuperAdmin) {
    return res.status(403).json({ success: false, message: 'Admin access required' });
  }
  next();
}

// ── Frequency → days between orders ──────────────────────────────────────────
const FREQ_DAYS = { weekly: 7, biweekly: 14, monthly: 30, bimonthly: 60, quarterly: 90 };

// ── Build predictive / procurement data ──────────────────────────────────────
async function buildPredictiveData() {
  const now        = new Date();
  const thirtyAgo  = new Date(now - 30 * 24 * 60 * 60 * 1000);
  const sixtyAgo   = new Date(now - 60 * 24 * 60 * 60 * 1000);

  const [recentOrders, priorOrders, activeSubscriptions, lowStockProducts, wishlistDocs] =
    await Promise.all([
      // Orders in the last 30 days
      MarketplaceOrder.find({ createdAt: { $gte: thirtyAgo } })
        .select('items createdAt').lean(),
      // Orders in the 30 days before that (days 31-60)
      MarketplaceOrder.find({ createdAt: { $gte: sixtyAgo, $lt: thirtyAgo } })
        .select('items').lean(),
      // Active subscriptions with upcoming delivery
      Subscription.find({ status: 'active' })
        .select('product frequency startDate endDate').lean(),
      // Products that are low or out of stock
      Product.find({ stock: { $in: ['Low', 'Out of Stock'] } })
        .select('id name brand category stock vendor itemNum').lean(),
      // All wishlist items
      Wishlist.find({}).select('productId name category brand').lean(),
    ]);

  // ── 1. Product velocity (units/week, last 30d vs prior 30d) ─────────────────
  const recentUnits = {};   // productName → units last 30d
  const priorUnits  = {};   // productName → units prior 30d

  for (const o of recentOrders) {
    for (const item of o.items || []) {
      const k = item.name;
      if (!recentUnits[k]) recentUnits[k] = { name: item.name, brand: item.brand, category: item.category, units: 0 };
      recentUnits[k].units += item.quantity;
    }
  }
  for (const o of priorOrders) {
    for (const item of o.items || []) {
      const k = item.name;
      if (!priorUnits[k]) priorUnits[k] = { units: 0 };
      priorUnits[k].units += item.quantity;
    }
  }

  // Weekly velocity = units / 4.33 weeks
  const velocityMap = {};
  for (const [name, data] of Object.entries(recentUnits)) {
    const recentWeekly = data.units / 4.33;
    const priorWeekly  = (priorUnits[name]?.units || 0) / 4.33;
    const trendPct     = priorWeekly > 0
      ? Math.round(((recentWeekly - priorWeekly) / priorWeekly) * 100)
      : (recentWeekly > 0 ? 100 : 0);
    velocityMap[name] = {
      name:          data.name,
      brand:         data.brand,
      category:      data.category,
      weeklyVelocity: +recentWeekly.toFixed(1),
      trendPct,                          // positive = growing, negative = declining
      unitsLast30d:  data.units,
    };
  }

  const topVelocity = Object.values(velocityMap)
    .sort((a, b) => b.weeklyVelocity - a.weeklyVelocity)
    .slice(0, 15);

  // ── 2. Reorder urgency — low/out-of-stock products that are also fast movers ─
  const urgentReorders = [];
  for (const product of lowStockProducts) {
    const vel = velocityMap[product.name];
    urgentReorders.push({
      name:           product.name,
      brand:          product.brand,
      category:       product.category,
      stock:          product.stock,
      vendor:         product.vendor || 'Unknown vendor',
      itemNum:        product.itemNum,
      weeklyVelocity: vel?.weeklyVelocity || 0,
      trendPct:       vel?.trendPct       || 0,
      // Suggested reorder = 4 weeks of supply
      suggestedQty:   vel ? Math.ceil(vel.weeklyVelocity * 4) : 10,
      urgency:        product.stock === 'Out of Stock' ? 'critical' : 'high',
    });
  }
  // Sort: out of stock first, then by velocity descending
  urgentReorders.sort((a, b) => {
    if (a.urgency !== b.urgency) return a.urgency === 'critical' ? -1 : 1;
    return b.weeklyVelocity - a.weeklyVelocity;
  });

  // ── 3. Subscription-driven demand forecast (next 30 days) ───────────────────
  const subForecast = {};
  for (const sub of activeSubscriptions) {
    const daysInterval = FREQ_DAYS[sub.frequency] || 30;
    // How many deliveries fall within the next 30 days?
    const deliveriesNext30 = Math.round(30 / daysInterval);
    if (deliveriesNext30 < 1) continue;
    const key = sub.product.name;
    if (!subForecast[key]) {
      subForecast[key] = {
        name:              sub.product.name,
        brand:             sub.product.brand,
        category:          sub.product.category,
        subscriberCount:   0,
        forecastedUnits:   0,
        frequencies:       {},
      };
    }
    subForecast[key].subscriberCount   += 1;
    subForecast[key].forecastedUnits   += deliveriesNext30;
    subForecast[key].frequencies[sub.frequency] =
      (subForecast[key].frequencies[sub.frequency] || 0) + 1;
  }
  const subscriptionForecast = Object.values(subForecast)
    .sort((a, b) => b.forecastedUnits - a.forecastedUnits)
    .slice(0, 10);

  // ── 4. Wishlist-to-purchase gap (high demand, low conversion) ───────────────
  const wishCounts = {};
  for (const w of wishlistDocs) {
    const key = w.name || String(w.productId);
    if (!wishCounts[key]) wishCounts[key] = { name: w.name || key, category: w.category, brand: w.brand, saves: 0 };
    wishCounts[key].saves++;
  }
  // Products wishlisted a lot but sold few/none recently
  const wishlistGap = Object.values(wishCounts)
    .map(w => ({
      ...w,
      recentSales: recentUnits[w.name]?.units || 0,
      gapScore: w.saves - (recentUnits[w.name]?.units || 0) * 0.5,
    }))
    .filter(w => w.saves >= 2)
    .sort((a, b) => b.gapScore - a.gapScore)
    .slice(0, 8);

  // ── 5. Trending products (fastest growing velocity) ─────────────────────────
  const trending = Object.values(velocityMap)
    .filter(v => v.trendPct > 0 && v.weeklyVelocity >= 1)
    .sort((a, b) => b.trendPct - a.trendPct)
    .slice(0, 8);

  return {
    urgentReorders:       urgentReorders.slice(0, 20),
    topVelocity,
    subscriptionForecast,
    wishlistGap,
    trending,
    meta: {
      lowStockCount:    lowStockProducts.filter(p => p.stock === 'Low').length,
      outOfStockCount:  lowStockProducts.filter(p => p.stock === 'Out of Stock').length,
      activeSubCount:   activeSubscriptions.length,
      analysisWindow:   '30 days',
    },
  };
}

// ── Build aggregated CRM data (no PII) ───────────────────────────────────────
async function buildCrmData() {
  const now       = new Date();
  const thirtyAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);
  const sixtyAgo  = new Date(now - 60 * 24 * 60 * 60 * 1000);

  const [
    allOrders,
    recentOrders,
    activityDocs,
    wishlists,
    subscriptions,
    totalUsers,
  ] = await Promise.all([
    MarketplaceOrder.find({}).select('user items total createdAt').lean(),
    MarketplaceOrder.find({ createdAt: { $gte: thirtyAgo } }).select('user items total createdAt').lean(),
    UserActivity.find({}).select('user searches purchases').lean(),
    Wishlist.find({}).select('productId name category brand').lean(),
    Subscription.find({}).select('frequency status product').lean(),
    User.countDocuments({ isAdmin: false, isSuperAdmin: false }),
  ]);

  // ── Shopping frequency ────────────────────────────────────────────────────
  const ordersByUser = {};
  for (const o of allOrders) {
    const uid = String(o.user);
    ordersByUser[uid] = (ordersByUser[uid] || 0) + 1;
  }
  const orderCounts  = Object.values(ordersByUser);
  const avgOrdersPerCustomer = orderCounts.length
    ? (orderCounts.reduce((s, n) => s + n, 0) / orderCounts.length).toFixed(2)
    : 0;
  const oneTimeCustomers  = orderCounts.filter(n => n === 1).length;
  const repeatCustomers   = orderCounts.filter(n => n > 1).length;
  const repeatRate        = orderCounts.length
    ? ((repeatCustomers / orderCounts.length) * 100).toFixed(1)
    : 0;

  // ── Lapsed customers (ordered before, nothing in last 60 days) ───────────
  const recentBuyerIds = new Set(recentOrders.map(o => String(o.user)));
  const allBuyerIds    = new Set(allOrders.map(o => String(o.user)));
  const lapsedCount    = [...allBuyerIds].filter(id => !recentBuyerIds.has(id)).length;

  // ── Average spend per customer ────────────────────────────────────────────
  const spendByUser = {};
  for (const o of allOrders) {
    const uid = String(o.user);
    spendByUser[uid] = (spendByUser[uid] || 0) + (o.total || 0);
  }
  const spends = Object.values(spendByUser);
  const avgSpend = spends.length
    ? (spends.reduce((s, n) => s + n, 0) / spends.length).toFixed(2)
    : 0;

  // High-value segment: top 20% by lifetime spend
  const sortedSpends = [...spends].sort((a, b) => b - a);
  const topThreshold = sortedSpends[Math.floor(sortedSpends.length * 0.2)] || 0;
  const highValueCount = spends.filter(s => s >= topThreshold && topThreshold > 0).length;

  // ── Preferred categories ──────────────────────────────────────────────────
  const categoryCounts = {};
  for (const o of allOrders) {
    for (const item of o.items || []) {
      if (item.category) categoryCounts[item.category] = (categoryCounts[item.category] || 0) + item.quantity;
    }
  }
  const topCategories = Object.entries(categoryCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([name, count]) => ({ name, count }));

  // ── Favourite brands ──────────────────────────────────────────────────────
  const brandCounts = {};
  for (const o of allOrders) {
    for (const item of o.items || []) {
      if (item.brand) brandCounts[item.brand] = (brandCounts[item.brand] || 0) + item.quantity;
    }
  }
  const topBrands = Object.entries(brandCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([name, count]) => ({ name, count }));

  // ── Top products ──────────────────────────────────────────────────────────
  const productCounts = {};
  for (const o of allOrders) {
    for (const item of o.items || []) {
      const key = item.name;
      if (!productCounts[key]) productCounts[key] = { name: item.name, category: item.category, brand: item.brand, count: 0 };
      productCounts[key].count += item.quantity;
    }
  }
  const topProducts = Object.values(productCounts)
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // ── Search trends ─────────────────────────────────────────────────────────
  const searchCounts = {};
  for (const doc of activityDocs) {
    for (const s of doc.searches || []) {
      const kw = s.keyword?.toLowerCase().trim();
      if (kw) searchCounts[kw] = (searchCounts[kw] || 0) + 1;
    }
  }
  const topSearches = Object.entries(searchCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([term, count]) => ({ term, count }));

  // ── Wishlist favourites ───────────────────────────────────────────────────
  const wishlistCounts = {};
  for (const w of wishlists) {
    const key = w.name || String(w.productId);
    if (!wishlistCounts[key]) wishlistCounts[key] = { name: w.name || key, category: w.category, brand: w.brand, count: 0 };
    wishlistCounts[key].count++;
  }
  const topWishlisted = Object.values(wishlistCounts)
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  // ── Subscription breakdown ────────────────────────────────────────────────
  const subByFreq = {};
  for (const s of subscriptions) {
    subByFreq[s.frequency] = (subByFreq[s.frequency] || 0) + 1;
  }
  const activeSubCount = subscriptions.filter(s => s.status === 'active').length;

  // ── Revenue summary ───────────────────────────────────────────────────────
  const totalRevenue       = allOrders.reduce((s, o) => s + (o.total || 0), 0);
  const recentRevenue30d   = recentOrders.reduce((s, o) => s + (o.total || 0), 0);

  return {
    overview: {
      totalOrders:        allOrders.length,
      ordersLast30d:      recentOrders.length,
      totalRevenue:       +totalRevenue.toFixed(2),
      revenueL30d:        +recentRevenue30d.toFixed(2),
      totalCustomers:     allBuyerIds.size,
      totalRegistered:    totalUsers,
      avgOrdersPerCustomer: +avgOrdersPerCustomer,
      avgSpendPerCustomer:  +avgSpend,
      repeatRate:           +repeatRate,
      oneTimeCustomers,
      repeatCustomers,
      lapsedCustomers:      lapsedCount,
      highValueCustomers:   highValueCount,
      activeSubscriptions:  activeSubCount,
    },
    topCategories,
    topBrands,
    topProducts,
    topSearches,
    topWishlisted,
    subscriptionFrequencies: subByFreq,
  };
}

// ── GET /api/admin/crm-insights ───────────────────────────────────────────────
router.get('/crm-insights', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const data = await buildCrmData();
    res.json({ success: true, data });
  } catch (err) {
    console.error('CRM insights error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── GET /api/admin/crm-predictions ───────────────────────────────────────────
router.get('/crm-predictions', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const data = await buildPredictiveData();
    res.json({ success: true, data });
  } catch (err) {
    console.error('CRM predictions error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── POST /api/admin/crm-chat ──────────────────────────────────────────────────
router.post('/crm-chat', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const { message, history } = req.body;
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ success: false, message: 'message is required' });
    }

    // Fetch both CRM and predictive data in parallel for the richest context
    const [crmData, predData] = await Promise.all([buildCrmData(), buildPredictiveData()]);

    const dataContext = `
=== SSAYE CLUB — LIVE CRM DATA SNAPSHOT ===

OVERVIEW:
- Total orders (all time): ${crmData.overview.totalOrders}
- Orders last 30 days: ${crmData.overview.ordersLast30d}
- Total revenue: $${crmData.overview.totalRevenue.toLocaleString()}
- Revenue last 30 days: $${crmData.overview.revenueL30d.toLocaleString()}
- Unique customers who have ordered: ${crmData.overview.totalCustomers}
- Total registered users: ${crmData.overview.totalRegistered}
- Avg orders per customer: ${crmData.overview.avgOrdersPerCustomer}
- Avg lifetime spend per customer: $${crmData.overview.avgSpendPerCustomer}
- Repeat purchase rate: ${crmData.overview.repeatRate}%
- One-time buyers: ${crmData.overview.oneTimeCustomers}
- Repeat buyers: ${crmData.overview.repeatCustomers}
- Lapsed customers (no order in 60+ days): ${crmData.overview.lapsedCustomers}
- High-value customers (top 20% by spend): ${crmData.overview.highValueCustomers}
- Active subscriptions: ${crmData.overview.activeSubscriptions}

TOP CATEGORIES BY UNITS SOLD:
${crmData.topCategories.map((c, i) => `${i + 1}. ${c.name} (${c.count} units)`).join('\n')}

TOP BRANDS BY UNITS SOLD:
${crmData.topBrands.map((b, i) => `${i + 1}. ${b.name} (${b.count} units)`).join('\n')}

TOP 10 PRODUCTS BY UNITS SOLD:
${crmData.topProducts.map((p, i) => `${i + 1}. ${p.name} [${p.category}] — ${p.count} units`).join('\n')}

TOP SEARCH TERMS:
${crmData.topSearches.map((s, i) => `${i + 1}. "${s.term}" (${s.count} searches)`).join('\n')}

MOST WISHLISTED PRODUCTS:
${crmData.topWishlisted.map((w, i) => `${i + 1}. ${w.name} [${w.category}] — ${w.count} saves`).join('\n')}

SUBSCRIPTION FREQUENCY BREAKDOWN:
${Object.entries(crmData.subscriptionFrequencies).map(([freq, count]) => `- ${freq}: ${count}`).join('\n') || 'No subscriptions yet'}

=== PREDICTIVE PROCUREMENT DATA ===

STOCK ALERT SUMMARY:
- Products Out of Stock: ${predData.meta.outOfStockCount}
- Products Low Stock: ${predData.meta.lowStockCount}
- Active subscriptions generating ongoing demand: ${predData.meta.activeSubCount}

URGENT REORDER LIST (ranked by urgency then velocity):
${predData.urgentReorders.length > 0
  ? predData.urgentReorders.map((p, i) =>
      `${i + 1}. [${p.urgency.toUpperCase()}] ${p.name} (${p.brand}) — ${p.stock} | ` +
      `${p.weeklyVelocity} units/week | Trend: ${p.trendPct >= 0 ? '+' : ''}${p.trendPct}% | ` +
      `Vendor: ${p.vendor} | Suggested reorder qty: ${p.suggestedQty} units`
    ).join('\n')
  : 'No urgent reorders — all selling products are in stock.'}

TOP VELOCITY PRODUCTS (units sold per week, last 30 days):
${predData.topVelocity.map((p, i) =>
  `${i + 1}. ${p.name} — ${p.weeklyVelocity} units/week | Trend: ${p.trendPct >= 0 ? '+' : ''}${p.trendPct}% vs prior period`
).join('\n')}

TRENDING PRODUCTS (fastest-growing sales velocity):
${predData.trending.length > 0
  ? predData.trending.map((p, i) =>
      `${i + 1}. ${p.name} [${p.category}] — +${p.trendPct}% growth | ${p.weeklyVelocity} units/week`
    ).join('\n')
  : 'Insufficient historical data to detect trends yet.'}

SUBSCRIPTION-DRIVEN DEMAND (units forecast needed in next 30 days):
${predData.subscriptionForecast.length > 0
  ? predData.subscriptionForecast.map((s, i) =>
      `${i + 1}. ${s.name} — ${s.subscriberCount} subscribers → ${s.forecastedUnits} units needed`
    ).join('\n')
  : 'No active subscriptions generating forecasted demand.'}

WISHLIST-TO-PURCHASE GAP (high intent, low conversion — promotion or stock opportunity):
${predData.wishlistGap.map((w, i) =>
  `${i + 1}. ${w.name} [${w.category}] — ${w.saves} saves but only ${w.recentSales} units sold recently`
).join('\n')}
`;

    const systemPrompt = `You are a senior CRM analyst AND procurement advisor for Ssaye Club, a South Asian grocery marketplace. You have access to live sales data, real-time stock levels, product velocity, subscription forecasts, and wishlist signals.

YOUR PRIMARY MISSION is to help the admin make smart, timely procurement (reorder) decisions — but you also handle CRM analysis and customer behaviour questions.

PROCUREMENT INTELLIGENCE RULES:
- When the admin asks what to order, be SPECIFIC: name the product, brand, suggested quantity (4 weeks of supply), urgency level, and which vendor to contact
- Always explain WHY a product needs reordering: is it out of stock? Is velocity spiking? Do subscriptions guarantee demand? Is wishlist demand not being met?
- Prioritise: CRITICAL (out of stock + selling) > HIGH (low stock + high velocity) > MEDIUM (trending up, in stock but watch)
- Factor in subscription forecasts — these are guaranteed demand, not probabilistic
- Flag the wishlist gap as a promotional opportunity, not just a stock opportunity
- If a product is out of stock but has near-zero velocity, deprioritise it

CRM ANALYSIS RULES:
- Answer in clear, business-focused English with concise bullet points
- Always cite specific numbers from the data
- Highlight growth opportunities and flag risks
- Suggest concrete next steps
- Never invent data not present in the snapshot
- Keep responses under 350 words unless asked to elaborate

${dataContext}`;

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const conversationHistory = (history || [])
      .filter(m => m.role !== 'system')
      .map(m => `${m.role === 'user' ? 'Admin' : 'Analyst'}: ${m.content}`)
      .join('\n');

    const prompt = conversationHistory
      ? `${systemPrompt}\n\n${conversationHistory}\nAdmin: ${message}\nAnalyst:`
      : `${systemPrompt}\n\nAdmin: ${message}\nAnalyst:`;

    const result   = await model.generateContent(prompt);
    const response = result.response.text();

    res.json({ success: true, response });
  } catch (err) {
    console.error('CRM chat error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
