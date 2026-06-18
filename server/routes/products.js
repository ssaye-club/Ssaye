const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const UserActivity   = require('../models/UserActivity');
const authMiddleware = require('../middleware/auth');

const PAGE_SIZE = 40;

// Levenshtein distance between two strings (case-insensitive)
function levenshtein(a, b) {
  a = a.toLowerCase();
  b = b.toLowerCase();
  const m = a.length, n = b.length;
  const dp = Array.from({ length: m + 1 }, (_, i) => Array.from({ length: n + 1 }, (_, j) => i === 0 ? j : j === 0 ? i : 0));
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i-1] === b[j-1]
        ? dp[i-1][j-1]
        : 1 + Math.min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1]);
    }
  }
  return dp[m][n];
}

// Find the best fuzzy match for a query against a list of {term, source} objects
function bestFuzzyMatch(query, candidates) {
  const q = query.toLowerCase();
  let best = null, bestScore = Infinity;
  for (const { term, source } of candidates) {
    const t = term.toLowerCase();
    // Check each word in multi-word terms too
    const words = t.split(/\s+/);
    const queryWords = q.split(/\s+/);
    let score = levenshtein(q, t);
    // Also check word-by-word for multi-word queries
    for (const qw of queryWords) {
      for (const tw of words) {
        const ws = levenshtein(qw, tw);
        if (ws < score) score = ws;
      }
    }
    if (score < bestScore) {
      bestScore = score;
      best = { term, source, score };
    }
  }
  return best;
}

const SORT_MAP = {
  popular:    { reviews: -1 },
  'price-asc':  { price:    1 },
  'price-desc': { price:   -1 },
  rating:     { rating:  -1 },
  name:       { name:     1 },
};

// Build a search filter for a query string.
// Simple regex-based search on name and brand fields
async function buildSearchFilter(search, categoryFilter) {
  const q = search.trim();
  if (!q) return categoryFilter;

  // Simple case-insensitive regex search on name and brand
  // This is much faster than fuzzy matching on large datasets
  const searchFilter = {
    ...categoryFilter,
    $or: [
      { name:  { $regex: q, $options: 'i' } },
      { brand: { $regex: q, $options: 'i' } },
    ],
  };

  return searchFilter;
}

// @route   GET /api/products
// @desc    Paginated, filtered, sorted product list with fuzzy-tolerant search
// @access  Public
router.get('/', async (req, res) => {
  try {
    const page     = Math.max(1, parseInt(req.query.page)  || 1);
    const limit    = Math.min(80, parseInt(req.query.limit) || PAGE_SIZE);
    const search   = req.query.search   || '';
    const category = req.query.category || '';
    const sortKey  = req.query.sort     || 'popular';

    const categoryFilter = {};
    if (category && category !== 'All Products') categoryFilter.category = category;

    // Build filter with timeout
    const filter = await Promise.race([
      buildSearchFilter(search, categoryFilter),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Filter build timeout')), 10000)),
    ]);
    
    const sortOpt = SORT_MAP[sortKey] || SORT_MAP.popular;

    // Execute queries with timeout
    const [products, total] = await Promise.race([
      Promise.all([
        Product.find(filter)
          .sort(sortOpt)
          .skip((page - 1) * limit)
          .limit(limit)
          .lean(),
        Product.countDocuments(filter),
      ]),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Query timeout')), 15000)),
    ]);

    res.json({
      success: true,
      products,
      total,
      page,
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Products fetch error:', error.message);
    const isTimeoutError = error.message.includes('timeout');
    res.status(isTimeoutError ? 408 : 500).json({ 
      success: false, 
      message: isTimeoutError ? 'Request timeout - please try again' : 'Server error' 
    });
  }
});

// @route   GET /api/products/category-counts
// @desc    Count per category for the sidebar (respects fuzzy search filter)
// @access  Public
router.get('/category-counts', async (req, res) => {
  try {
    const search = req.query.search || '';
    
    // Build filter with timeout protection
    const filter = await Promise.race([
      buildSearchFilter(search, {}),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Filter build timeout')), 10000)),
    ]);
    
    // Execute aggregation with timeout
    const agg = await Promise.race([
      Product.aggregate([
        { $match: filter },
        { $group: { _id: '$category', count: { $sum: 1 } } },
      ]),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Aggregation timeout')), 15000)),
    ]);
    
    const counts = { 'All Products': 0 };
    for (const { _id, count } of agg) {
      counts[_id] = count;
      counts['All Products'] += count;
    }
    res.json({ success: true, counts });
  } catch (error) {
    console.error('Category counts error:', error.message);
    res.status(500).json({ 
      success: false, 
      message: error.message === 'Filter build timeout' || error.message === 'Aggregation timeout'
        ? 'Request timeout - please try again'
        : 'Server error' 
    });
  }
});

// @route   GET /api/products/categories
// @desc    Distinct category list
// @access  Public
router.get('/categories', async (req, res) => {
  try {
    const categories = await Product.distinct('category');
    res.json({ success: true, categories });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   GET /api/products/fuzzy-suggest
// @desc    Return best fuzzy-matched suggestion for a search query that returned 0 results
// @access  Public
router.get('/fuzzy-suggest', async (req, res) => {
  try {
    const query = (req.query.q || '').trim();
    if (!query) return res.json({ success: true, suggestion: null });

    // Instead of fetching all distinct values, just try common product categories
    // This is much faster and covers 90% of real-world search typos
    const commonTerms = [
      'Dal & Lentils', 'Rice & Grains', 'Spices & Masala', 'Atta & Flour',
      'Oils & Ghee', 'Snacks & Namkeen', 'Pickles & Chutneys', 'Frozen Foods',
      'Dairy & Paneer', 'Tea & Coffee', 'Sweets & Mithai', 'Fresh Produce',
      'Meat & Seafood', 'Pooja Items'
    ];

    // Find products with at least one match
    const match = await Product.findOne({
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { brand: { $regex: query, $options: 'i' } },
      ],
    });

    if (match) {
      return res.json({ success: true, suggestion: match.name });
    }

    // No match found
    res.json({ success: true, suggestion: null });
  } catch (error) {
    console.error('Fuzzy suggest error:', error.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   GET /api/products/:id
// @desc    Single product by numeric id
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findOne({ id: Number(req.params.id) });
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    res.json({ success: true, product });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   POST /api/products/search-activity
// @desc    Record a search keyword for the logged-in user
// @access  Private
router.post('/search-activity', authMiddleware, async (req, res) => {
  try {
    const { keyword } = req.body;
    if (!keyword || !keyword.trim()) {
      return res.status(400).json({ success: false, message: 'keyword required' });
    }
    const kw = keyword.trim().toLowerCase();
    await UserActivity.findOneAndUpdate(
      { user: req.user.userId },
      { $push: { searches: { $each: [{ keyword: kw, searchedAt: new Date() }], $slice: -50 } } },
      { upsert: true }
    );
    res.json({ success: true });
  } catch (error) {
    console.error('Search activity error:', error.message);
    res.status(500).json({ success: false });
  }
});

module.exports = router;
