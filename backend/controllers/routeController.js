const routeModel = require('../models/route');
const sql = require('mssql');
const config = require('../db/sqlConfig');
const { v4: uuidv4 } = require('uuid');
const jwt = require('../utils/jwtHelper');

const routeController = {

    // Отримати прогрес проходження певного маршруту
    async  getRouteProgress(req, res) {
        const userId = req.user.userId;
        const routeId = req.params.routeId;

        try {
            const pool = await sql.connect(config);

            // Отримати всі книги з маршруту
            const allBooksResult = await pool.request()
            .input('RouteId', sql.UniqueIdentifier, routeId)
            .query(`
                SELECT b.Id, b.Title, b.Author
                FROM RouteBooks rb
                JOIN Books b ON rb.BookId = b.Id
                WHERE rb.RouteId = @RouteId
                ORDER BY rb.Position
            `);

            // Отримати лише прочитані книги
            const readBooksResult = await pool.request()
            .input('UserId', sql.UniqueIdentifier, userId)
            .input('RouteId', sql.UniqueIdentifier, routeId)
            .query(`
                SELECT BookId
                FROM UserBookProgress
                WHERE UserId = @UserId AND RouteId = @RouteId AND IsRead = 1
            `);

            const readBookIds = new Set(readBooksResult.recordset.map(r => r.BookId));

            const booksWithProgress = allBooksResult.recordset.map(book => ({
            ...book,
            isRead: readBookIds.has(book.Id)
            }));

            const progressPercent = Math.round(
            (readBookIds.size / allBooksResult.recordset.length) * 100
            );

            res.json({
            routeId,
            progressPercent,
            books: booksWithProgress
            });

        } catch (error) {
            console.error('Error fetching route progress:', error);
            res.status(500).json({ error: 'Failed to fetch route progress' });
        }
        },
   async getBooksForRoute(req, res) {
        const { routeId } = req.params;
        let userId = null;

        // Спроба витягти userId з токена
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.split(' ')[1];
            try {
                const payload = jwt.verifyToken(token); // Перевірка токена
                userId = payload.userId;
                console.log('[getBooksForRoute] Authenticated user:', userId);
            } catch (err) {
                console.warn('[getBooksForRoute] Invalid token. Proceeding without user context.');
            }
        } else {
            console.log('[getBooksForRoute] No token provided. Public access.');
        }

        try {
            const pool = await sql.connect(config);

            // Отримати всі книги маршруту
            const allBooksResult = await pool.request()
                .input('RouteId', sql.UniqueIdentifier, routeId)
                .query(`
                    SELECT 
                        b.Id,
                        b.Title,
                        b.Author,
                        b.Description,
                        b.CoverUrl,
                        @RouteId AS RouteId
                    FROM RouteBooks rb
                    JOIN Books b ON rb.BookId = b.Id
                    WHERE rb.RouteId = @RouteId
                    ORDER BY rb.Position
                `);

            const books = allBooksResult.recordset;

            // Якщо користувач є — додати прогрес
            if (userId) {
                const readBooksResult = await pool.request()
                    .input('UserId', sql.UniqueIdentifier, userId)
                    .input('RouteId', sql.UniqueIdentifier, routeId)
                    .query(`
                        SELECT BookId
                        FROM UserBookProgress
                        WHERE UserId = @UserId AND RouteId = @RouteId AND IsRead = 1
                    `);

                const readBookIds = new Set(readBooksResult.recordset.map(r => r.BookId));
                const booksWithProgress = books.map(book => ({
                    ...book,
                    isRead: readBookIds.has(book.Id),
                }));

                const progressPercent = Math.round((readBookIds.size / books.length) * 100);

                return res.json({
                    routeId,
                    progressPercent,
                    books: booksWithProgress,
                });
            }

            // Публічний доступ — повертаємо лише книги
            return res.json({ routeId, books });

        } catch (error) {
            console.error('Error fetching books for route:', error);
            res.status(500).json({ error: 'Failed to fetch books for route' });
        }
    },
    // Отримати щоденні маршрути + маршрут місяця
    async  getDailyRoutes(req, res) {
        const userId = req.user.userId;
        try {
            const pool = await sql.connect(config);

            // Отримати маршрут місяця
            const monthlyRouteResult = await pool.request()
            .query(`SELECT TOP 1 * FROM Routes WHERE IsMonthly = 1 ORDER BY CreatedAt DESC`);
            const monthlyRoute = monthlyRouteResult.recordset[0] || null;

            // Отримати ID персоналізованих маршрутів для користувача
            const personalizedResult = await pool.request()
            .input('UserId', sql.UniqueIdentifier, userId)
            .query(`
                SELECT r.*
                FROM UserRoutes ur
                JOIN Routes r ON ur.RouteId = r.Id
                WHERE ur.UserId = @UserId
                AND r.IsMonthly = 0
                AND ur.Status = 'planned'
            `); // ← виводимо тільки ті, які ще не стартували

            res.json({
            monthly: monthlyRoute,
            personalized: personalizedResult.recordset
            });
        } catch (err) {
            console.error('Error in getDailyRoutes:', err);
            res.status(500).json({ error: 'Failed to get routes' });
        }
    },

    // Отримати всі маршрути користувача (початі або завершені)
    async  getUserRoutes(req, res) {
        const userId = req.user.userId;
        try {
            const pool = await sql.connect(config);

            const result = await pool.request()
            .input('UserId', sql.UniqueIdentifier, userId)
            .query(`
                SELECT r.*, ur.Status, ur.StartedAt, ur.CompletedAt
                FROM UserRoutes ur
                JOIN Routes r ON ur.RouteId = r.Id
                WHERE ur.UserId = @UserId
                AND ur.Status IN ('in_progress', 'completed')
            `);

            res.json(result.recordset);
        } catch (err) {
            console.error('Error fetching user routes:', err);
            res.status(500).json({ error: 'Failed to get user routes' });
        }
        },
    // Почати маршрут вручну
   async startRoute(req, res) {
        const userId = req.user.userId;
        const { routeId } = req.params;

        try {
            const pool = await sql.connect(config);

            // Перевірка, чи вже існує запис про цей маршрут
            const existing = await pool.request()
            .input('UserId', sql.UniqueIdentifier, userId)
            .input('RouteId', sql.UniqueIdentifier, routeId)
            .query(`
                SELECT Status FROM UserRoutes 
                WHERE UserId = @UserId AND RouteId = @RouteId
            `);

            if (existing.recordset.length > 0) {
            const currentStatus = existing.recordset[0].Status;

            if (currentStatus === 'in_progress') {
                return res.status(400).json({ error: 'Route already in progress' });
            }

            if (currentStatus === 'completed') {
                return res.status(400).json({ error: 'Route already completed' });
            }

            // Якщо статус "planned" — оновлюємо на "in_progress"
            await pool.request()
                .input('UserId', sql.UniqueIdentifier, userId)
                .input('RouteId', sql.UniqueIdentifier, routeId)
                .input('Status', sql.NVarChar, 'in_progress')
                .input('StartedAt', sql.DateTime, new Date())
                .query(`
                UPDATE UserRoutes
                SET Status = @Status, StartedAt = @StartedAt
                WHERE UserId = @UserId AND RouteId = @RouteId
                `);

            return res.json({ message: 'Route activated from planned' });
            }

            // Якщо немає запису — створюємо новий
            await pool.request()
            .input('UserId', sql.UniqueIdentifier, userId)
            .input('RouteId', sql.UniqueIdentifier, routeId)
            .input('Status', sql.NVarChar, 'in_progress')
            .input('StartedAt', sql.DateTime, new Date())
            .query(`
                INSERT INTO UserRoutes (UserId, RouteId, Status, StartedAt)
                VALUES (@UserId, @RouteId, @Status, @StartedAt)
            `);

            res.json({ message: 'Route started successfully' });
        } catch (error) {
            console.error('Error starting route:', error);
            res.status(500).json({ error: 'Failed to start route' });
        }
        },

    async getMonthlyRoute(req, res) {
        try {
            const pool = await sql.connect(config);
            const result = await pool.request()
                .query(`
                    SELECT TOP 1 * FROM Routes
                    WHERE IsMonthly = 1
                    ORDER BY CreatedAt DESC
                `);

            if (result.recordset.length === 0) {
                return res.status(404).json({ error: 'No monthly route found' });
            }

            res.json(result.recordset[0]);
        } catch (error) {
            console.error('Error fetching monthly route:', error);
            res.status(500).json({ error: 'Failed to fetch monthly route' });
        }
    }

};

module.exports = routeController;
