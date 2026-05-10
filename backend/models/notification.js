const sql = require('mssql');
const config = require('../db/sqlConfig');
const { v4: uuidv4 } = require('uuid');

const notification = {
  async create(userId, type, data = null) {
    const pool = await sql.connect(config);
    await pool.request()
      .input('Id',     sql.UniqueIdentifier,  uuidv4())
      .input('UserId', sql.UniqueIdentifier,  userId)
      .input('Type',   sql.NVarChar(50),      type)
      .input('Data',   sql.NVarChar(sql.MAX), data ? JSON.stringify(data) : null)
      .query(`
        INSERT INTO Notifications (Id, UserId, Type, Data, IsRead, CreatedAt)
        VALUES (@Id, @UserId, @Type, @Data, 0, GETDATE())
      `);
  },

  async getForUser(userId) {
    const pool = await sql.connect(config);
    const result = await pool.request()
      .input('UserId', sql.UniqueIdentifier, userId)
      .query(`
        SELECT Id, Type, Data, IsRead, CreatedAt
        FROM Notifications
        WHERE UserId = @UserId
        ORDER BY CreatedAt DESC
      `);
    return result.recordset.map(n => ({
      ...n,
      Data: n.Data ? JSON.parse(n.Data) : null,
    }));
  },

  async getUnreadCount(userId) {
    const pool = await sql.connect(config);
    const result = await pool.request()
      .input('UserId', sql.UniqueIdentifier, userId)
      .query(`SELECT COUNT(*) AS Cnt FROM Notifications WHERE UserId = @UserId AND IsRead = 0`);
    return result.recordset[0].Cnt;
  },

  async markAsRead(notificationId, userId) {
    const pool = await sql.connect(config);
    await pool.request()
      .input('Id',     sql.UniqueIdentifier, notificationId)
      .input('UserId', sql.UniqueIdentifier, userId)
      .query(`UPDATE Notifications SET IsRead = 1 WHERE Id = @Id AND UserId = @UserId`);
  },

  async markAllAsRead(userId) {
    const pool = await sql.connect(config);
    await pool.request()
      .input('UserId', sql.UniqueIdentifier, userId)
      .query(`UPDATE Notifications SET IsRead = 1 WHERE UserId = @UserId AND IsRead = 0`);
  },
};

module.exports = notification;
