const sql = require('mssql');
const config = require('../db/sqlConfig');

const badgeController = {

    // Отримати всі доступні нагороди
   async getAllBadges(req, res) {
        try {
            const pool = await sql.connect(config);
            const result = await pool.request()
            .query('SELECT * FROM Badges ORDER BY Name');
            res.json(result.recordset); // обов’язково .recordset
        } catch (error) {
            console.error('Error fetching all badges:', error);
            res.status(500).json({ error: 'Failed to fetch badges' });
        }
    },


    // Отримати одну нагороду за її назвою
    async getBadgeByName(req, res) {
        const { name } = req.params;
        if (!name) {
            return res.status(400).json({ error: 'Badge name is required.' });
        }

        try {
            const pool = await sql.connect(config);
            const result = await pool.request()
                .input('Name', sql.NVarChar, name)
                .query('SELECT Id, Name, Description, IconUrl FROM Badges WHERE Name = @Name');

            if (result.recordset.length === 0) {
                return res.status(404).json({ error: 'Badge not found' });
            }

            res.json(result.recordset[0]);
        } catch (error) {
            console.error(`[getBadgeByName] Error fetching badge "${name}":`, error);
            res.status(500).json({ error: 'Failed to fetch badge' });
        }
    }
};

module.exports = badgeController;
