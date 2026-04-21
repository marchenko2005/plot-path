const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticate } = require('../middleware/authMiddleware');

// Отримати профіль користувача
router.get('/profile', authenticate, userController.getProfile);

// Публічний профіль іншого користувача
router.get('/:userId/public', authenticate, userController.getPublicProfile);

// Отримати всі нагороди користувача
router.get('/badges', authenticate, userController.getUserBadges);

// Залишити відгук і оновити прогрес
router.post('/routes/:routeId/book/:bookId/review', authenticate, userController.leaveReview);

// Оновити профіль користувача (username, age)
router.put('/profile', authenticate, userController.updateProfile);

// Оновити вподобання користувача (теги)
router.put('/tags', authenticate, userController.updateTags);

// Видалити тег із вподобань
router.delete('/tags/:tagId', authenticate, userController.removeTag);

// Активні маршрути користувача
router.get('/routes/active', authenticate, userController.getActiveRoutes);

// Завершені маршрути користувача
router.get('/routes/completed', authenticate, userController.getCompletedRoutes);

// Запропоновані маршрути (які ще не початі)
router.get('/routes/suggested', authenticate, userController.getSuggestedRoutes);
// Усі теги користувача 
router.get('/tags', authenticate, userController.getUserTags);

module.exports = router;
