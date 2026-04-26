const sql = require('mssql');
const config = require('../db/sqlConfig');
const cron = require('node-cron');
const clubModel = require('../models/club');
const { getIO } = require('../socket');

async function checkExpiredClubBooks() {
  console.log('[ClubBookChecker] Running expired book check...');
  try {
    const pool = await sql.connect(config);

    const expired = await pool.request().query(`
      SELECT Id, ClubId
      FROM ClubBooks
      WHERE Status = 'active' AND EndDate < GETDATE()
    `);

    for (const { ClubId } of expired.recordset) {
      const completed = await clubModel.completeCurrentBook(ClubId);
      if (completed) {
        console.log(`[ClubBookChecker] Completed book for club ${ClubId}`);
        try {
          getIO().to(`club:${ClubId}`).emit('club:book_completed', { clubId: ClubId });
        } catch {
          // Socket may not be initialized in test runs
        }
      }
    }
  } catch (err) {
    console.error('[ClubBookChecker] Error:', err);
  }
}

// Щодня о 03:00
cron.schedule('0 3 * * *', checkExpiredClubBooks);

module.exports = { checkExpiredClubBooks };
