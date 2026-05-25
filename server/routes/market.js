const express = require('express');
const router = express.Router();

// @route   GET /api/market/data
// @desc    Get market index data (proxies Yahoo Finance to avoid CORS)
// @access  Public
router.get('/data', async (req, res) => {
  try {
    const { symbol, range, interval } = req.query;
    
    if (!symbol || !range || !interval) {
      return res.status(400).json({ message: 'Missing required parameters' });
    }

    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?range=${range}&interval=${interval}`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    res.json(data);
  } catch (error) {
    console.error('Error fetching market data:', error);
    res.status(500).json({ message: 'Failed to fetch market data', error: error.message });
  }
});

module.exports = router;
