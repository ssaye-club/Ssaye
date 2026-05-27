const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  productId:  { type: Number, required: true },
  name:       { type: String, required: true },
  brand:      { type: String, required: true },
  category:   { type: String, required: true },
  emoji:      { type: String, required: true },
  price:      { type: Number, required: true },
  quantity:   { type: Number, required: true, min: 1 },
  lineTotal:  { type: Number, required: true },
}, { _id: false });

const marketplaceOrderSchema = new mongoose.Schema({
  // Auto-incrementing human-readable order number  e.g. "ORD-001"
  orderNumber: {
    type: String,
    unique: true,
  },

  // Reference to the user who placed the order
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  customerName:  { type: String, required: true },
  customerEmail: { type: String, required: true },

  items: {
    type: [orderItemSchema],
    required: true,
    validate: [(v) => v.length > 0, 'Order must have at least one item'],
  },

  subtotal:     { type: Number, required: true },
  deliveryFee:  { type: Number, default: 0 },
  total:        { type: Number, required: true },

  status: {
    type: String,
    enum: ['pending', 'in-transit', 'delivered', 'cancelled', 'refunded'],
    default: 'pending',
  },

  // Optional: which vendor / store this is dispatched to
  dispatchedTo: { type: String, default: null },

  notes: { type: String, default: '' },
}, { timestamps: true });

// Auto-generate order number before saving (ORD-001, ORD-002 …)
marketplaceOrderSchema.pre('save', async function (next) {
  if (this.orderNumber) return next();
  try {
    const count = await mongoose.model('MarketplaceOrder').countDocuments();
    this.orderNumber = `ORD-${String(count + 1).padStart(3, '0')}`;
    next();
  } catch (err) {
    next(err);
  }
});

module.exports = mongoose.model('MarketplaceOrder', marketplaceOrderSchema);
