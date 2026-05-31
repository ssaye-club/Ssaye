const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const UserActivity   = require('../models/UserActivity');
const authMiddleware = require('../middleware/auth');

// @route   GET /api/products
// @desc    Get all products sorted by id ascending
// @access  Public
router.get('/', async (req, res) => {
  try {
    const products = await Product.find({}).sort({ id: 1 });
    res.json({ success: true, products, count: products.length });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   GET /api/products/categories
// @desc    Get distinct list of categories
// @access  Public
router.get('/categories', async (req, res) => {
  try {
    const categories = await Product.distinct('category');
    res.json({ success: true, categories });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   GET /api/products/:id
// @desc    Get a single product by numeric id
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findOne({ id: Number(req.params.id) });
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    res.json({ success: true, product });
  } catch (error) {
    console.error(error.message);
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
      {
        $push: {
          searches: {
            $each: [{ keyword: kw, searchedAt: new Date() }],
            $slice: -50, // keep the 50 most recent searches
          },
        },
      },
      { upsert: true }
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Search activity error:', error.message);
    res.status(500).json({ success: false });
  }
});

module.exports = router;
