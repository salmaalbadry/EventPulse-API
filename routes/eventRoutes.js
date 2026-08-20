const express = require('express');
const { body } = require('express-validator');

const {
  getEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
} = require('../controllers/eventController');
const { requireAuth, requireRole } = require('../middleware/authMiddleware');
const validateRequest = require('../middleware/validateRequest');
const router = express.Router();

router.get('/', getEvents);
router.get('/:id', getEventById);

router.post(
  '/',
  [
    requireAuth,
    requireRole('admin'),
    body('title').trim().isLength({ min: 3, max: 150 }).withMessage('Title must be between 3 and 150 characters'),
    body('description').trim().isLength({ min: 10 }).withMessage('Description must be at least 10 characters long'),
    body('category').notEmpty().withMessage('Category is required'),
    body('date').isISO8601().withMessage('Date must be a valid ISO date'),
    body('city').trim().notEmpty().withMessage('City is required'),
    body('location').trim().notEmpty().withMessage('Location is required'),
    body('capacity').isInt({ min: 1 }).withMessage('Capacity must be a positive integer'),
    body('price').optional().isFloat({ min: 0 }).withMessage('Price must be zero or greater'),
  ],
  validateRequest,
  createEvent
);

router.patch(
  '/:id',
  [
    requireAuth,
    requireRole('admin'),
    body('title').optional().trim().isLength({ min: 3, max: 150 }).withMessage('Title must be between 3 and 150 characters'),
    body('description').optional().trim().isLength({ min: 10 }).withMessage('Description must be at least 10 characters long'),
    body('date').optional().isISO8601().withMessage('Date must be a valid ISO date'),
    body('city').optional().trim().notEmpty().withMessage('City is required'),
    body('location').optional().trim().notEmpty().withMessage('Location is required'),
    body('capacity').optional().isInt({ min: 1 }).withMessage('Capacity must be a positive integer'),
    body('price').optional().isFloat({ min: 0 }).withMessage('Price must be zero or greater'),
  ],
  validateRequest,
  updateEvent
);

router.delete('/:id', requireAuth, requireRole('admin'), deleteEvent);
module.exports = router;
