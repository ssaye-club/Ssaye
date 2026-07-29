const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
  code:         { type: String, required: true, unique: true, uppercase: true, trim: true },
  discountPct:  { type: Number, required: true, min: 1, max: 100 },
  issuedTo:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  expiresAt:    { type: Date, required: true },
  usedAt:       { type: Date, default: null },
  usedInOrder:  { type: mongoose.Schema.Types.ObjectId, ref: 'MarketplaceOrder', default: null },
}, { timestamps: true });

module.exports = mongoose.model('Coupon', couponSchema);
