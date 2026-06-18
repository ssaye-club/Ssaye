const express = require('express');
const router = express.Router();
const Wishlist = require('../models/Wishlist');
const authMiddleware = require('../middleware/auth');

// GET /api/wishlist — fetch the logged-in user's wishlist
router.get('/', authMiddleware, async (req, res) => {
  try {
    const items = await Wishlist.find({ user: req.user.userId }).sort({ addedAt: -1 });
    res.json({ success: true, items });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// POST /api/wishlist — add a product to the wishlist
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { productId, name, brand, category, price, emoji, imageUrl } = req.body;
    if (!productId || !name) {
      return res.status(400).json({ success: false, message: 'productId and name are required' });
    }
    const item = await Wishlist.findOneAndUpdate(
      { user: req.user.userId, productId },
      { user: req.user.userId, productId, name, brand, category, price, emoji, imageUrl, addedAt: new Date() },
      { upsert: true, new: true }
    );
    res.json({ success: true, item });
  } catch (err) {
    if (err.code === 11000) return res.json({ success: true, message: 'Already in wishlist' });
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// DELETE /api/wishlist/:productId — remove a product from the wishlist
router.delete('/:productId', authMiddleware, async (req, res) => {
  try {
    await Wishlist.deleteOne({ user: req.user.userId, productId: Number(req.params.productId) });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
