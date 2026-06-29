const express  = require('express');
const router   = express.Router();
const https    = require('https');
const Product  = require('../models/Product');
const authMiddleware = require('../middleware/auth');

const requireSuperAdmin = (req, res, next) => {
  if (!req.user?.isSuperAdmin) return res.status(403).json({ success: false, message: 'Super Admin only' });
  next();
};

// ── Open Food Facts image fetch ───────────────────────────────────────────────
function httpsGet(url) {
  return new Promise((resolve) => {
    const req = https.get(url, {
      headers: { 'User-Agent': 'SsayeClub/1.0 (contact@ssayeclub.com)' },
      timeout: 8000,
    }, (res) => {
      let raw = '';
      res.on('data', chunk => { raw += chunk; });
      res.on('end', () => {
        try { resolve(JSON.parse(raw)); } catch { resolve(null); }
      });
    });
    req.on('error', () => resolve(null));
    req.on('timeout', () => { req.destroy(); resolve(null); });
  });
}

async function fetchOFFImage(productName) {
  const query = productName
    .replace(/\d+(\.\d+)?\s*(lbs?|oz|g|kg|ml|ltr|ct|pc|bags?|pack)\b/gi, '')
    .trim();
  if (!query) return null;
  const url = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&json=1&page_size=5&fields=product_name,image_front_url`;
  const data = await httpsGet(url);
  const hit  = (data?.products || []).find(p => p.image_front_url);
  return hit ? hit.image_front_url : null;
}

// Fire-and-forget: fetch OFF images for a list of { id, name } objects
// Uses a 350ms delay between requests to be polite to the OFF API.
function enqueueImageFetch(newProducts) {
  if (!newProducts.length) return;
  console.log(`[OFF] Queuing image fetch for ${newProducts.length} new product(s)…`);
  (async () => {
    for (const { id, name } of newProducts) {
      try {
        const imageUrl = await fetchOFFImage(name);
        if (imageUrl) {
          await Product.updateOne({ id }, { $set: { imageUrl } });
          console.log(`[OFF] ✓ ${name}`);
        } else {
          console.log(`[OFF] – no image found for: ${name}`);
        }
      } catch (err) {
        console.warn(`[OFF] error for ${name}:`, err.message);
      }
      await new Promise(r => setTimeout(r, 350));
    }
    console.log('[OFF] Image fetch queue complete.');
  })();
}

// ── Category inference ────────────────────────────────────────────────────────
const CATEGORY_RULES = [
  { cat: 'Dal & Lentils',       kw: ['dal','lentil','chana','moong','masoor','urad','toor','mung','chick peas','chickpea','kala chana','fava','peas split','kidney bean','rajma','matki'] },
  { cat: 'Rice & Grains',       kw: ['rice','basmati','sona','jasmine','parboiled','sella','sonamasoori','jeerakasala','matta','kalijeera','brown rice'] },
  { cat: 'Spices & Masala',     kw: ['masala','spice','chili pdr','chilli pdr','chili powder','chilli powder','turmeric','cumin','coriander pdr','coriander powder','garam','mustard seed','fennel','cardamom','clove','cinnamon','bay leaf','methi seed','ajwain','kalonji','hing','asafoetida','sumac','paprika','chilli whole','chili whole','kashmiri','deggi','amchur','anardana','pepper'] },
  { cat: 'Atta & Flour',        kw: ['atta','flour','besan','maida','ragi flour','sooji','semolina','corn flour','rice flour','sattu','jowar flour','bajra flour','chakki','multigrain'] },
  { cat: 'Oils & Ghee',         kw: ['ghee','olive oil','coconut oil','mustard oil','sunflower oil','peanut oil','canola oil','vegetable oil','cooking oil','sesame oil','avani'] },
  { cat: 'Snacks & Namkeen',    kw: ['bhujia','namkeen','mixture','chivda','sev','boondi','chikki','biscuit','cookie','rusk','chips','murukku','thattai','papad','kurkure','lays','parle g','bourbon','marie','khakhra','gathiya','farsan','crackers','wafer','khari','mathri'] },
  { cat: 'Pickles & Chutneys',  kw: ['pickle','pkl','chutney','achar','achaar','tamarind conc','tamicon','imli'] },
  { cat: 'Frozen Foods',        kw: ['frozen','fzn','paratha','naan','samosa','dosa','idli','idly','roti','bhatura','kulcha','spring roll','kebab','kabab','haleem','parota','parotta','puri','thepla','lachha'] },
  { cat: 'Dairy & Paneer',      kw: ['paneer','yogurt','yoghurt','butter','lassi','dahi','milk','cream','cheese','labne','rasmalai','rasgulla','gulab jamun','kulfi','khoa','shrikand','gopi','amul dairy'] },
  { cat: 'Tea, Coffee & Drinks',kw: ['tea','coffee','drink','juice','nectar','mango drink','lemonade','barbican','vimto','rooh afza','nescafe','bru','chai','girnar','tapal','lipton','tetley','ahmad','horlicks','boost','ovaltine','milo'] },
  { cat: 'Sweets & Mithai',     kw: ['sweet','mithai','halwa','laddu','barfi','burfi','peda','jalebi','rasgulla','rasmalai','kalakand','soanpapdi','chikki','rajbhog','kheer','phirni','mukhwas'] },
  { cat: 'Fresh Produce',       kw: ['okra','bitter melon','karela','eggplant','spinach','methi','curry leaves','green mango','papaya','coconut fresh','tomato','onion','garlic','cabbage','cauliflower','potato','broccoli','lychee','guava','taro','tindora','drumstick'] },
  { cat: 'Meat & Seafood',      kw: ['chicken','goat','lamb','beef','turkey','fish','seafood','mutton','meat','chkn','ckn'] },
  { cat: 'Pooja Items',         kw: ['diya','incense','camphor','agarbatti','kumkum','haldi kumkum','rangoli','holi','pooja','puja','dhoop','sambrani','bindi','sindoor','gangajal','mala'] },
];

function inferCategory(name) {
  const lc = name.toLowerCase();
  for (const { cat, kw } of CATEGORY_RULES) {
    if (kw.some(k => lc.includes(k))) return cat;
  }
  return 'Snacks & Namkeen';
}

const CATEGORY_EMOJI = {
  'Dal & Lentils':'🫘','Rice & Grains':'🌾','Spices & Masala':'🌶️','Atta & Flour':'🌾',
  'Oils & Ghee':'🫙','Snacks & Namkeen':'🍿','Pickles & Chutneys':'🥭','Frozen Foods':'❄️',
  'Dairy & Paneer':'🧀','Tea, Coffee & Drinks':'☕','Sweets & Mithai':'🍮',
  'Fresh Produce':'🥬','Meat & Seafood':'🥩','Pooja Items':'🪔',
};

function stockStatus(qty) {
  if (qty <= 0) return 'Out of Stock';
  if (qty <= 5) return 'Low';
  return 'In Stock';
}

function parseBrand(name) {
  const known = ['24 Mantra','MDH','Shan','Rajah','MTR','Patak','Haldiram','Bikaji','Swagat','Roshni','Amul',
    'Gopi','Tilda','Royal','Aashirwad','Deep','Ashoka','Parle','Britannia','Nestle','Lipton','Ahmad','Tetley',
    'Nescafe','Brio','Avani','Parachute','Priya','National','KCB','Gits','Nanak','Vadilal','BC','BK','Mezban'];
  const lc = name.toLowerCase();
  for (const b of known) { if (lc.startsWith(b.toLowerCase())) return b; }
  return name.split(/\s+/)[0];
}

// ── POST /api/inventory/import — bulk upsert ──────────────────────────────────
router.post('/import', authMiddleware, requireSuperAdmin, async (req, res) => {
  try {
    const { csvText } = req.body;
    if (!csvText) return res.status(400).json({ success: false, message: 'csvText is required' });

    const lines = csvText.split('\n').map(l => l.trim()).filter(Boolean);
    if (lines.length < 2) return res.status(400).json({ success: false, message: 'CSV has no data rows' });

    const dataLines = lines[0].toLowerCase().includes('itemnum') ? lines.slice(1) : lines;

    // Parse all valid rows first
    const rows = [];
    let skipped = 0;
    for (const line of dataLines) {
      const parts = line.split(',');
      if (parts.length < 4) { skipped++; continue; }
      const itemNum  = parts[0].trim();
      const itemName = parts[1].trim();
      const inStock  = parseFloat(parts[2]);
      const price    = parseFloat(parts[3]);
      if (!itemName || isNaN(price) || price < 0) { skipped++; continue; }
      rows.push({ itemNum, itemName, inStock: isNaN(inStock) ? 0 : inStock, price });
    }

    if (rows.length === 0) return res.json({ success: true, results: { inserted: 0, updated: 0, skipped } });

    // Load all existing itemNums and names in one query
    const existingByItemNum = new Map();
    const existingByName    = new Map();
    const existing = await Product.find({
      $or: [
        { itemNum: { $in: rows.map(r => r.itemNum).filter(Boolean) } },
        { name:    { $in: rows.map(r => r.itemName) } },
      ]
    }).select('_id id itemNum name');

    for (const p of existing) {
      if (p.itemNum) existingByItemNum.set(p.itemNum, p._id);
      existingByName.set(p.name.toLowerCase(), p._id);
    }

    // Get next sequential id
    const maxDoc = await Product.findOne({}).sort({ id: -1 }).select('id');
    let nextId = maxDoc ? maxDoc.id + 1 : 1;

    const bulkOps = [];
    const newProducts = []; // track inserts for OFF image fetch
    let inserted = 0;
    let updated  = 0;

    for (const { itemNum, itemName, inStock, price } of rows) {
      const stock    = stockStatus(inStock);
      const existId  = existingByItemNum.get(itemNum) || existingByName.get(itemName.toLowerCase());

      if (existId) {
        bulkOps.push({
          updateOne: {
            filter: { _id: existId },
            update: { $set: { stock, price, itemNum } },
          }
        });
        updated++;
      } else {
        const category = inferCategory(itemName);
        const newId    = nextId++;
        bulkOps.push({
          insertOne: {
            document: {
              id: newId,
              itemNum,
              name:     itemName,
              brand:    parseBrand(itemName),
              category,
              price,
              stock,
              emoji:    CATEGORY_EMOJI[category] || '🛒',
              rating:   4.0,
              reviews:  0,
              badge:    null,
              imageUrl: null,
            }
          }
        });
        newProducts.push({ id: newId, name: itemName });
        inserted++;
      }
    }

    // Execute all ops in batches of 1000 to stay within MongoDB limits
    const BATCH = 1000;
    for (let i = 0; i < bulkOps.length; i += BATCH) {
      await Product.bulkWrite(bulkOps.slice(i, i + BATCH), { ordered: false });
    }

    // Respond immediately, then fetch OFF images in the background
    res.json({ success: true, results: { inserted, updated, skipped } });
    enqueueImageFetch(newProducts);
  } catch (err) {
    console.error('Inventory import error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── GET /api/inventory — paginated + filtered ─────────────────────────────────
router.get('/', authMiddleware, requireSuperAdmin, async (req, res) => {
  try {
    const page     = Math.max(1, parseInt(req.query.page)  || 1);
    const limit    = Math.min(100, parseInt(req.query.limit) || 50);
    const search   = req.query.search   || '';
    const category = req.query.category || '';
    const stock    = req.query.stock    || '';

    const filter = {};
    if (search)   filter.$or = [
      { name:    { $regex: search, $options: 'i' } },
      { itemNum: { $regex: search, $options: 'i' } },
      { brand:   { $regex: search, $options: 'i' } },
    ];
    if (category) filter.category = category;
    if (stock)    filter.stock    = stock;

    const [products, total, stockAgg] = await Promise.all([
      Product.find(filter)
        .sort({ id: 1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .select('id name brand category price stock emoji imageUrl itemNum updatedAt')
        .lean(),
      Product.countDocuments(filter),
      Product.aggregate([{ $group: { _id: '$stock', count: { $sum: 1 } } }]),
    ]);

    const stockCounts = { 'In Stock': 0, 'Low': 0, 'Out of Stock': 0 };
    for (const { _id, count } of stockAgg) { if (_id in stockCounts) stockCounts[_id] = count; }

    res.json({
      success: true,
      products,
      total,
      page,
      pages: Math.ceil(total / limit),
      stockCounts,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── DELETE /api/inventory/all ── wipe every product ──────────────────────────
router.delete('/all', authMiddleware, requireSuperAdmin, async (req, res) => {
  try {
    const result = await Product.deleteMany({});
    res.json({ success: true, deleted: result.deletedCount });
  } catch (err) {
    console.error('Clear inventory error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── PATCH /api/inventory/:id ── manual stock/price edit ───────────────────────
router.patch('/:id', authMiddleware, requireSuperAdmin, async (req, res) => {
  try {
    const { stock, price } = req.body;
    const product = await Product.findOneAndUpdate(
      { id: Number(req.params.id) },
      { $set: { ...(stock !== undefined && { stock }), ...(price !== undefined && { price }) } },
      { new: true }
    );
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    res.json({ success: true, product });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── PUT /api/inventory/:id/image ── set product image by numeric id ────────────
router.put('/:id/image', authMiddleware, requireSuperAdmin, async (req, res) => {
  try {
    const { imageUrl } = req.body;
    // imageUrl can be a data URL, a remote URL, or null (to remove)
    if (imageUrl !== null && typeof imageUrl !== 'string') {
      return res.status(400).json({ success: false, message: 'imageUrl must be a string or null' });
    }
    const product = await Product.findOneAndUpdate(
      { id: Number(req.params.id) },
      { $set: { imageUrl } },
      { new: true }
    );
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    res.json({ success: true, product });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── GET /api/inventory/search-by-itemnum ── look up a product by item # ────────
router.get('/search-by-itemnum', authMiddleware, requireSuperAdmin, async (req, res) => {
  try {
    const q = (req.query.q || '').trim();
    if (!q) return res.json({ success: true, products: [] });
    const products = await Product.find({
      $or: [
        { itemNum: { $regex: q, $options: 'i' } },
        { name:    { $regex: q, $options: 'i' } },
      ],
    })
      .select('id name brand category emoji itemNum imageUrl')
      .limit(20)
      .lean();
    res.json({ success: true, products });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── POST /api/inventory/backfill-images ── fetch OFF images for all products missing one ──
router.post('/backfill-images', authMiddleware, requireSuperAdmin, async (req, res) => {
  try {
    const missing = await Product.find({ $or: [{ imageUrl: null }, { imageUrl: '' }] })
      .select('id name')
      .lean();
    res.json({ success: true, queued: missing.length });
    enqueueImageFetch(missing.map(p => ({ id: p.id, name: p.name })));
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
