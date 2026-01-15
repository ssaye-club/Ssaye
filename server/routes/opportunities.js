const express = require('express');
const router = express.Router();
const InvestmentOpportunity = require('../models/InvestmentOpportunity');
const superAdminMiddleware = require('../middleware/superAdmin');

// @route   GET /api/opportunities
// @desc    Get all active investment opportunities
// @access  Public
router.get('/', async (req, res) => {
  try {
    const opportunities = await InvestmentOpportunity.find({ isActive: true })
      .sort({ createdAt: -1 });
    res.json(opportunities);
  } catch (error) {
    console.error('Error fetching opportunities:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/opportunities/:id
// @desc    Get single investment opportunity
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const opportunity = await InvestmentOpportunity.findById(req.params.id);
    
    if (!opportunity) {
      return res.status(404).json({ message: 'Investment opportunity not found' });
    }

    res.json(opportunity);
  } catch (error) {
    console.error('Error fetching opportunity:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/opportunities/admin/all
// @desc    Get all investment opportunities (including inactive)
// @access  Super Admin only
router.get('/admin/all', superAdminMiddleware, async (req, res) => {
  try {
    const opportunities = await InvestmentOpportunity.find()
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });
    res.json(opportunities);
  } catch (error) {
    console.error('Error fetching all opportunities:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/opportunities
// @desc    Create new investment opportunity
// @access  Super Admin only
router.post('/', superAdminMiddleware, async (req, res) => {
  try {
    const opportunity = new InvestmentOpportunity({
      ...req.body,
      createdBy: req.user.userId
    });

    await opportunity.save();

    res.status(201).json({
      success: true,
      message: 'Investment opportunity created successfully',
      opportunity
    });
  } catch (error) {
    console.error('Error creating opportunity:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/opportunities/:id
// @desc    Update investment opportunity
// @access  Super Admin only
router.put('/:id', superAdminMiddleware, async (req, res) => {
  try {
    const opportunity = await InvestmentOpportunity.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );

    if (!opportunity) {
      return res.status(404).json({ message: 'Investment opportunity not found' });
    }

    res.json({
      success: true,
      message: 'Investment opportunity updated successfully',
      opportunity
    });
  } catch (error) {
    console.error('Error updating opportunity:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/opportunities/:id
// @desc    Delete investment opportunity
// @access  Super Admin only
router.delete('/:id', superAdminMiddleware, async (req, res) => {
  try {
    const opportunity = await InvestmentOpportunity.findByIdAndDelete(req.params.id);

    if (!opportunity) {
      return res.status(404).json({ message: 'Investment opportunity not found' });
    }

    res.json({
      success: true,
      message: 'Investment opportunity deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting opportunity:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/opportunities/:id/toggle-status
// @desc    Toggle active status of investment opportunity
// @access  Super Admin only
router.put('/:id/toggle-status', superAdminMiddleware, async (req, res) => {
  try {
    const opportunity = await InvestmentOpportunity.findById(req.params.id);

    if (!opportunity) {
      return res.status(404).json({ message: 'Investment opportunity not found' });
    }

    opportunity.isActive = !opportunity.isActive;
    await opportunity.save();

    res.json({
      success: true,
      message: `Investment opportunity ${opportunity.isActive ? 'activated' : 'deactivated'} successfully`,
      opportunity
    });
  } catch (error) {
    console.error('Error toggling opportunity status:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
