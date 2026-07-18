const express  = require('express');
const router   = express.Router();
const bcrypt   = require('bcryptjs');
const jwt      = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const Vendor   = require('../models/Vendor');
const vendorAuth    = require('../middleware/vendorAuth');
const superAdminAuth = require('../middleware/superAdmin');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// ── POST /api/vendor/auth/invite — super admin generates a one-time invite ───
router.post('/invite', superAdminAuth, (req, res) => {
  const token = jwt.sign({ purpose: 'vendor-invite' }, JWT_SECRET, { expiresIn: '72h' });
  res.json({ success: true, token });
});

// ── GET /api/vendor/auth/invite/verify — register page validates token ────────
router.get('/invite/verify', (req, res) => {
  const { token } = req.query;
  if (!token) return res.status(400).json({ valid: false, message: 'No token provided' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.purpose !== 'vendor-invite') throw new Error('Wrong purpose');
    res.json({ valid: true });
  } catch {
    res.status(401).json({ valid: false, message: 'Invite link is invalid or has expired' });
  }
});

// ── POST /api/vendor/auth/register ───────────────────────────────────────────
router.post(
  '/register',
  [
    body('inviteToken').notEmpty().withMessage('Invite token is required'),
    body('fullName').trim().notEmpty().withMessage('Full name is required'),
    body('businessName').trim().notEmpty().withMessage('Business name is required'),
    body('businessId').trim().notEmpty().withMessage('Business ID / licence is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('phone').trim().notEmpty().withMessage('Phone number is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const { inviteToken, fullName, businessName, businessId, email, phone, password } = req.body;

      // Verify invite token
      try {
        const decoded = jwt.verify(inviteToken, JWT_SECRET);
        if (decoded.purpose !== 'vendor-invite') throw new Error('Wrong purpose');
      } catch {
        return res.status(403).json({ success: false, message: 'Invalid or expired invite link' });
      }

      if (await Vendor.findOne({ email })) {
        return res.status(400).json({ success: false, message: 'An account with this email already exists' });
      }
      if (await Vendor.findOne({ businessId })) {
        return res.status(400).json({ success: false, message: 'This Business ID is already registered' });
      }

      const hashed = await bcrypt.hash(password, await bcrypt.genSalt(10));
      const vendor = await new Vendor({ fullName, businessName, businessId, email, phone, password: hashed }).save();

      res.status(201).json({
        success: true,
        message: 'Registration successful. Your account is under review — you will be notified once approved.',
        vendor: {
          id: vendor._id,
          fullName: vendor.fullName,
          businessName: vendor.businessName,
          email: vendor.email,
          status: vendor.status,
        },
      });
    } catch (err) {
      console.error('Vendor register error:', err.message);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  }
);

// ── POST /api/vendor/auth/login ───────────────────────────────────────────────
router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const { email, password } = req.body;
      const vendor = await Vendor.findOne({ email });
      if (!vendor) {
        return res.status(400).json({ success: false, message: 'Invalid credentials' });
      }

      const match = await bcrypt.compare(password, vendor.password);
      if (!match) {
        return res.status(400).json({ success: false, message: 'Invalid credentials' });
      }

      if (vendor.status === 'pending') {
        return res.status(403).json({
          success: false,
          message: 'Your account is pending approval. You will be notified once a super admin reviews your registration.',
          status: 'pending',
        });
      }
      if (vendor.status === 'suspended') {
        return res.status(403).json({
          success: false,
          message: 'Your vendor account has been suspended. Please contact support.',
          status: 'suspended',
        });
      }

      const token = jwt.sign(
        {
          vendorId: vendor._id,
          email: vendor.email,
          businessName: vendor.businessName,
          isVendor: true,
        },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '7d' }
      );

      res.json({
        success: true,
        token,
        vendor: {
          id: vendor._id,
          fullName: vendor.fullName,
          businessName: vendor.businessName,
          email: vendor.email,
          phone: vendor.phone,
          status: vendor.status,
        },
      });
    } catch (err) {
      console.error('Vendor login error:', err.message);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  }
);

// ── GET /api/vendor/auth/me ───────────────────────────────────────────────────
router.get('/me', vendorAuth, async (req, res) => {
  try {
    const vendor = await Vendor.findById(req.vendor.vendorId).select('-password');
    if (!vendor) return res.status(404).json({ success: false, message: 'Vendor not found' });
    res.json({ success: true, vendor });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ── PUT /api/vendor/auth/cert — submit / update business-level govt cert ─────
router.put('/cert', vendorAuth, async (req, res) => {
  try {
    const { regulatoryBody, licenceNumber, issuingCountry, expiryDate, documentData, documentName } = req.body;
    if (!regulatoryBody || !licenceNumber || !issuingCountry) {
      return res.status(400).json({ success: false, message: 'Regulatory body, licence number, and country are required' });
    }
    const vendor = await Vendor.findById(req.vendor.vendorId);
    if (!vendor) return res.status(404).json({ success: false, message: 'Vendor not found' });

    vendor.govtCert = {
      ...vendor.govtCert,
      regulatoryBody,
      licenceNumber,
      issuingCountry,
      expiryDate:   expiryDate   || null,
      documentData: documentData || vendor.govtCert?.documentData || null,
      documentName: documentName || vendor.govtCert?.documentName || '',
      status:       'pending_review',
      adminNotes:   '',
      reviewedAt:   null,
    };
    await vendor.save();
    res.json({ success: true, govtCert: vendor.govtCert });
  } catch (err) {
    console.error('Cert submit error:', err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
