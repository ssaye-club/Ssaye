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
app.use('/api/auth', authRoutes);
app.use('/api/investments', investmentRoutes);
app.use('/api/superadmin', superAdminRoutes);
app.use('/api/opportunities', opportunitiesRoutes);

// Basic routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'Server is running' });
});

// Serve static assets in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/build')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/build', 'index.html'));
  });
}

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
