const sql = require('mssql');
const config = require('../db/sqlConfig');

const tagPreferenceModel = {
    // Отримати найулюбленіший тег певного типу (Genre/Trope) для користувача
    async getTopTag(userId, tagType) {
        const pool = await sql.connect(config);
        const result = await pool.request()
            .input('UserId', sql.UniqueIdentifier, userId)
            .input('TagType', sql.NVarChar, tagType)
            .query(`
                SELECT TOP 1 p.TagId, COUNT(*) as PreferenceCount
                FROM UserTagPreferences p
                JOIN Tags t ON p.TagId = t.Id
                WHERE p.UserId = @UserId AND t.Type = @TagType
                GROUP BY p.TagId
                ORDER BY PreferenceCount DESC
            `);
        return result.recordset[0]?.TagId || null;
    },

    // Отримати від 3 до 5 рандомних книг за тегом
    async getBooksByTag(tagId, maxLimit = 5) {
        const pool = await sql.connect(config);

        const result = await pool.request()
            .input('TagId', sql.UniqueIdentifier, tagId)
            .query(`
                SELECT BookId
                FROM BookTags
                WHERE TagId = @TagId
                ORDER BY NEWID()
            `);

        const allBooks = result.recordset.map(r => r.BookId);

        // Обмежити кількість книг від 3 до maxLimit
        const min = 3;
        const max = Math.min(maxLimit, allBooks.length);
        if (max < min) {
            return allBooks; // Якщо книг менше 3, повернути всі
        }

        const randomCount = Math.floor(Math.random() * (max - min + 1)) + min;
        return allBooks.slice(0, randomCount);
    },
    // Отримати один випадковий тег певного типу
    async getRandomTag(tagType) {
        const pool = await sql.connect(config);
        const result = await pool.request()
            .input('TagType', sql.NVarChar, tagType)
            .query(`
                SELECT TOP 1 Id
                FROM Tags
                WHERE Type = @TagType
                ORDER BY NEWID()
            `);
        return result.recordset[0]?.Id || null;
    },

    // Отримати випадкові теги різних типів (наприклад: Genre, Trope)
    async getRandomTags(count = 2) {
        const pool = await sql.connect(config);
        const result = await pool.request()
            .query(`
                SELECT TOP (${count}) Id, Name, Type
                FROM Tags
                WHERE Type IN ('Genre', 'Trope')
                ORDER BY NEWID()
            `);
        return result.recordset;
    }
};

module.exports = tagPreferenceModel;
