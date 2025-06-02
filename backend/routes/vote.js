const express = require('express');
const router = express.Router();
const voteController = require('../controllers/voteController');
const { authenticate } = require('../middleware/authMiddleware');

router.get('/options', voteController.getVotingOptions);
router.post('/', authenticate, voteController.submitVote);
router.post('/generate', voteController.generateVotingOptions); // для ручного виклику

module.exports = router;
