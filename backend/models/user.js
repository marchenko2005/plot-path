// Імпортуємо модулі для роботи з MSSQL та конфігурацію підключення
const sql = require('mssql');
const config = require('../db/sqlConfig');

// Об'єкт user містить методи для взаємодії з таблицею Users і пов’язаними з нею нагородами
const user = {

    // Отримати користувача за його унікальним ідентифікатором
    async getById(userId) {
        try {
            // Встановлюємо з'єднання з базою даних
            const pool = await sql.connect(config);

            // Передаємо userId як параметр і виконуємо SQL-запит
            const result = await pool.request()
                .input('UserId', sql.UniqueIdentifier, userId)
                .query('SELECT Id, Username, Email, AvatarUrl FROM Users WHERE Id = @UserId');

            // Повертаємо перший знайдений запис або undefined
            return result.recordset[0];
        } catch (error) {
            throw error;
        }
    },

    // Отримати список усіх нагород користувача
    async getBadges(userId) {
        try {
            const pool = await sql.connect(config);

            // Виконуємо JOIN UserBadges і Badges, щоб отримати повні дані про нагороди
            const result = await pool.request()
                .input('UserId', sql.UniqueIdentifier, userId)
                .query(`
                    SELECT b.*
                    FROM UserBadges ub
                    JOIN Badges b ON ub.BadgeId = b.Id
                    WHERE ub.UserId = @UserId
                `);

            // Повертаємо масив нагород
            return result.recordset;
        } catch (error) {
            throw error;
        }
    }
};

// Експортуємо об'єкт user для використання в інших модулях
module.exports = user;
