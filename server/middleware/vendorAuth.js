const jwt = require('jsonwebtoken');

const vendorAuthMiddleware = (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ success: false, message: 'No token, authorisation denied' });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    if (!decoded.isVendor) {
      return res.status(403).json({ success: false, message: 'Vendor access only' });
    }
    req.vendor = decoded;
    next();
  } catch {
    res.status(401).json({ success: false, message: 'Token is not valid' });
  }
};

module.exports = vendorAuthMiddleware;
