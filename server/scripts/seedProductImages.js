/**
 * Seeds imageUrl for every product using Open Food Facts API.
 * Run once: node server/scripts/seedProductImages.js
 *
 * Strategy: search Open Food Facts by product name → take the first result
 * that has an image_front_url. Falls back to a curated category image from
 * Wikimedia Commons (freely licensed, no API key required).
 */

require('dotenv').config({ path: require('path').join(__dirname, '../../server/.env') });
const mongoose = require('mongoose');
const Product  = require('../models/Product');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ssaye';

// ── Curated fallback images per category (Wikimedia Commons, freely licensed) ─
const CATEGORY_FALLBACKS = {
  'Dal & Lentils':       'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a1/24701-nature-natural-beauty.jpg/320px-24701-nature-natural-beauty.jpg',
  'Rice & Grains':       'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7f/White_rice.jpg/320px-White_rice.jpg',
  'Spices & Masala':     'https://upload.wikimedia.org/wikipedia/commons/thumb/4/44/Indian-Spices.jpg/320px-Indian-Spices.jpg',
  'Atta & Flour':        'https://upload.wikimedia.org/wikipedia/commons/thumb/8/87/Wheat_flour_in_a_bowl.jpg/320px-Wheat_flour_in_a_bowl.jpg',
  'Oils & Ghee':         'https://upload.wikimedia.org/wikipedia/commons/thumb/0/08/Sunflower_seeds_and_sunflower_oil.jpg/320px-Sunflower_seeds_and_sunflower_oil.jpg',
  'Snacks & Namkeen':    'https://upload.wikimedia.org/wikipedia/commons/thumb/9/91/Namkeen.jpg/320px-Namkeen.jpg',
  'Pickles & Chutneys':  'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3a/Mango_pickle.jpg/320px-Mango_pickle.jpg',
  'Frozen Foods':        'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2b/Frozen_Food_-_Aisle_at_Grocery_Store.jpg/320px-Frozen_Food_-_Aisle_at_Grocery_Store.jpg',
  'Dairy & Paneer':      'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e9/Paneer.jpg/320px-Paneer.jpg',
  'Tea, Coffee & Drinks':'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c6/Freshly_made_cup_of_tea.jpg/320px-Freshly_made_cup_of_tea.jpg',
  'Sweets & Mithai':     'https://upload.wikimedia.org/wikipedia/commons/thumb/5/53/Indian_Sweets.jpg/320px-Indian_Sweets.jpg',
  'Fresh Produce':       'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6d/Good_Food_Display_-_NCI_Visuals_Online.jpg/320px-Good_Food_Display_-_NCI_Visuals_Online.jpg',
  'Meat & Seafood':      'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a9/Fresh_beef.jpg/320px-Fresh_beef.jpg',
  'Pooja Items':         'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d5/Diya_Lamp_Diwali.jpg/320px-Diya_Lamp_Diwali.jpg',
};

// ── Search Open Food Facts ─────────────────────────────────────────────────────
async function searchOpenFoodFacts(name) {
  // strip units like "14 oz", "2 lbs", "400g" from the search query
  const query = name.replace(/\d+(\.\d+)?\s*(lbs?|oz|g|kg|ml|ltr|ct|pc|bags?|pack)\b/gi, '').trim();
  const url = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&json=1&page_size=5&fields=product_name,image_front_url`;

  try {
    const res = await fetch(url, { headers: { 'User-Agent': 'SsayeClub/1.0 (contact@ssaye.club)' } });
    if (!res.ok) return null;
    const data = await res.json();
    const hit = (data.products || []).find(p => p.image_front_url);
    return hit ? hit.image_front_url : null;
  } catch {
    return null;
  }
}

async function run() {
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB');

  const products = await Product.find({});
  console.log(`Processing ${products.length} products…\n`);

  let found = 0, fallback = 0;

  for (const product of products) {
    process.stdout.write(`[${product.id}] ${product.name} … `);

    let imageUrl = await searchOpenFoodFacts(product.name);

    if (imageUrl) {
      found++;
      process.stdout.write(`✓ OFF\n`);
    } else {
      imageUrl = CATEGORY_FALLBACKS[product.category] || null;
      fallback++;
      process.stdout.write(`→ category fallback\n`);
    }

    await Product.updateOne({ _id: product._id }, { $set: { imageUrl } });

    // Be polite to the Open Food Facts API
    await new Promise(r => setTimeout(r, 300));
  }

  console.log(`\nDone. ${found} from Open Food Facts, ${fallback} category fallbacks.`);
  await mongoose.disconnect();
}

run().catch(e => { console.error(e); process.exit(1); });
