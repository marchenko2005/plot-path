const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/authMiddleware');
const { getMyChats, getChatWithUser } = require('../controllers/privateChatController');

router.get('/', authenticate, getMyChats);
router.get('/:userId', authenticate, getChatWithUser);

module.exports = router;
