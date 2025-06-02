const sql = require('mssql');
const config = require('../db/sqlConfig');

// Controller for book operations
const bookController = {
    // Fetch all books
    async getAllBooks(req, res) {
        try {
            const pool = await sql.connect(config);
            const result = await pool.request().query('SELECT * FROM Books');
            res.json(result.recordset);
        } catch (error) {
            console.error('Error fetching books:', error);
            res.status(500).json({ error: 'Failed to fetch books' });
        }
    },

    // Fetch a single book by ID
    async getBookById(req, res) {
        const { id } = req.params;
        try {
            const pool = await sql.connect(config);
            const result = await pool.request()
                .input('Id', sql.UniqueIdentifier, id)
                .query('SELECT * FROM Books WHERE Id = @Id');

            if (result.recordset.length === 0) {
                return res.status(404).json({ error: 'Book not found' });
            }

            res.json(result.recordset[0]);
        } catch (error) {
            console.error('Error fetching book by ID:', error);
            res.status(500).json({ error: 'Failed to fetch book' });
        }
    }
};

module.exports = bookController;
