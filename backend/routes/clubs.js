const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/authMiddleware');
const ctrl = require('../controllers/clubController');

router.post('/',                              authenticate, ctrl.createClub);
router.get('/search',                         authenticate, ctrl.searchClubs);
router.get('/my',                             authenticate, ctrl.getMyClubs);
router.get('/:clubId',                        authenticate, ctrl.getClub);
router.put('/:clubId',                        authenticate, ctrl.updateClub);
router.post('/join/:inviteCode',              authenticate, ctrl.joinByCode);
router.delete('/:clubId/leave',              authenticate, ctrl.leaveClub);
router.put('/:clubId/members/:userId/role',  authenticate, ctrl.setMemberRole);
router.post('/:clubId/book',                 authenticate, ctrl.setCurrentBook);
router.post('/:clubId/book/complete',        authenticate, ctrl.completeCurrentBook);
router.post('/:clubId/book/rate',            authenticate, ctrl.rateBook);
router.get('/:clubId/history',              authenticate, ctrl.getHistory);
router.get('/:clubId/messages',             authenticate, ctrl.getMessages);
router.get('/:clubId/recommendations',      authenticate, ctrl.getRecommendations);

module.exports = router;
