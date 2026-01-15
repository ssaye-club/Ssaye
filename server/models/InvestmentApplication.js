const mongoose = require('mongoose');

const investmentApplicationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Investment details
  investmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'InvestmentOpportunity',
    required: true
  },
  investmentName: {
    type: String,
    required: true
  },
  investmentAmount: {
    type: Number,
    required: true
  },
  investmentType: {
    type: String,
    enum: ['one-time', 'recurring'],
    required: true
  },
  paymentMethod: {
    type: String,
    enum: ['bank-transfer', 'wire-transfer', 'check', 'crypto'],
    required: true
  },
  // Personal information
  fullName: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  phone: {
    type: String,
    required: true
  },
  address: {
    type: String,
    required: true
  },
  city: {
    type: String,
    required: true
  },
  state: {
    type: String,
    required: true
  },
  zipCode: {
    type: String,
    required: true
  },
  country: {
    type: String,
    required: true
  },
  // Application status
  status: {
    type: String,
    enum: ['pending', 'waiting-payment', 'payment-received', 'pending-final-approval', 'approved', 'rejected', 'completed'],
    default: 'pending'
  },
  // Admin notes
  adminNotes: {
    type: String,
    default: ''
  },
  superAdminNotes: {
    type: String,
    default: ''
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  reviewedAt: {
    type: Date
  },
  approvedByAdmin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  adminApprovedAt: {
    type: Date
  },
  finalApprovedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  finalApprovedAt: {
    type: Date
  },
  // Agreements
  agreeTerms: {
    type: Boolean,
    required: true
  },
  agreeRiskDisclosure: {
    type: Boolean,
    required: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('InvestmentApplication', investmentApplicationSchema);
