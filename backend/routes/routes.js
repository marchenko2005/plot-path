const express = require('express');
const router = express.Router();
const routeController = require('../controllers/routeController');
const { authenticate } = require('../middleware/authMiddleware');

// Отримати персоналізовані маршрути + маршрут місяця
router.get('/daily', authenticate, routeController.getDailyRoutes);

// Отримати маршрути, які користувач розпочав або завершив
router.get('/my', authenticate, routeController.getUserRoutes);

// Розпочати маршрут вручну
router.post('/start/:routeId', authenticate, routeController.startRoute);

// Отримати прогрес за маршрутом
router.get('/progress/:routeId', authenticate, routeController.getRouteProgress);

// Отримати маршрут  місяця
router.get('/monthly', routeController.getMonthlyRoute);

//Отримти книги конкретного маршруту
router.get('/:routeId/books', routeController.getBooksForRoute);


module.exports = router;
