const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/authMiddleware');
const ctrl = require('../controllers/notificationController');

router.get('/summary',       authenticate, ctrl.getSummary);
router.get('/',              authenticate, ctrl.getNotifications);
router.get('/unread-count',  authenticate, ctrl.getUnreadCount);
router.put('/read-all',      authenticate, ctrl.markAllAsRead);
router.put('/:id/read',      authenticate, ctrl.markAsRead);

module.exports = router;
