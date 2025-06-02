const sql = require('mssql');
const config = require('../db/sqlConfig');
const { v4: uuidv4 } = require('uuid');

const voteModel = {
  async submitVote(userId, tagId) {
    const pool = await sql.connect(config);

    const tagExists = await pool.request()
      .input('TagId', sql.UniqueIdentifier, tagId)
      .query('SELECT 1 FROM Tags WHERE Id = @TagId');

    if (tagExists.recordset.length === 0) {
      throw new Error(`Тег з ID ${tagId} не існує.`);
    }

    // Видалити попередній голос користувача
    await pool.request()
      .input('UserId', sql.UniqueIdentifier, userId)
      .query('DELETE FROM MonthlyRouteVotes WHERE UserId = @UserId');

    // Додати новий голос
    await pool.request()
      .input('UserId', sql.UniqueIdentifier, userId)
      .input('TagId', sql.UniqueIdentifier, tagId)
      .query(`
        INSERT INTO MonthlyRouteVotes (UserId, TagId, VotedAt)
        VALUES (@UserId, @TagId, GETDATE())
      `);
  },

  async generateMonthlyVotingOptions() {
    const pool = await sql.connect(config);

    // Видалити попередні опції
    await pool.request().query('DELETE FROM MonthlyVotingOptions');

    // Вибрати 4 випадкових теги
    const result = await pool.request()
      .query('SELECT TOP (4) * FROM Tags ORDER BY NEWID()');

    const tags = result.recordset;

    for (const tag of tags) {
      await pool.request()
        .input('Id', sql.UniqueIdentifier, uuidv4())
        .input('TagId', sql.UniqueIdentifier, tag.Id)
        .input('MonthStart', sql.DateTime, new Date())
        .query(`
          INSERT INTO MonthlyVotingOptions (Id, TagId, MonthStart)
          VALUES (@Id, @TagId, @MonthStart)
        `);
    }

    return tags; // для виводу у контролері або тестуванні
  }
};

module.exports = voteModel;
