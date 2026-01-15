const mongoose = require('mongoose');

const investmentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  applicationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'InvestmentApplication',
    required: true
  },
  investmentOpportunityId: {
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
  assetType: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'matured', 'withdrawn'],
    default: 'active'
  },
  currentValue: {
    type: Number,
    default: function() {
      return this.investmentAmount;
    }
  },
  returnRate: {
    type: Number,
    default: 0
  },
  purchaseDate: {
    type: Date,
    default: Date.now
  },
  maturityDate: {
    type: Date
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Investment', investmentSchema);
