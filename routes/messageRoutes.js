const express = require('express');
const { getEventMessages } = require('../controllers/messageController');
const { requireAuth } = require('../middleware/authMiddleware');
const router = express.Router();
router.get('/:eventId', requireAuth, getEventMessages);
module.exports = router;
