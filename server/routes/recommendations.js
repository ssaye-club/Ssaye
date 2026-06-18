const express = require('express');
const router  = express.Router();
const UserActivity   = require('../models/UserActivity');
const Wishlist       = require('../models/Wishlist');
const Product        = require('../models/Product');
const authMiddleware = require('../middleware/auth');

// ─── GET /api/recommendations ─────────────────────────────────────────────────
// Returns up to 8 products ranked by how well they match the user's past
// searches and purchases.  Requires login.
router.get('/', authMiddleware, async (req, res) => {
  try {
    const [activity, wishlistItems] = await Promise.all([
      UserActivity.findOne({ user: req.user.userId }),
      Wishlist.find({ user: req.user.userId }),
    ]);

    const wishlistedIds = new Set(wishlistItems.map(w => w.productId));

    // No activity yet — show wishlisted items only, or empty
    if (!activity || (activity.searches.length === 0 && activity.purchases.length === 0)) {
      if (wishlistItems.length === 0) return res.json({ success: true, products: [] });
      const wishlistProds = await Product.find({ id: { $in: [...wishlistedIds] } }).lean();
      return res.json({ success: true, products: wishlistProds.slice(0, 8) });
    }

    const allProducts = await Product.find({});

    // ── Build scoring signals ──────────────────────────────────────────────────

    // Category scores: each purchase in a category adds 3 pts, each search
    // keyword that matches a category name adds 1 pt
    const categoryScore = {};
    const keywordSet    = new Set();

    for (const p of activity.purchases) {
      categoryScore[p.category] = (categoryScore[p.category] || 0) + 3;
    }

    for (const s of activity.searches) {
      const kw = s.keyword.toLowerCase();
      keywordSet.add(kw);
      // If keyword matches a category name, boost that category
      for (const cat of Object.keys(categoryScore)) {
        if (cat.toLowerCase().includes(kw)) {
          categoryScore[cat] = (categoryScore[cat] || 0) + 1;
        }
      }
      // Also scan all products to find matching categories from search terms
      for (const prod of allProducts) {
        if (prod.category.toLowerCase().includes(kw)) {
          categoryScore[prod.category] = (categoryScore[prod.category] || 0) + 1;
        }
      }
    }

    // Set of already-purchased product IDs so we can de-prioritise (not exclude)
    const purchasedIds = new Set(activity.purchases.map((p) => p.productId));

    // ── Score every product ────────────────────────────────────────────────────
    const scored = allProducts.map((prod) => {
      let score = 0;

      // Category match
      score += categoryScore[prod.category] || 0;

      // Keyword match against product name or brand
      const haystack = `${prod.name} ${prod.brand}`.toLowerCase();
      for (const kw of keywordSet) {
        if (haystack.includes(kw)) score += 2;
      }

      // Slight penalty for already-purchased items (still show, just ranked lower)
      if (purchasedIds.has(prod.id)) score -= 1;

      // Strong boost for wishlisted items — surfaces them prominently when in stock
      if (wishlistedIds.has(prod.id)) score += 10;

      // Boost highly-rated products slightly to surface quality items
      score += prod.rating * 0.2;

      return { product: prod, score };
    });

    // Sort descending; always include wishlisted items, drop others with score <= 0
    const recommendations = scored
      .filter((s) => s.score > 0 || wishlistedIds.has(s.product.id))
      .sort((a, b) => b.score - a.score)
      .slice(0, 8)
      .map((s) => s.product);

    res.json({ success: true, products: recommendations });
  } catch (error) {
    console.error('Recommendations error:', error.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
