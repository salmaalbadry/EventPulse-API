const express = require('express');
const { body } = require('express-validator');

const {
  registerForEvent,
  getMyRegistrations,
  cancelRegistration,
} = require('../controllers/registrationController');
const { requireAuth } = require('../middleware/authMiddleware');
const validateRequest = require('../middleware/validateRequest');
const router = express.Router();

router.use(requireAuth);

router.post(
  '/',
  [
    body('eventId').notEmpty().withMessage('Event ID is required'),
  ],
  validateRequest,
  registerForEvent
);

router.get('/my', getMyRegistrations);
router.delete('/:id', cancelRegistration);
module.exports = router;
