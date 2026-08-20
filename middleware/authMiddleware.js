const jwt = require('jsonwebtoken');

const User = require('../models/User');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

const requireAuth = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new AppError(401, 'Authentication required. No token provided.'));
  }

  const token = authHeader.split(' ')[1];

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET || 'eventpulse_dev_secret');
  } catch (error) {
    return next(new AppError(401, 'Token expired or invalid'));
  }

  const user = await User.findById(decoded.userId).select('-password');
  if (!user) {
    return next(new AppError(401, 'User not found. Please log in again.'));
  }

  req.user = user;
  next();
});

const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError(401, 'Authentication required'));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(new AppError(403, 'You do not have permission to access this resource'));
    }

    next();
  };
};

module.exports = { requireAuth, requireRole };
