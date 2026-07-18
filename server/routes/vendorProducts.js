const express  = require('express');
const router   = express.Router();
const { body, validationResult } = require('express-validator');
const VendorProduct = require('../models/VendorProduct');
const vendorAuth    = require('../middleware/vendorAuth');

const CATEGORIES = [
  'Dal & Lentils','Rice & Grains','Spices & Masala','Atta & Flour','Oils & Ghee',
  'Snacks & Namkeen','Pickles & Chutneys','Frozen Foods','Dairy & Paneer',
  'Tea, Coffee & Drinks','Sweets & Mithai','Fresh Produce','Meat & Seafood','Pooja Items',
];

const CATEGORY_EMOJI_SERVER = {
  'Dal & Lentils':'🫘','Rice & Grains':'🌾','Spices & Masala':'🌶️','Atta & Flour':'🌾',
  'Oils & Ghee':'🫙','Snacks & Namkeen':'🍿','Pickles & Chutneys':'🥭','Frozen Foods':'❄️',
  'Dairy & Paneer':'🧀','Tea, Coffee & Drinks':'☕','Sweets & Mithai':'🍮',
  'Fresh Produce':'🥬','Meat & Seafood':'🥩','Pooja Items':'🪔',
};

// ── GET /api/vendor/products  — list own products ────────────────────────────
router.get('/', vendorAuth, async (req, res) => {
  try {
    const products = await VendorProduct.find({ vendorId: req.vendor.vendorId }).sort({ createdAt: -1 });
    res.json({ success: true, products });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ── POST /api/vendor/products — add a product ─────────────────────────────────
router.post(
  '/',
  vendorAuth,
  [
    body('name').trim().notEmpty().withMessage('Product name is required'),
    body('brand').trim().notEmpty().withMessage('Brand is required'),
    body('category').isIn(CATEGORIES).withMessage('Invalid category'),
    body('price').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const {
        name, brand, category, price, originalPrice,
        unit, stock, description, emoji, imageUrl, imageData, badge,
      } = req.body;

      const product = await new VendorProduct({
        vendorId: req.vendor.vendorId,
        vendorBusinessName: req.vendor.businessName,
        name, brand, category,
        price: parseFloat(price),
        originalPrice: originalPrice ? parseFloat(originalPrice) : null,
        unit: unit || '',
        stock: stock || 'In Stock',
        description: description || '',
        emoji: emoji || '🛒',
        imageUrl: imageUrl || null,
        imageData: imageData || null,
        badge: badge || null,
      }).save();

      res.status(201).json({ success: true, product });
    } catch (err) {
      console.error('Add vendor product error:', err.message);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  }
);

// ── PATCH /api/vendor/products/:id — update a product ────────────────────────
router.patch('/:id', vendorAuth, async (req, res) => {
  try {
    const product = await VendorProduct.findOne({ _id: req.params.id, vendorId: req.vendor.vendorId });
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

    const allowed = ['name','brand','category','price','originalPrice','unit','stock','description','emoji','imageUrl','imageData','badge','isListed','pricingRules'];
    for (const key of allowed) {
      if (req.body[key] !== undefined) product[key] = req.body[key];
    }
    await product.save();
    res.json({ success: true, product });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ── POST /api/vendor/products/bulk — CSV catalogue import ────────────────────
router.post('/bulk', vendorAuth, async (req, res) => {
  try {
    const { products } = req.body;
    if (!Array.isArray(products) || products.length === 0) {
      return res.status(400).json({ success: false, message: 'No products provided' });
    }
    if (products.length > 500) {
      return res.status(400).json({ success: false, message: 'Maximum 500 products per upload' });
    }

    const docs = [];
    const errors = [];

    products.forEach((row, i) => {
      const name  = (row.name  || '').trim();
      const brand = (row.brand || '').trim();
      const price = parseFloat(row.price);
      const category = (row.category || '').trim();

      if (!name)                         { errors.push(`Row ${i + 1}: name is required`); return; }
      if (!brand)                        { errors.push(`Row ${i + 1}: brand is required`); return; }
      if (isNaN(price) || price < 0)    { errors.push(`Row ${i + 1}: invalid price`);    return; }
      if (!CATEGORIES.includes(category)) { errors.push(`Row ${i + 1}: unknown category "${category}"`); return; }

      const stockRaw = (row.stock || 'In Stock').trim();
      const stockMap = { 'in stock': 'In Stock', 'low': 'Low', 'out of stock': 'Out of Stock' };
      const stock    = stockMap[stockRaw.toLowerCase()] || 'In Stock';

      docs.push({
        vendorId:           req.vendor.vendorId,
        vendorBusinessName: req.vendor.businessName,
        name,
        brand,
        category,
        price,
        originalPrice: row.originalPrice ? parseFloat(row.originalPrice) : null,
        unit:          (row.unit        || '').trim(),
        stock,
        description:   (row.description || '').trim(),
        emoji:         CATEGORY_EMOJI_SERVER[category] || '🛒',
        badge:         row.badge || null,
        isListed:      true,
      });
    });

    if (errors.length > 0 && docs.length === 0) {
      return res.status(400).json({ success: false, message: 'All rows had errors', errors });
    }

    const inserted = await VendorProduct.insertMany(docs, { ordered: false });
    res.status(201).json({
      success: true,
      inserted: inserted.length,
      skipped:  products.length - docs.length,
      errors:   errors.length ? errors : undefined,
    });
  } catch (err) {
    console.error('Bulk import error:', err.message);
    res.status(500).json({ success: false, message: 'Server error during bulk import' });
  }
});

// ── PUT /api/vendor/products/:id/cert — submit a product-level cert ──────────
router.put('/:id/cert', vendorAuth, async (req, res) => {
  try {
    const product = await VendorProduct.findOne({ _id: req.params.id, vendorId: req.vendor.vendorId });
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

    const { certType, issuingBody, licenceNumber, expiryDate, documentData, documentName } = req.body;
    const VALID_TYPES = ['Organic', 'Halal', 'Fresh'];
    if (!VALID_TYPES.includes(certType)) {
      return res.status(400).json({ success: false, message: 'certType must be Organic, Halal, or Fresh' });
    }
    if (!issuingBody || !licenceNumber) {
      return res.status(400).json({ success: false, message: 'Issuing body and licence number are required' });
    }

    const existing = product.certifications.find(c => c.certType === certType);
    if (existing) {
      existing.issuingBody   = issuingBody;
      existing.licenceNumber = licenceNumber;
      existing.expiryDate    = expiryDate    || null;
      existing.documentData  = documentData  || existing.documentData || null;
      existing.documentName  = documentName  || existing.documentName || '';
      existing.status        = 'pending_review';
      existing.adminNotes    = '';
      existing.reviewedAt    = null;
    } else {
      product.certifications.push({ certType, issuingBody, licenceNumber, expiryDate: expiryDate || null, documentData: documentData || null, documentName: documentName || '', status: 'pending_review' });
    }

    await product.save();
    res.json({ success: true, certifications: product.certifications });
  } catch (err) {
    console.error('Product cert submit error:', err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ── DELETE /api/vendor/products/:id ──────────────────────────────────────────
router.delete('/:id', vendorAuth, async (req, res) => {
  try {
    const product = await VendorProduct.findOneAndDelete({ _id: req.params.id, vendorId: req.vendor.vendorId });
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    res.json({ success: true, message: 'Product deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
