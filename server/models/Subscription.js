const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
  subscriptionNumber: { type: String, unique: true },

  user:          { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  customerName:  { type: String, required: true },
  customerEmail: { type: String, required: true },

  product: {
    productId: { type: Number, required: true },
    name:      { type: String, required: true },
    brand:     { type: String, required: true },
    category:  { type: String, required: true },
    emoji:     { type: String, required: true },
    price:     { type: Number, required: true },
  },

  frequency: {
    type: String,
    enum: ['weekly', 'biweekly', 'monthly', 'bimonthly', 'quarterly'],
    required: true,
  },

  startDate: { type: Date, required: true },
  endDate:   { type: Date, required: true },

  status: {
    type: String,
    enum: ['active', 'paused', 'cancelled', 'completed'],
    default: 'active',
  },

  notes: { type: String, default: '' },
}, { timestamps: true });

subscriptionSchema.pre('save', async function () {
  if (this.subscriptionNumber) return;
  const count = await mongoose.model('Subscription').countDocuments();
  this.subscriptionNumber = `SUB-${String(count + 1).padStart(3, '0')}`;
});

module.exports = mongoose.model('Subscription', subscriptionSchema);
