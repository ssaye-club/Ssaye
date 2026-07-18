const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Vendor = require('../models/Vendor');
const VendorProduct = require('../models/VendorProduct');
const superAdminMiddleware = require('../middleware/superAdmin');

// @route   GET /api/superadmin/users
// @desc    Get all users
// @access  Super Admin only
router.get('/users', superAdminMiddleware, async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/superadmin/users/:id/promote-admin
// @desc    Promote user to admin
// @access  Super Admin only
router.put('/users/:id/promote-admin', superAdminMiddleware, async (req, res) => {
  try {
    const { countries, assetTypes, minAmount, maxAmount } = req.body;
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Prevent promoting super admin
    if (user.isSuperAdmin) {
      return res.status(400).json({ message: 'Cannot modify super admin status' });
    }

    user.isAdmin = true;
    user.adminPermissions = {
      countries: countries || [],
      assetTypes: assetTypes || [],
      minAmount: minAmount || null,
      maxAmount: maxAmount || null
    };
    await user.save();

    res.json({ 
      message: 'User promoted to admin successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        isAdmin: user.isAdmin,
        isSuperAdmin: user.isSuperAdmin,
        adminPermissions: user.adminPermissions
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/superadmin/users/:id/demote-admin
// @desc    Demote admin to regular user
// @access  Super Admin only
router.put('/users/:id/demote-admin', superAdminMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Prevent demoting super admin
    if (user.isSuperAdmin) {
      return res.status(400).json({ message: 'Cannot modify super admin status' });
    }

    user.isAdmin = false;
    await user.save();

    res.json({ 
      message: 'Admin demoted to user successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        isAdmin: user.isAdmin,
        isSuperAdmin: user.isSuperAdmin
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/superadmin/users/:id
// @desc    Delete user
// @access  Super Admin only
router.delete('/users/:id', superAdminMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Prevent deleting super admin
    if (user.isSuperAdmin) {
      return res.status(400).json({ message: 'Cannot delete super admin' });
    }

    await User.findByIdAndDelete(req.params.id);

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/superadmin/stats
// @desc    Get platform statistics
// @access  Super Admin only
router.get('/stats', superAdminMiddleware, async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalAdmins = await User.countDocuments({ isAdmin: true, isSuperAdmin: false });
    const totalSuperAdmins = await User.countDocuments({ isSuperAdmin: true });
    const regularUsers = await User.countDocuments({ isAdmin: false, isSuperAdmin: false });

    // Get recent users
    const recentUsers = await User.find()
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(10);

    res.json({
      totalUsers,
      totalAdmins,
      totalSuperAdmins,
      regularUsers,
      recentUsers
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/superadmin/users/:id/update-permissions
// @desc    Update admin permissions
// @access  Super Admin only
router.put('/users/:id/update-permissions', superAdminMiddleware, async (req, res) => {
  try {
    const { countries, assetTypes, minAmount, maxAmount } = req.body;
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Prevent modifying super admin
    if (user.isSuperAdmin) {
      return res.status(400).json({ message: 'Cannot modify super admin permissions' });
    }

    // Only update permissions for admins
    if (!user.isAdmin) {
      return res.status(400).json({ message: 'User is not an admin' });
    }

    user.adminPermissions = {
      countries: countries || [],
      assetTypes: assetTypes || [],
      minAmount: minAmount || null,
      maxAmount: maxAmount || null
    };
    await user.save();

    res.json({ 
      message: 'Admin permissions updated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        isAdmin: user.isAdmin,
        isSuperAdmin: user.isSuperAdmin,
        adminPermissions: user.adminPermissions
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/superadmin/users/:id/disable
// @desc    Disable user account
// @access  Super Admin only
router.put('/users/:id/disable', superAdminMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Prevent disabling super admin
    if (user.isSuperAdmin) {
      return res.status(400).json({ message: 'Cannot disable super admin' });
    }

    user.isDisabled = true;
    await user.save();

    res.json({ 
      message: 'User account disabled successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        isDisabled: user.isDisabled
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/superadmin/users/:id/enable
// @desc    Enable user account
// @access  Super Admin only
router.put('/users/:id/enable', superAdminMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.isDisabled = false;
    await user.save();

    res.json({ 
      message: 'User account enabled successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        isDisabled: user.isDisabled
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/superadmin/users/:id/toggle-premium
// @desc    Toggle user premium status
// @access  Super Admin only
router.put('/users/:id/toggle-premium', superAdminMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Prevent modifying super admin premium status
    if (user.isSuperAdmin) {
      return res.status(400).json({ message: 'Cannot modify super admin premium status' });
    }

    user.isPremium = !user.isPremium;
    await user.save();

    res.json({ 
      message: `User premium status ${user.isPremium ? 'enabled' : 'disabled'} successfully`,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        isPremium: user.isPremium
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ── GET /api/superadmin/vendors — list all vendors ───────────────────────────
router.get('/vendors', superAdminMiddleware, async (req, res) => {
  try {
    const vendors = await Vendor.find().select('-password').sort({ createdAt: -1 });
    res.json({ success: true, vendors });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ── PATCH /api/superadmin/vendors/:id/status — approve / suspend ─────────────
router.patch('/vendors/:id/status', superAdminMiddleware, async (req, res) => {
  try {
    const { status } = req.body;
    if (!['approved', 'suspended', 'pending'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }
    const vendor = await Vendor.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    ).select('-password');
    if (!vendor) return res.status(404).json({ success: false, message: 'Vendor not found' });
    res.json({ success: true, vendor });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ── PATCH /api/superadmin/vendors/:id/cert — review vendor govt cert ─────────
router.patch('/vendors/:id/cert', superAdminMiddleware, async (req, res) => {
  try {
    const { status, adminNotes } = req.body;
    if (!['verified', 'rejected', 'pending_review'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid cert status' });
    }
    const vendor = await Vendor.findById(req.params.id);
    if (!vendor) return res.status(404).json({ success: false, message: 'Vendor not found' });

    vendor.govtCert.status     = status;
    vendor.govtCert.adminNotes = adminNotes || '';
    vendor.govtCert.reviewedAt = new Date();
    await vendor.save();
    res.json({ success: true, govtCert: vendor.govtCert });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ── GET /api/superadmin/vendor-products — all vendor products with certs ──────
router.get('/vendor-products', superAdminMiddleware, async (req, res) => {
  try {
    const products = await VendorProduct.find({ 'certifications.0': { $exists: true } })
      .select('-imageData -pricingRules')
      .sort({ createdAt: -1 });
    res.json({ success: true, products });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ── PATCH /api/superadmin/vendor-products/:id/cert/:certType — review product cert
router.patch('/vendor-products/:id/cert/:certType', superAdminMiddleware, async (req, res) => {
  try {
    const { status, adminNotes } = req.body;
    if (!['verified', 'rejected', 'pending_review'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid cert status' });
    }
    const product = await VendorProduct.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

    const cert = product.certifications.find(c => c.certType === req.params.certType);
    if (!cert) return res.status(404).json({ success: false, message: 'Certification not found' });

    cert.status     = status;
    cert.adminNotes = adminNotes || '';
    cert.reviewedAt = new Date();

    // Sync badge: set if verified, clear if rejected and badge matches this cert type
    if (status === 'verified') {
      product.badge = cert.certType;
    } else if (status === 'rejected' && product.badge === cert.certType) {
      product.badge = null;
    }

    await product.save();
    res.json({ success: true, certifications: product.certifications, badge: product.badge });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
