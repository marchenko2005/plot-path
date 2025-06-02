const jwt = require('jsonwebtoken');

// Middleware для перевірки авторизації користувача через JWT
const authenticate = (req, res, next) => {
    // Отримання заголовка авторизації
    const authHeader = req.headers.authorization;

    // Перевірка наявності заголовка та правильного формату Bearer-токена
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Authorization header missing or malformed' });
    }

    // Витягуємо токен із заголовка
    const token = authHeader.split(' ')[1];

    try {
        // Перевіряємо токен і декодуємо його
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Зберігаємо дані користувача у запиті для подальшого використання
        req.user = decoded;

        // Передаємо управління наступному middleware або обробнику
        next();
    } catch (error) {
        // Якщо токен недійсний або протермінований
        return res.status(403).json({ error: 'Invalid or expired token' });
    }
};

module.exports = { authenticate };
