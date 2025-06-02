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
    },
   async getReviewsForBook(req, res) {
    const { bookId } = req.params;

    try {
        const pool = await sql.connect(config);

        const result = await pool.request()
        .input('BookId', sql.UniqueIdentifier, bookId)
        .query(`
            SELECT 
            r.Id,
            r.UserId,
            r.BookId,
            r.Rating,
            r.ReviewText,
            r.CreatedAt,
            u.Username AS UserName,
            u.AvatarUrl AS UserAvatar
            FROM BookReviews r
            JOIN Users u ON u.Id = r.UserId
            WHERE r.BookId = @BookId
            ORDER BY r.CreatedAt DESC
        `);

        res.json(result.recordset);
    } catch (error) {
        console.error('Error fetching reviews for book:', error);
        res.status(500).json({ error: 'Failed to fetch reviews for book' });
    }
    }
};

module.exports = bookController;
