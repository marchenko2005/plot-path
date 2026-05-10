const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/authMiddleware');
const ctrl = require('../controllers/friendshipController');

router.get('/', authenticate, ctrl.getFriends);
router.get('/requests', authenticate, ctrl.getIncomingRequests);
router.get('/suggestions', authenticate, ctrl.getFriendSuggestions);
router.post('/request/:userId', authenticate, ctrl.sendRequest);
router.delete('/request/:userId', authenticate, ctrl.cancelRequest);
router.put('/request/:requestId/accept', authenticate, ctrl.acceptRequest);
router.put('/request/:requestId/reject', authenticate, ctrl.rejectRequest);

module.exports = router;
