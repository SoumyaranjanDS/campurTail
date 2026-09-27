// Role-based middleware
const User = require('../models/User');

const requireAdmin = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admins only.' });
    }
    req.fullUser = user;
    next();
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

const requireStaffOrAdmin = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user || !['admin', 'staff'].includes(user.role)) {
      return res.status(403).json({ message: 'Access denied. Staff or Admin only.' });
    }
    req.fullUser = user;
    next();
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { requireAdmin, requireStaffOrAdmin };
