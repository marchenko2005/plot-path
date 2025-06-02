const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Реєстрація користувача
router.post('/register', authController.register);

// Вхід користувача
router.post('/login', authController.login);

// Оновлення токена
router.post('/refresh-token', authController.refreshToken);

module.exports = router;
