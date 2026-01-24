const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const InvestmentApplication = require('../models/InvestmentApplication');
const Investment = require('../models/Investment');
const InvestmentOpportunity = require('../models/InvestmentOpportunity');
const User = require('../models/User');
const { sendInvestmentConfirmationEmail, sendAdminApprovalEmail, sendFinalApprovalEmail } = require('../utils/emailService');

// @route   POST /api/investments/apply
// @desc    Submit an investment application
// @access  Private
router.post('/apply', auth, async (req, res) => {
  try {
    const application = new InvestmentApplication({
      user: req.user.userId,
      ...req.body
    });

    await application.save();

    // Send confirmation email
    const emailData = {
      applicationId: application._id.toString().slice(-8).toUpperCase(),
      investmentName: req.body.investmentName,
      investmentAmount: req.body.investmentAmount,
      fullName: req.body.fullName,
      email: req.body.email,
      phone: req.body.phone,
      country: req.body.country,
      submissionDate: application.createdAt || new Date()
    };

    // Send email asynchronously (don't wait for it)
    sendInvestmentConfirmationEmail(emailData).catch(err => {
      console.error('Failed to send confirmation email:', err);
    });

    res.json({
      success: true,
      message: 'Investment application submitted successfully',
      application
    });
  } catch (err) {
    console.error('Error submitting investment application:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/investments/my-applications
// @desc    Get current user's investment applications
// @access  Private
router.get('/my-applications', auth, async (req, res) => {
  try {
    const applications = await InvestmentApplication.find({ user: req.user.userId })
      .sort({ createdAt: -1 });

    res.json(applications);
  } catch (err) {
    console.error('Error fetching applications:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/investments/admin/all
// @desc    Get all investment applications (admin only)
// @access  Private + Admin
router.get('/admin/all', auth, async (req, res) => {
  try {
    // Check if user is admin
    const user = await User.findById(req.user.userId);
    if (!user.isAdmin) {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    // Build query based on admin permissions
    let query = {};
    
    // Apply country filter
    if (user.adminPermissions?.countries?.length > 0) {
      query.country = { $in: user.adminPermissions.countries };
    }
    
    // Apply asset type filter (based on investmentName containing the asset type)
    if (user.adminPermissions?.assetTypes?.length > 0) {
      const assetTypeRegex = user.adminPermissions.assetTypes.map(type => 
        new RegExp(type, 'i')
      );
      query.investmentName = { $in: assetTypeRegex };
    }
    
    // Apply amount range filter
    if (user.adminPermissions?.minAmount || user.adminPermissions?.maxAmount) {
      query.investmentAmount = {};
      if (user.adminPermissions.minAmount) {
        query.investmentAmount.$gte = user.adminPermissions.minAmount;
      }
      if (user.adminPermissions.maxAmount) {
        query.investmentAmount.$lte = user.adminPermissions.maxAmount;
      }
    }

    const applications = await InvestmentApplication.find(query)
      .populate('user', 'name email')
      .populate('reviewedBy', 'name')
      .sort({ createdAt: -1 });

    res.json(applications);
  } catch (err) {
    console.error('Error fetching all applications:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/investments/admin/review/:id
// @desc    Review an investment application (admin only)
// @access  Private + Admin
router.put('/admin/review/:id', auth, async (req, res) => {
  try {
    // Check if user is admin or super admin
    const user = await User.findById(req.user.userId);
    if (!user.isAdmin && !user.isSuperAdmin) {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    const { status, adminNotes } = req.body;

    if (!['waiting-payment', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const application = await InvestmentApplication.findById(req.params.id);
    
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    application.status = status;
    application.adminNotes = adminNotes || '';
    application.reviewedBy = req.user.userId;
    application.reviewedAt = new Date();

    await application.save();

    // Send admin approval email if status is set to 'waiting-payment'
    if (status === 'waiting-payment') {
      const emailData = {
        applicationId: application._id.toString().slice(-8).toUpperCase(),
        investmentName: application.investmentName,
        investmentAmount: application.investmentAmount,
        fullName: application.fullName,
        email: application.email,
        paymentMethod: application.paymentMethod || 'Not specified',
        adminNotes: application.adminNotes || ''
      };
      sendAdminApprovalEmail(emailData).catch(err => {
        console.error('Failed to send admin approval email:', err);
      });
    }

    // Populate user data before sending response
    await application.populate('user', 'name email');
    await application.populate('reviewedBy', 'name');

    res.json({
      success: true,
      message: `Application ${status === 'waiting-payment' ? 'set to awaiting payment' : 'rejected'}`,
      application
    });
  } catch (err) {
    console.error('Error reviewing application:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/investments/admin/approve/:id
// @desc    Approve investment after payment received (sends to super admin)
// @access  Private + Admin
router.put('/admin/approve/:id', auth, async (req, res) => {
  try {
    // Check if user is admin or super admin
    const user = await User.findById(req.user.userId);
    if (!user.isAdmin && !user.isSuperAdmin) {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    const { adminNotes } = req.body;

    const application = await InvestmentApplication.findById(req.params.id);
    
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    if (application.status !== 'waiting-payment') {
      return res.status(400).json({ message: 'Application must be in waiting-payment status' });
    }

    application.status = 'pending-final-approval';
    application.adminNotes = adminNotes || application.adminNotes;
    application.approvedByAdmin = req.user.userId;
    application.adminApprovedAt = new Date();

    await application.save();

    // Populate user data before sending response
    await application.populate('user', 'name email');
    await application.populate('approvedByAdmin', 'name');

    // Send admin approval email
    const emailData = {
      applicationId: application._id.toString().slice(-8).toUpperCase(),
      investmentName: application.investmentName,
      investmentAmount: application.investmentAmount,
      fullName: application.fullName,
      email: application.email,
      paymentMethod: application.paymentMethod || 'Not specified'
    };

    sendAdminApprovalEmail(emailData).catch(err => {
      console.error('Failed to send admin approval email:', err);
    });

    res.json({
      success: true,
      message: 'Investment approved and sent to super admin for final approval',
      application
    });
  } catch (err) {
    console.error('Error approving investment:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/investments/superadmin/final-approve/:id
// @desc    Final approval by super admin (creates investment)
// @access  Private + Super Admin
router.put('/superadmin/final-approve/:id', auth, async (req, res) => {
  try {
    // Check if user is super admin
    const user = await User.findById(req.user.userId);
    if (!user.isSuperAdmin) {
      return res.status(403).json({ message: 'Access denied. Super Admin only.' });
    }

    const { superAdminNotes } = req.body;

    const application = await InvestmentApplication.findById(req.params.id);
    
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    if (application.status !== 'pending-final-approval') {
      return res.status(400).json({ message: 'Application is not pending final approval' });
    }

    // Update application status
    application.status = 'approved';
    // Keep original admin notes and add super admin notes separately
    if (superAdminNotes) {
      application.superAdminNotes = superAdminNotes;
    }
    application.finalApprovedBy = req.user.userId;
    application.finalApprovedAt = new Date();
    await application.save();

    // Fetch the investment opportunity to get the real category
    const opportunity = await InvestmentOpportunity.findById(application.investmentId);
    
    // Use the actual category from the opportunity, or fallback to name-based detection
    let assetType = 'Other';
    if (opportunity && opportunity.category) {
      assetType = opportunity.category;
    } else {
      // Fallback: Determine asset type from investment name if opportunity not found
      const investmentNameLower = application.investmentName.toLowerCase();
      if (investmentNameLower.includes('real estate') || investmentNameLower.includes('apartment') || investmentNameLower.includes('township')) {
        assetType = 'Real Estate';
      } else if (investmentNameLower.includes('smart city') || investmentNameLower.includes('tech city')) {
        assetType = 'Smart Cities';
      } else if (investmentNameLower.includes('farm') || investmentNameLower.includes('agriculture') || investmentNameLower.includes('hydroponic')) {
        assetType = 'Urban Agriculture';
      } else if (investmentNameLower.includes('digital') || investmentNameLower.includes('blockchain') || investmentNameLower.includes('ai')) {
        assetType = 'Digital Assets';
      }
    }

    // Create the investment
    const investment = new Investment({
      user: application.user,
      applicationId: application._id,
      investmentOpportunityId: application.investmentId,
      investmentName: application.investmentName,
      investmentAmount: application.investmentAmount,
      investmentType: application.investmentType,
      assetType: assetType,
      currentValue: application.investmentAmount,
      returnRate: 0,
      purchaseDate: new Date()
    });

    await investment.save();

    // Populate application user data for email
    await application.populate('user', 'name email');

    // Send final approval email
    const emailData = {
      applicationId: application._id.toString().slice(-8).toUpperCase(),
      investmentName: application.investmentName,
      investmentAmount: application.investmentAmount,
      fullName: application.fullName,
      email: application.email
    };

    sendFinalApprovalEmail(emailData).catch(err => {
      console.error('Failed to send final approval email:', err);
    });

    res.json({
      success: true,
      message: 'Investment approved and added to user portfolio',
      application,
      investment
    });
  } catch (err) {
    console.error('Error final approving investment:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/investments/my-investments
// @desc    Get current user's approved investments
// @access  Private
router.get('/my-investments', auth, async (req, res) => {
  try {
    const investments = await Investment.find({ user: req.user.userId })
      .sort({ createdAt: -1 });

    res.json(investments);
  } catch (err) {
    console.error('Error fetching investments:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/investments/superadmin/pending-final
// @desc    Get applications pending final approval
// @access  Private + Super Admin
router.get('/superadmin/pending-final', auth, async (req, res) => {
  try {
    // Check if user is super admin
    const user = await User.findById(req.user.userId);
    if (!user.isSuperAdmin) {
      return res.status(403).json({ message: 'Access denied. Super Admin only.' });
    }

    const applications = await InvestmentApplication.find({ status: 'pending-final-approval' })
      .populate('user', 'name email')
      .populate('approvedByAdmin', 'name')
      .sort({ adminApprovedAt: -1 });

    res.json(applications);
  } catch (err) {
    console.error('Error fetching pending applications:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/investments/superadmin/approved
// @desc    Get all approved applications
// @access  Private + Super Admin
router.get('/superadmin/approved', auth, async (req, res) => {
  try {
    // Check if user is super admin
    const user = await User.findById(req.user.userId);
    if (!user.isSuperAdmin) {
      return res.status(403).json({ message: 'Access denied. Super Admin only.' });
    }

    const applications = await InvestmentApplication.find({ status: 'approved' })
      .populate('user', 'name email')
      .populate('finalApprovedBy', 'name')
      .sort({ finalApprovedAt: -1 });

    res.json(applications);
  } catch (err) {
    console.error('Error fetching approved applications:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/investments/portfolio-stats
// @desc    Get user's portfolio statistics
// @access  Private
router.get('/portfolio-stats', auth, async (req, res) => {
  try {
    const investments = await Investment.find({ 
      user: req.user.userId,
      status: 'active'
    });

    // Calculate statistics
    const totalInvestment = investments.reduce((sum, inv) => sum + inv.investmentAmount, 0);
    const currentValue = investments.reduce((sum, inv) => sum + inv.currentValue, 0);
    const totalReturn = currentValue - totalInvestment;
    const returnPercentage = totalInvestment > 0 ? ((totalReturn / totalInvestment) * 100) : 0;
    const activeInvestments = investments.length;

    // Calculate asset allocation
    const assetAllocation = investments.reduce((acc, inv) => {
      const type = inv.assetType;
      if (!acc[type]) {
        acc[type] = { value: 0, count: 0 };
      }
      acc[type].value += inv.currentValue;
      acc[type].count += 1;
      return acc;
    }, {});

    // Convert to percentage
    const assetAllocationPercentage = {};
    Object.keys(assetAllocation).forEach(key => {
      assetAllocationPercentage[key] = {
        value: assetAllocation[key].value,
        percentage: currentValue > 0 ? ((assetAllocation[key].value / currentValue) * 100) : 0,
        count: assetAllocation[key].count
      };
    });

    res.json({
      totalInvestment,
      currentValue,
      totalReturn,
      returnPercentage: Number(returnPercentage.toFixed(2)),
      activeInvestments,
      assetAllocation: assetAllocationPercentage
    });
  } catch (err) {
    console.error('Error fetching portfolio stats:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/investments/transactions
// @desc    Get user's investment transactions
// @access  Private
router.get('/transactions', auth, async (req, res) => {
  try {
    const investments = await Investment.find({ user: req.user.userId })
      .sort({ createdAt: -1 });

    // Create transaction history from investments
    const transactions = [];
    
    investments.forEach(inv => {
      // Add purchase transaction
      transactions.push({
        id: inv._id + '_purchase',
        type: 'Investment',
        asset: inv.investmentName,
        amount: inv.investmentAmount,
        date: inv.purchaseDate || inv.createdAt,
        status: 'Completed',
        investmentId: inv._id
      });

      // If there's a return (currentValue > investmentAmount), add return transaction
      if (inv.currentValue > inv.investmentAmount) {
        const returnAmount = inv.currentValue - inv.investmentAmount;
        transactions.push({
          id: inv._id + '_return',
          type: 'Return',
          asset: inv.investmentName,
          amount: returnAmount,
          date: inv.updatedAt || new Date(),
          status: 'Completed',
          investmentId: inv._id
        });
      }
    });

    // Sort by date descending
    transactions.sort((a, b) => new Date(b.date) - new Date(a.date));

    res.json(transactions);
  } catch (err) {
    console.error('Error fetching transactions:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/investments/performance
// @desc    Get user's portfolio performance over time
// @access  Private
router.get('/performance', auth, async (req, res) => {
  try {
    const investments = await Investment.find({ user: req.user.userId })
      .sort({ purchaseDate: 1 });

    if (investments.length === 0) {
      return res.json([]);
    }

    // Generate monthly performance data for last 6 months
    const monthsData = [];
    const now = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthName = monthDate.toLocaleDateString('en-US', { month: 'short' });
      
      // Calculate portfolio value at that month
      let monthValue = 0;
      investments.forEach(inv => {
        const invDate = new Date(inv.purchaseDate || inv.createdAt);
        if (invDate <= monthDate) {
          // Simple growth simulation based on return rate
          const monthsSinceInvestment = Math.max(0, (monthDate - invDate) / (1000 * 60 * 60 * 24 * 30));
          const growthRate = inv.returnRate > 0 ? inv.returnRate / 12 : 0.01; // Monthly rate or default 1%
          monthValue += inv.investmentAmount * (1 + (growthRate * monthsSinceInvestment));
        }
      });
      
      monthsData.push({
        month: monthName,
        value: Math.round(monthValue)
      });
    }

    res.json(monthsData);
  } catch (err) {
    console.error('Error fetching performance:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/investments/update-value/:id
// @desc    Update investment current value and return rate (for testing/admin)
// @access  Private
router.put('/update-value/:id', auth, async (req, res) => {
  try {
    const { currentValue, returnRate } = req.body;
    const investment = await Investment.findById(req.params.id);

    if (!investment) {
      return res.status(404).json({ message: 'Investment not found' });
    }

    // Check if user owns this investment or is admin
    const user = await User.findById(req.user.userId);
    if (investment.user.toString() !== req.user.userId && !user.isAdmin && !user.isSuperAdmin) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (currentValue !== undefined) {
      investment.currentValue = currentValue;
    }
    if (returnRate !== undefined) {
      investment.returnRate = returnRate;
    }

    await investment.save();

    res.json({
      success: true,
      message: 'Investment value updated',
      investment
    });
  } catch (err) {
    console.error('Error updating investment value:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
