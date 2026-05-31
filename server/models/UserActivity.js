const mongoose = require('mongoose');

const userActivitySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
  },

  // Search keywords the user has typed, most recent first
  searches: [{
    keyword:   { type: String, required: true },
    searchedAt: { type: Date, default: Date.now },
  }],

  // Products the user has purchased (via cart checkout or Buy Now)
  purchases: [{
    productId:   { type: Number, required: true },
    name:        { type: String, required: true },
    category:    { type: String, required: true },
    purchasedAt: { type: Date, default: Date.now },
  }],
}, { timestamps: true });

module.exports = mongoose.model('UserActivity', userActivitySchema);
