const express = require('express');
const cors = require('cors');
const path = require('path');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' })); // Increased limit for image uploads
app.use(express.urlencoded({ extended: true, limit: '50mb' })); // Increased limit for image uploads

// Request timeout middleware (set timeout for all routes)
app.use((req, res, next) => {
  // Set response timeout to 30 seconds
  res.setTimeout(30000, () => {
    res.status(408).json({ success: false, message: 'Request timeout' });
  });
  next();
});

// Database connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ssaye';

mongoose.connect(MONGODB_URI)
  .then(() => console.log('MongoDB connected successfully'))
  .catch(err => console.error('MongoDB connection error:', err));

// Routes
const authRoutes = require('./routes/auth');
const investmentRoutes = require('./routes/investments');
const superAdminRoutes = require('./routes/superadmin');
const opportunitiesRoutes = require('./routes/opportunities');
const marketRoutes = require('./routes/market');
const chatRoutes = require('./routes/chat');
const chatMarketplaceRoutes = require('./routes/chatMarketplace');
const productRoutes = require('./routes/products');
const marketplaceOrderRoutes = require('./routes/marketplaceOrders');
const productCompareRoutes   = require('./routes/productCompare');
const recommendationRoutes   = require('./routes/recommendations');
const subscriptionRoutes     = require('./routes/subscriptions');
const inventoryRoutes        = require('./routes/inventory');
const wishlistRoutes         = require('./routes/wishlist');
const reviewRoutes           = require('./routes/reviews');
app.use('/api/auth', authRoutes);
app.use('/api/investments', investmentRoutes);
app.use('/api/superadmin', superAdminRoutes);
app.use('/api/opportunities', opportunitiesRoutes);
app.use('/api/market', marketRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/chat/marketplace', chatMarketplaceRoutes);
app.use('/api/products', productRoutes);
app.use('/api/marketplace-orders', marketplaceOrderRoutes);
app.use('/api/compare', productCompareRoutes);
app.use('/api/recommendations', recommendationRoutes);
app.use('/api/subscriptions',  subscriptionRoutes);
app.use('/api/inventory',      inventoryRoutes);
app.use('/api/wishlist',       wishlistRoutes);
app.use('/api/reviews',        reviewRoutes);

// Basic routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'Server is running' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Endpoint not found' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Global error handler:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
  });
});

// Serve static assets in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/build')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/build', 'index.html'));
  });
}

const PORT = process.env.PORT || 5000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT}`);
});
