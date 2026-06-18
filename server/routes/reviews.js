const express = require('express');
const router = express.Router();
const Review = require('../models/Review');
const Product = require('../models/Product');
const authMiddleware = require('../middleware/auth');

// @route   GET /api/reviews/:productId
// @desc    Get all reviews for a product
// @access  Public
router.get('/:productId', async (req, res) => {
  try {
    const productId = Number(req.params.productId);
    if (isNaN(productId)) return res.status(400).json({ success: false, message: 'Invalid product id' });

    const reviews = await Review.find({ productId })
      .sort({ createdAt: -1 })
      .lean();

    res.json({ success: true, reviews });
  } catch (error) {
    console.error('Reviews fetch error:', error.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   POST /api/reviews/:productId
// @desc    Submit a review for a product (one per user per product)
// @access  Private
router.post('/:productId', authMiddleware, async (req, res) => {
  try {
    const productId = Number(req.params.productId);
    if (isNaN(productId)) return res.status(400).json({ success: false, message: 'Invalid product id' });

    const { rating, body, userName } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ success: false, message: 'Rating must be between 1 and 5' });
    }
    if (!body || !body.trim()) {
      return res.status(400).json({ success: false, message: 'Review text is required' });
    }

    const product = await Product.findOne({ id: productId });
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

    // Upsert: if user already reviewed this product, update it
    const review = await Review.findOneAndUpdate(
      { productId, user: req.user.userId },
      {
        rating,
        body: body.trim(),
        userName: (userName || 'Anonymous').trim(),
      },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    );

    // Recalculate aggregate rating on the product
    const agg = await Review.aggregate([
      { $match: { productId } },
      { $group: { _id: null, avg: { $avg: '$rating' }, count: { $sum: 1 } } },
    ]);

    if (agg.length > 0) {
      const { avg, count } = agg[0];
      await Product.updateOne(
        { id: productId },
        { rating: Math.round(avg * 10) / 10, reviews: count }
      );
    }

    res.json({ success: true, review });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ success: false, message: 'You have already reviewed this product' });
    }
    console.error('Review submit error:', error.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   DELETE /api/reviews/:productId
// @desc    Delete own review
// @access  Private
router.delete('/:productId', authMiddleware, async (req, res) => {
  try {
    const productId = Number(req.params.productId);
    const deleted = await Review.findOneAndDelete({ productId, user: req.user.userId });
    if (!deleted) return res.status(404).json({ success: false, message: 'Review not found' });

    // Recalculate aggregate
    const agg = await Review.aggregate([
      { $match: { productId } },
      { $group: { _id: null, avg: { $avg: '$rating' }, count: { $sum: 1 } } },
    ]);

    if (agg.length > 0) {
      const { avg, count } = agg[0];
      await Product.updateOne({ id: productId }, { rating: Math.round(avg * 10) / 10, reviews: count });
    } else {
      await Product.updateOne({ id: productId }, { rating: 0, reviews: 0 });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Review delete error:', error.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
