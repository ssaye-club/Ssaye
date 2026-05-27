/**
 * patchProductImages.js
 * One-time script: adds real product image URLs (from Open Food Facts CDN)
 * to a handful of products already in MongoDB.
 *
 * Run:  node server/scripts/patchProductImages.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Product  = require('../models/Product');

// ── Verified Open Food Facts image URLs ───────────────────────────────────────
// All images served from https://images.openfoodfacts.org (permanent CDN)
const IMAGE_PATCHES = [
  {
    id: 37,  // Haldiram's Bhujia 14 oz  (1,203 reviews — most popular snack)
    imageUrl: 'https://images.openfoodfacts.org/images/products/008/913/100/0086/front_en.7.400.jpg',
  },
  {
    id: 16,  // MDH Chana Masala 100g  (891 reviews — most popular spice)
    imageUrl: 'https://images.openfoodfacts.org/images/products/089/686/600/1510/front_en.11.400.jpg',
  },
  {
    id: 26,  // Aashirvaad Whole Wheat Atta 10 lbs  (347 reviews — top atta)
    imageUrl: 'https://images.openfoodfacts.org/images/products/000/785/202/0009/front_en.10.400.jpg',
  },
  {
    id: 31,  // Amul Pure Cow Ghee 32 oz  (678 reviews — top ghee)
    imageUrl: 'https://images.openfoodfacts.org/images/products/890/151/020/0013/front_en.20.400.jpg',
  },
  {
    id: 46,  // Patak's Hot Mango Chutney 12 oz  (320 reviews)
    imageUrl: 'https://images.openfoodfacts.org/images/products/005/631/007/4815/front_en.14.400.jpg',
  },
  {
    id: 11,  // Tilda Basmati 10 lbs  (444 reviews — top rice)
    imageUrl: 'https://images.openfoodfacts.org/images/products/500/034/040/1994/front_en.35.400.jpg',
  },
];

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('MongoDB connected');

  for (const patch of IMAGE_PATCHES) {
    const result = await Product.updateOne(
      { id: patch.id },
      { $set: { imageUrl: patch.imageUrl } }
    );
    console.log(`id=${patch.id} → matched=${result.matchedCount} modified=${result.modifiedCount}`);
  }

  await mongoose.disconnect();
  console.log('Done.');
}

run().catch((err) => { console.error(err); process.exit(1); });
