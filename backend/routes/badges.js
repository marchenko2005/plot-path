const express = require('express');
const router = express.Router();
const badgeController = require('../controllers/badgeController');

// Отримати всі нагороди
router.get('/', badgeController.getAllBadges);

// Отримати нагороду за назвою (Name)
router.get('/:name', badgeController.getBadgeByName);

module.exports = router;
