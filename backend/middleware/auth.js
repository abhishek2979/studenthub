const asyncHandler = require('express-async-handler');
const { verifyToken } = require('../utils/generateToken');
const User = require('../models/User');

// Verify JWT
const protect = asyncHandler(async (req, res, next) => {
  let token;

  if (req.headers.authorization?.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    res.status(401);
    throw new Error('Not authorized – no token');
  }

  const decoded = verifyToken(token);
  req.user = await User.findById(decoded.id).select('-password');

  if (!req.user) {
    res.status(401);
    throw new Error('User not found');
  }

  if (!req.user.isActive) {
    res.status(403);
    throw new Error('Account deactivated. Contact admin.');
  }

  next();
});

// Role gate factory
const authorize = (...roles) =>
  (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      res.status(403);
      throw new Error(`Role '${req.user.role}' is not authorized`);
    }
    next();
  };

module.exports = { protect, authorize };
