const express = require('express');
const router = express.Router();
const bookController = require('../controllers/bookController');
const { authenticate } = require('../middleware/authMiddleware');

// Отримати всі книги
router.get('/', authenticate, bookController.getAllBooks);

// Отримати одну книгу за ID
router.get('/:id', authenticate, bookController.getBookById);

module.exports = router;
