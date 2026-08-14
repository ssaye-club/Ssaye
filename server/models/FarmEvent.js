const mongoose = require('mongoose');

const farmEventSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, required: true, trim: true },
  date: { type: Date, required: true },
  location: { type: String, required: true, trim: true },
  poster: { type: String }, // base64 or URL
  capacity: { type: Number },
  category: {
    type: String,
    enum: ['Workshop', 'Tour', 'Farm-to-Table', 'Corporate', 'Community', 'Other'],
    default: 'Other',
  },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

module.exports = mongoose.model('FarmEvent', farmEventSchema);
