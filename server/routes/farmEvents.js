const express = require('express');
const router = express.Router();
const FarmEvent = require('../models/FarmEvent');
const superAdminMiddleware = require('../middleware/superAdmin');
const authMiddleware = require('../middleware/auth');

// GET /api/farm-events — public, returns upcoming events sorted by date
router.get('/', async (req, res) => {
  try {
    const events = await FarmEvent.find()
      .sort({ date: 1 })
      .select('-__v');
    res.json(events);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/farm-events — superadmin/admin only
router.post('/', authMiddleware, async (req, res) => {
  try {
    if (!req.user.isSuperAdmin && !req.user.isAdmin) {
      return res.status(403).json({ message: 'Access denied' });
    }
    const { title, description, date, location, poster, capacity, category } = req.body;
    if (!title || !description || !date || !location) {
      return res.status(400).json({ message: 'title, description, date, and location are required' });
    }
    const event = new FarmEvent({
      title, description, date, location, poster, capacity, category,
      createdBy: req.user.userId,
    });
    await event.save();
    res.status(201).json(event);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/farm-events/:id — superadmin/admin only
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    if (!req.user.isSuperAdmin && !req.user.isAdmin) {
      return res.status(403).json({ message: 'Access denied' });
    }
    const event = await FarmEvent.findByIdAndDelete(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found' });
    res.json({ message: 'Event deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
