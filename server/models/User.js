const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    minlength: 2
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: 6
  },
  isAdmin: {
    type: Boolean,
    default: false
  },
  isSuperAdmin: {
    type: Boolean,
    default: false
  },
  isPremium: {
    type: Boolean,
    default: false
  },
  isDisabled: {
    type: Boolean,
    default: false
  },
  adminPermissions: {
    countries: {
      type: [String],
      default: []
    },
    assetTypes: {
      type: [String],
      default: []
    },
    minAmount: {
      type: Number,
      default: null
    },
    maxAmount: {
      type: Number,
      default: null
    }
  },
  notificationPreferences: {
    emailNotifications: {
      type: Boolean,
      default: true
    },
    investmentUpdates: {
      type: Boolean,
      default: true
    },
    portfolioAlerts: {
      type: Boolean,
      default: true
    },
    marketingEmails: {
      type: Boolean,
      default: false
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('User', userSchema);
