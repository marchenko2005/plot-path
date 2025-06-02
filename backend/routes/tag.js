const express = require('express');
const router = express.Router();
const tagController = require('../controllers/tagController');

// Пошук тегів за частиною назви (має бути першим)
router.get('/search/by-name', tagController.searchTags);

// Отримати всі теги
router.get('/', tagController.getAllTags);

// Отримати теги за типом (наприклад: Genre або Trope)
router.get('/type/:type', tagController.getTagsByType);

// Отримати тег за ID (має бути останнім)
router.get('/:id', tagController.getTagById);

module.exports = router;
