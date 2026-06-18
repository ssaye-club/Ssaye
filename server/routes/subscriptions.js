const express      = require('express');
const router       = express.Router();
const Subscription = require('../models/Subscription');
const authMiddleware = require('../middleware/auth');

// Inline super-admin check (reuses already-decoded req.user from authMiddleware)
const requireSuperAdmin = (req, res, next) => {
  if (!req.user?.isSuperAdmin) return res.status(403).json({ success: false, message: 'Super Admin only' });
  next();
};

// POST /api/subscriptions — create a new subscription (logged-in user)
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { product, frequency, startDate, endDate, notes } = req.body;

    if (!product || !frequency || !startDate || !endDate) {
      return res.status(400).json({ success: false, message: 'product, frequency, startDate and endDate are required' });
    }

    const start = new Date(startDate);
    const end   = new Date(endDate);
    if (isNaN(start) || isNaN(end) || end <= start) {
      return res.status(400).json({ success: false, message: 'endDate must be after startDate' });
    }

    const sub = new Subscription({
      user:          req.user.userId,
      customerName:  req.user.name,
      customerEmail: req.user.email,
      product,
      frequency,
      startDate: start,
      endDate:   end,
      notes:     notes || '',
    });

    await sub.save();
    res.status(201).json({ success: true, subscription: sub });
  } catch (err) {
    console.error('Subscription create error:', err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /api/subscriptions — list all subscriptions (super admin)
router.get('/', authMiddleware, requireSuperAdmin, async (req, res) => {
  try {
    const subs = await Subscription.find({})
      .populate('user', 'name email')
      .sort({ createdAt: -1 });
    res.json({ success: true, subscriptions: subs });
  } catch (err) {
    console.error('Subscription list error:', err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// PATCH /api/subscriptions/:id/status — update status (super admin)
router.patch('/:id/status', authMiddleware, requireSuperAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    const sub = await Subscription.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    if (!sub) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, subscription: sub });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
