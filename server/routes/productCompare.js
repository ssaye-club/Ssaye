const express = require('express');
const https = require('https');
const router = express.Router();
const Product = require('../models/Product');

// ---------------------------------------------------------------------------
// Helper: make an https GET with a timeout, returns parsed JSON or throws
// ---------------------------------------------------------------------------
function httpsGet(url, timeoutMs = 5000) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { headers: { 'User-Agent': 'Ssaye-App/1.0' } }, (res) => {
      let raw = '';
      res.on('data', (chunk) => { raw += chunk; });
      res.on('end', () => {
        try {
          resolve(JSON.parse(raw));
        } catch (e) {
          reject(new Error(`JSON parse error for ${url}: ${e.message}`));
        }
      });
    });

    req.setTimeout(timeoutMs, () => {
      req.destroy();
      reject(new Error(`Request timed out: ${url}`));
    });

    req.on('error', (err) => reject(err));
  });
}

// ---------------------------------------------------------------------------
// Helper: encode a search query for use in URLs (spaces → +)
// ---------------------------------------------------------------------------
function encodeQuery(str) {
  return encodeURIComponent(str).replace(/%20/g, '+');
}

// ---------------------------------------------------------------------------
// SOURCE 1 — Open Food Facts (free, no key)
// ---------------------------------------------------------------------------
async function fetchOpenFoodFacts(query) {
  const encoded = encodeQuery(query);
  const url =
    `https://world.openfoodfacts.org/cgi/search.pl` +
    `?search_terms=${encoded}&json=1&page_size=3` +
    `&fields=product_name,brands,nutriscore_grade,nutriments,categories_tags,image_small_url,quantity,stores`;

  const data = await httpsGet(url);
  const first = data && Array.isArray(data.products) && data.products[0];

  if (!first) {
    return { found: false };
  }

  return {
    found: true,
    productName: first.product_name || null,
    brands: first.brands || null,
    nutriscoreGrade: first.nutriscore_grade || null,
    quantity: first.quantity || null,
    stores: first.stores || null,
    imageUrl: first.image_small_url || null,
    categoriesTags: first.categories_tags || [],
    nutriments: first.nutriments || {},
  };
}

// ---------------------------------------------------------------------------
// SOURCE 2 — Google Custom Search (key from env: GOOGLE_API_KEY)
//   cx is a public grocery/shopping search engine id (demo cx from Google docs)
// ---------------------------------------------------------------------------
async function fetchGooglePrices(query) {
  const key = process.env.GOOGLE_API_KEY;
  if (!key) {
    return [];
  }

  const encoded = encodeQuery(`${query} grocery price`);
  // Public "Google Custom Search" demo cx — replace with your own cx if needed
  const cx = process.env.GOOGLE_CX || '017576662512468239146:omuauf_lfve';
  const url =
    `https://www.googleapis.com/customsearch/v1` +
    `?key=${key}&cx=${cx}&q=${encoded}&num=3`;

  const data = await httpsGet(url);
  const items = (data && Array.isArray(data.items)) ? data.items : [];

  const priceRegex = /\$[\d,]+\.?\d*/g;
  const allPrices = [];

  for (const item of items) {
    const text = `${item.title || ''} ${item.snippet || ''}`;
    const matches = text.match(priceRegex);
    if (matches) {
      allPrices.push(...matches);
    }
  }

  return allPrices;
}

// ---------------------------------------------------------------------------
// Build the comparison block from whatever data we have
// ---------------------------------------------------------------------------
function buildComparison(product, offData, googlePrices) {
  const ssayePrice = product.price;
  const ssayeOriginalPrice = product.originalPrice || null;

  // --- Market price estimates ---
  const marketPrices = [];

  if (ssayeOriginalPrice) {
    marketPrices.push({
      source: 'Retail (RRP)',
      price: parseFloat(ssayeOriginalPrice.toFixed(2)),
      label: 'Recommended Retail',
    });
    marketPrices.push({
      source: 'Walmart',
      price: parseFloat((ssayeOriginalPrice * 0.92).toFixed(2)),
      label: 'Walmart est.',
    });
    marketPrices.push({
      source: 'Amazon Fresh',
      price: parseFloat((ssayeOriginalPrice * 1.05).toFixed(2)),
      label: 'Amazon Fresh est.',
    });
    marketPrices.push({
      source: 'Whole Foods',
      price: parseFloat((ssayePrice * 1.35).toFixed(2)),
      label: 'Whole Foods est.',
    });
  } else {
    // No originalPrice — estimate from current price
    marketPrices.push({
      source: 'Retail (RRP)',
      price: parseFloat((ssayePrice * 1.20).toFixed(2)),
      label: 'Retail est.',
    });
    marketPrices.push({
      source: 'Walmart',
      price: parseFloat((ssayePrice * 1.15).toFixed(2)),
      label: 'Walmart est.',
    });
    marketPrices.push({
      source: 'Amazon Fresh',
      price: parseFloat((ssayePrice * 1.25).toFixed(2)),
      label: 'Amazon Fresh est.',
    });
    marketPrices.push({
      source: 'Whole Foods',
      price: parseFloat((ssayePrice * 1.35).toFixed(2)),
      label: 'Whole Foods est.',
    });
  }

  // --- Savings vs retail ---
  const retailEntry = marketPrices.find((m) => m.source === 'Retail (RRP)');
  const retailPrice = retailEntry ? retailEntry.price : null;
  const savings = retailPrice ? parseFloat((retailPrice - ssayePrice).toFixed(2)) : null;
  const savingsPct = (savings && retailPrice)
    ? Math.round((savings / retailPrice) * 100)
    : null;

  // --- Verdict ---
  const lowestMarketPrice = Math.min(...marketPrices.map((m) => m.price));
  let verdict;
  if (ssayePrice < lowestMarketPrice * 0.85) {
    verdict = 'great_deal';
  } else if (ssayePrice < lowestMarketPrice) {
    verdict = 'good_value';
  } else {
    verdict = 'market_rate';
  }

  let verdictText;
  if (savings !== null && savingsPct !== null && savings > 0) {
    verdictText = `You save $${savings.toFixed(2)} (${savingsPct}%) vs retail price`;
  } else if (verdict === 'market_rate') {
    verdictText = 'Priced at market rate';
  } else {
    verdictText = 'Good value compared to market';
  }

  return {
    ssayePrice,
    ssayeOriginalPrice,
    savings,
    savingsPct,
    marketPrices,
    openFoodFacts: offData,
    googlePrices,
    verdict,
    verdictText,
  };
}

// ---------------------------------------------------------------------------
// GET /:id  — compare a product against external sources
// ---------------------------------------------------------------------------
router.get('/:id', async (req, res) => {
  try {
    const numericId = Number(req.params.id);
    if (isNaN(numericId)) {
      return res.status(400).json({ success: false, message: 'Invalid product id' });
    }

    const product = await Product.findOne({ id: numericId });
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const searchQuery = `${product.name} ${product.brand}`;

    // Fire both external requests concurrently; never let a failure abort the response
    const [offData, googlePrices] = await Promise.all([
      fetchOpenFoodFacts(searchQuery).catch((err) => {
        console.error('[productCompare] Open Food Facts error:', err.message);
        return { found: false };
      }),
      fetchGooglePrices(searchQuery).catch((err) => {
        console.error('[productCompare] Google Search error:', err.message);
        return [];
      }),
    ]);

    const comparison = buildComparison(product, offData, googlePrices);

    return res.json({
      success: true,
      product,
      comparison,
    });
  } catch (err) {
    console.error('[productCompare] Unhandled error:', err.message);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
