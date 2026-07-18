const mongoose = require('mongoose');

const CATEGORIES = [
  'Dal & Lentils',
  'Rice & Grains',
  'Spices & Masala',
  'Atta & Flour',
  'Oils & Ghee',
  'Snacks & Namkeen',
  'Pickles & Chutneys',
  'Frozen Foods',
  'Dairy & Paneer',
  'Tea, Coffee & Drinks',
  'Sweets & Mithai',
  'Fresh Produce',
  'Meat & Seafood',
  'Pooja Items',
];

const vendorProductSchema = new mongoose.Schema(
  {
    vendorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vendor',
      required: true,
      index: true,
    },
    vendorBusinessName: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
    },
    brand: {
      type: String,
      required: [true, 'Brand is required'],
      trim: true,
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: CATEGORIES,
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: 0,
    },
    originalPrice: {
      type: Number,
      default: null,
    },
    unit: {
      type: String,
      default: '',
      trim: true,
    },
    stock: {
      type: String,
      enum: ['In Stock', 'Low', 'Out of Stock'],
      default: 'In Stock',
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    emoji: {
      type: String,
      default: '🛒',
    },
    imageUrl: {
      type: String,
      default: null,
    },
    // base64 data URI stored directly (for uploaded images)
    imageData: {
      type: String,
      default: null,
    },
    badge: {
      type: String,
      enum: [null, 'Low', 'Organic', 'Fresh', 'Halal'],
      default: null,
    },
    // Per-product certifications (Organic, Halal, Fresh)
    // A badge only shows on the public marketplace when its cert status = 'verified'
    certifications: {
      type: [
        {
          certType:      { type: String, enum: ['Organic', 'Halal', 'Fresh'], required: true },
          issuingBody:   { type: String, default: '' },
          licenceNumber: { type: String, default: '' },
          expiryDate:    { type: Date,   default: null },
          documentData:  { type: String, default: null }, // base64
          documentName:  { type: String, default: '' },
          status:        { type: String, enum: ['pending_review', 'verified', 'rejected'], default: 'pending_review' },
          adminNotes:    { type: String, default: '' },
          reviewedAt:    { type: Date,   default: null },
        },
      ],
      default: [],
    },
    isListed: {
      type: Boolean,
      default: true,
    },
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    reviews: {
      type: Number,
      default: 0,
    },
    pricingRules: {
      type: [
        {
          price:     { type: Number, required: true, min: 0 },
          minQty:    { type: Number, default: 1, min: 1 },
          maxQty:    { type: Number, default: null },   // null = no upper limit
          startDate: { type: Date,   default: null },   // null = always active from the start
          endDate:   { type: Date,   default: null },   // null = never expires
          label:     { type: String, default: '' },
        },
      ],
      default: [],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('VendorProduct', vendorProductSchema);
