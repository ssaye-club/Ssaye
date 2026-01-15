const mongoose = require('mongoose');

const investmentOpportunitySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true,
    enum: ['Multi-Family', 'Commercial', 'Mixed-Use', 'Residential', 'Industrial', 'Other']
  },
  location: {
    type: String,
    required: true
  },
  area: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  highlights: {
    type: [String],
    default: []
  },
  minInvestment: {
    type: Number,
    required: true
  },
  totalValue: {
    type: Number,
    required: true
  },
  expectedROI: {
    type: Number,
    required: true
  },
  duration: {
    type: String,
    required: true
  },
  riskLevel: {
    type: String,
    required: true,
    enum: ['Low', 'Medium', 'High']
  },
  status: {
    type: String,
    required: true,
    enum: ['Open', 'Funding', 'Closed', 'Completed'],
    default: 'Open'
  },
  availableShares: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  projectedCompletion: {
    type: String,
    required: true
  },
  images: {
    type: [String],
    default: []
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('InvestmentOpportunity', investmentOpportunitySchema);
