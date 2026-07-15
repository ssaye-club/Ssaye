const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    id: {
      type: Number,
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    brand: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      required: true,
      enum: [
        "Dal & Lentils",
        "Rice & Grains",
        "Spices & Masala",
        "Atta & Flour",
        "Oils & Ghee",
        "Snacks & Namkeen",
        "Pickles & Chutneys",
        "Frozen Foods",
        "Dairy & Paneer",
        "Tea, Coffee & Drinks",
        "Sweets & Mithai",
        "Fresh Produce",
        "Meat & Seafood",
        "Pooja Items",
      ],
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    originalPrice: {
      type: Number,
      default: null,
    },
    rating: {
      type: Number,
      required: true,
      min: 0,
      max: 5,
    },
    reviews: {
      type: Number,
      default: 0,
    },
    stock: {
      type: String,
      enum: ["In Stock", "Low", "Out of Stock"],
      default: "In Stock",
    },
    emoji: {
      type: String,
      required: true,
    },
    badge: {
      type: String,
      enum: [null, "Low", "Organic", "Fresh", "Halal"],
      default: null,
    },
    imageUrl: {
      type: String,
      default: null,
    },
    itemNum: {
      type: String,
      default: null,
      index: true,
    },
    vendor: {
      type: String,
      default: null,
      index: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Product', productSchema);
