const express = require('express');
const router  = express.Router();
const Coupon  = require('../models/Coupon');
const User    = require('../models/User');
const authMiddleware       = require('../middleware/auth');
const superAdminMiddleware = require('../middleware/superAdmin');

// ── POST /api/coupons/issue — super admin issues a coupon to a premium user ──
router.post('/issue', superAdminMiddleware, async (req, res) => {
  try {
    const { userId, discountPct, expiryDays = 30 } = req.body;
    if (!userId || !discountPct) {
      return res.status(400).json({ success: false, message: 'userId and discountPct are required' });
    }
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    if (!user.isPremium) return res.status(400).json({ success: false, message: 'Coupons can only be issued to premium users' });

    // Generate unique code: PREM-<random 6 chars>
    const code = 'PREM-' + Math.random().toString(36).substring(2, 8).toUpperCase();
    const expiresAt = new Date(Date.now() + expiryDays * 24 * 60 * 60 * 1000);

    const coupon = await Coupon.create({ code, discountPct, issuedTo: userId, expiresAt });
    res.status(201).json({ success: true, coupon });
  } catch (err) {
    console.error('Issue coupon error:', err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ── GET /api/coupons/my — list the logged-in user's unused, unexpired coupons ─
router.get('/my', authMiddleware, async (req, res) => {
  try {
    const coupons = await Coupon.find({
      issuedTo: req.user.userId,
      usedAt:   null,
      expiresAt: { $gt: new Date() },
    }).sort({ expiresAt: 1 });
    res.json({ success: true, coupons });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ── POST /api/coupons/validate — check a code before checkout ─────────────────
router.post('/validate', authMiddleware, async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) return res.status(400).json({ success: false, message: 'Coupon code required' });

    const coupon = await Coupon.findOne({ code: code.toUpperCase().trim() });
    if (!coupon)                                return res.status(404).json({ success: false, message: 'Invalid coupon code' });
    if (String(coupon.issuedTo) !== String(req.user.userId)) return res.status(403).json({ success: false, message: 'This coupon was not issued to your account' });
    if (coupon.usedAt)                          return res.status(400).json({ success: false, message: 'Coupon has already been used' });
    if (coupon.expiresAt < new Date())          return res.status(400).json({ success: false, message: 'Coupon has expired' });

    res.json({ success: true, discountPct: coupon.discountPct, code: coupon.code });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ── GET /api/coupons — super admin: list all coupons ─────────────────────────
router.get('/', superAdminMiddleware, async (req, res) => {
  try {
    const coupons = await Coupon.find({})
      .populate('issuedTo', 'name email isPremium')
      .sort({ createdAt: -1 });
    res.json({ success: true, coupons });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
