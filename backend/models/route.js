const sql = require('mssql');
const config = require('../db/sqlConfig');

const route = {

    // Отримати всі маршрути (використовується для загального адміністрування або тестів)
    async getAll() {
        try {
            const pool = await sql.connect(config);
            const result = await pool.request().query('SELECT * FROM Routes');
            return result.recordset;
        } catch (error) {
            throw error;
        }
    },

    // Отримати маршрут за його ID
    async getById(id) {
        try {
            const pool = await sql.connect(config);
            const result = await pool.request()
                .input('Id', sql.UniqueIdentifier, id)
                .query('SELECT * FROM Routes WHERE Id = @Id');
            return result.recordset[0];
        } catch (error) {
            throw error;
        }
    },

    // Отримати маршрут місяця (останній створений з IsMonthly = 1)
    async getMonthlyRoute() {
        try {
            const pool = await sql.connect(config);
            const result = await pool.request()
                .query('SELECT TOP 1 * FROM Routes WHERE IsMonthly = 1 ORDER BY CreatedAt DESC');
            return result.recordset[0];
        } catch (error) {
            throw error;
        }
    },

    // Отримати маршрути, які користувач реально розпочав (In Progress)
    async getActiveRoutes(userId) {
        try {
            const pool = await sql.connect(config);
            const result = await pool.request()
                .input('UserId', sql.UniqueIdentifier, userId)
                .query(`
                    SELECT r.*
                    FROM UserRoutes ur
                    JOIN Routes r ON ur.RouteId = r.Id
                    WHERE ur.UserId = @UserId AND ur.Status = 'in_progress'
                `);
            return result.recordset;
        } catch (error) {
            throw error;
        }
    },

    // Отримати маршрути, які користувач завершив (Completed)
    async getCompletedRoutes(userId) {
        try {
            const pool = await sql.connect(config);
            const result = await pool.request()
                .input('UserId', sql.UniqueIdentifier, userId)
                .query(`
                    SELECT r.*
                    FROM UserRoutes ur
                    JOIN Routes r ON ur.RouteId = r.Id
                    WHERE ur.UserId = @UserId AND ur.Status = 'сompleted'
                `);
            return result.recordset;
        } catch (error) {
            throw error;
        }
    },

    // Отримати маршрути, які запропоновані, але ще не були розпочаті 
    async getSuggestedRoutes(userId) {
        try {
            const pool = await sql.connect(config);
            const result = await pool.request()
                .input('UserId', sql.UniqueIdentifier, userId)
                .query(`
                    SELECT r.*
                    FROM UserRoutes ur
                    JOIN Routes r ON ur.RouteId = r.Id
                    WHERE ur.UserId = @UserId AND  ur.Status = 'planned'
                `);
            return result.recordset;
        } catch (error) {
            throw error;
        }
    }
};

module.exports = route;
