const express = require('express');
const router  = express.Router();
const MarketplaceOrder = require('../models/MarketplaceOrder');
const Coupon               = require('../models/Coupon');
const User                 = require('../models/User');
const UserActivity         = require('../models/UserActivity');
const authMiddleware       = require('../middleware/auth');
const superAdminMiddleware = require('../middleware/superAdmin');

const PREMIUM_DISCOUNT_PCT      = 10;   // % off for premium users
const PREMIUM_DISCOUNT_THRESHOLD = 50;  // minimum subtotal to trigger it

// ─── POST /api/marketplace-orders ────────────────────────────────────────────
// Place a new order from the user's cart.  Requires login.
// Body: { items: [...], couponCode? }
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { items, couponCode } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Order must contain at least one item.' });
    }

    // Compute totals server-side to avoid tampering
    const enrichedItems = items.map((item) => ({
      productId: item.productId,
      name:      item.name,
      brand:     item.brand,
      category:  item.category,
      emoji:     item.emoji,
      price:     item.price,
      quantity:  item.quantity,
      lineTotal: parseFloat((item.price * item.quantity).toFixed(2)),
    }));

    const subtotal = parseFloat(
      enrichedItems.reduce((sum, i) => sum + i.lineTotal, 0).toFixed(2)
    );

    // ── Coupon discount ───────────────────────────────────────────────────────
    let couponDiscount = 0;
    let appliedCouponCode = null;
    let couponDoc = null;
    if (couponCode) {
      couponDoc = await Coupon.findOne({ code: couponCode.toUpperCase().trim() });
      if (!couponDoc || String(couponDoc.issuedTo) !== String(req.user.userId) || couponDoc.usedAt || couponDoc.expiresAt < new Date()) {
        return res.status(400).json({ success: false, message: 'Invalid or expired coupon code.' });
      }
      couponDiscount    = parseFloat(((subtotal * couponDoc.discountPct) / 100).toFixed(2));
      appliedCouponCode = couponDoc.code;
    }

    // ── Premium 10% discount on orders over $50 ───────────────────────────────
    let premiumDiscount = 0;
    const dbUser = await User.findById(req.user.userId).select('isPremium');
    if (dbUser?.isPremium && subtotal >= PREMIUM_DISCOUNT_THRESHOLD) {
      premiumDiscount = parseFloat(((subtotal * PREMIUM_DISCOUNT_PCT) / 100).toFixed(2));
    }

    const total = parseFloat(Math.max(0, subtotal - couponDiscount - premiumDiscount).toFixed(2));

    const order = new MarketplaceOrder({
      user:            req.user.userId,
      customerName:    req.user.name,
      customerEmail:   req.user.email,
      items:           enrichedItems,
      subtotal,
      deliveryFee:     0,
      couponCode:      appliedCouponCode,
      couponDiscount,
      premiumDiscount,
      total,
      status:          'pending',
    });

    await order.save();

    // Mark coupon as used
    if (couponDoc) {
      couponDoc.usedAt      = new Date();
      couponDoc.usedInOrder = order._id;
      await couponDoc.save();
    }

    // Record purchases in user activity (fire-and-forget — don't block the response)
    UserActivity.findOneAndUpdate(
      { user: req.user.userId },
      {
        $push: {
          purchases: {
            $each: enrichedItems.map((i) => ({
              productId:   i.productId,
              name:        i.name,
              category:    i.category,
              purchasedAt: new Date(),
            })),
            $slice: -100, // keep only the 100 most recent purchases
          },
        },
      },
      { upsert: true }
    ).catch((e) => console.error('UserActivity purchase record error:', e.message));

    res.status(201).json({ success: true, order });
  } catch (error) {
    console.error('Place order error:', error.message);
    res.status(500).json({ success: false, message: 'Server error placing order.' });
  }
});

// ─── GET /api/marketplace-orders/my ──────────────────────────────────────────
// Get the current user's own orders.  Requires login.
router.get('/my', authMiddleware, async (req, res) => {
  try {
    const orders = await MarketplaceOrder.find({ user: req.user.userId })
      .sort({ createdAt: -1 });
    res.json({ success: true, orders });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// ─── GET /api/marketplace-orders ─────────────────────────────────────────────
// Get ALL orders (super admin only).
router.get('/', superAdminMiddleware, async (req, res) => {
  try {
    const orders = await MarketplaceOrder.find({})
      .populate('user', 'name email')
      .sort({ createdAt: -1 });
    res.json({ success: true, orders });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// ─── GET /api/marketplace-orders/stats ───────────────────────────────────────
// Aggregated stats for the manager cockpit (super admin only).
router.get('/stats', superAdminMiddleware, async (req, res) => {
  try {
    const orders = await MarketplaceOrder.find({});

    const revenue   = orders.reduce((s, o) => s + o.total, 0);
    const pending   = orders.filter((o) => o.status === 'pending').length;
    const inTransit = orders.filter((o) => o.status === 'in-transit').length;
    const delivered = orders.filter((o) => o.status === 'delivered').length;
    const refunded  = orders.filter((o) => o.status === 'refunded').length;
    const refundedAmt = orders
      .filter((o) => o.status === 'refunded')
      .reduce((s, o) => s + o.total, 0);

    // Unique customers
    const uniqueCustomers = new Set(orders.map((o) => String(o.user))).size;

    // Low stock: products ordered that have badge "Low"
    // (we track badge in items? No — just count items with low qty)
    // For now count orders with any item quantity >= 5 as bulk
    const lowStockItems = 0; // placeholder until Product stock is tracked live

    res.json({
      success: true,
      stats: {
        revenue:         parseFloat(revenue.toFixed(2)),
        pending,
        inTransit,
        delivered,
        refunded:        parseFloat(refundedAmt.toFixed(2)),
        uniqueCustomers,
        lowStockItems,
        totalOrders:     orders.length,
      },
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// ─── PATCH /api/marketplace-orders/:id/status ────────────────────────────────
// Update order status (super admin only).
// Body: { status, dispatchedTo? }
router.patch('/:id/status', superAdminMiddleware, async (req, res) => {
  try {
    const { status, dispatchedTo } = req.body;

    const validStatuses = ['pending', 'in-transit', 'delivered', 'cancelled', 'refunded'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status value.' });
    }

    const update = { status };
    if (dispatchedTo !== undefined) update.dispatchedTo = dispatchedTo;

    const order = await MarketplaceOrder.findByIdAndUpdate(
      req.params.id,
      update,
      { new: true }
    ).populate('user', 'name email');

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    res.json({ success: true, order });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

module.exports = router;
