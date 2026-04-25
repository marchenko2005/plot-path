const sql = require('mssql');
const config = require('../db/sqlConfig');
const { v4: uuidv4 } = require('uuid');

const privateChat = {
  async getOrCreate(userIdA, userIdB) {
    const pool = await sql.connect(config);
    const existing = await pool.request()
      .input('A', sql.UniqueIdentifier, userIdA)
      .input('B', sql.UniqueIdentifier, userIdB)
      .query(`
        SELECT Id FROM PrivateChats
        WHERE (UserId1 = @A AND UserId2 = @B) OR (UserId1 = @B AND UserId2 = @A)
      `);

    if (existing.recordset.length > 0) return existing.recordset[0].Id;

    const id = uuidv4();
    await pool.request()
      .input('Id', sql.UniqueIdentifier, id)
      .input('A', sql.UniqueIdentifier, userIdA)
      .input('B', sql.UniqueIdentifier, userIdB)
      .query(`
        INSERT INTO PrivateChats (Id, UserId1, UserId2, CreatedAt)
        VALUES (@Id, @A, @B, GETDATE())
      `);
    return id;
  },

  async getChatsByUser(userId) {
    const pool = await sql.connect(config);
    const result = await pool.request()
      .input('UserId', sql.UniqueIdentifier, userId)
      .query(`
        SELECT
          pc.Id                                                            AS ChatId,
          u.Id                                                             AS OtherUserId,
          u.Username,
          u.AvatarUrl,
          lm.MessageText                                                   AS LastMessage,
          lm.CreatedAt                                                     AS LastMessageAt,
          (
            SELECT COUNT(*) FROM PrivateMessages
            WHERE ChatId = pc.Id AND SenderId != @UserId AND IsRead = 0
          )                                                                AS UnreadCount
        FROM PrivateChats pc
        JOIN Users u ON u.Id = CASE WHEN pc.UserId1 = @UserId THEN pc.UserId2 ELSE pc.UserId1 END
        OUTER APPLY (
          SELECT TOP 1 MessageText, CreatedAt
          FROM PrivateMessages
          WHERE ChatId = pc.Id
          ORDER BY CreatedAt DESC
        ) lm
        WHERE pc.UserId1 = @UserId OR pc.UserId2 = @UserId
        ORDER BY lm.CreatedAt DESC
      `);
    return result.recordset;
  },

  async getMessages(chatId) {
    const pool = await sql.connect(config);
    const result = await pool.request()
      .input('ChatId', sql.UniqueIdentifier, chatId)
      .query(`
        SELECT pm.Id, pm.SenderId, pm.MessageText, pm.CreatedAt, pm.IsRead,
               u.Username, u.AvatarUrl
        FROM PrivateMessages pm
        JOIN Users u ON u.Id = pm.SenderId
        WHERE pm.ChatId = @ChatId
        ORDER BY pm.CreatedAt ASC
      `);
    return result.recordset;
  },

  async saveMessage(chatId, senderId, text) {
    const pool = await sql.connect(config);
    const id = uuidv4();
    await pool.request()
      .input('Id', sql.UniqueIdentifier, id)
      .input('ChatId', sql.UniqueIdentifier, chatId)
      .input('SenderId', sql.UniqueIdentifier, senderId)
      .input('MessageText', sql.NVarChar(sql.MAX), text)
      .query(`
        INSERT INTO PrivateMessages (Id, ChatId, SenderId, MessageText, CreatedAt, IsRead)
        VALUES (@Id, @ChatId, @SenderId, @MessageText, GETDATE(), 0)
      `);

    const result = await pool.request()
      .input('Id', sql.UniqueIdentifier, id)
      .query(`
        SELECT pm.Id, pm.SenderId, pm.MessageText, pm.CreatedAt, pm.IsRead,
               u.Username, u.AvatarUrl
        FROM PrivateMessages pm
        JOIN Users u ON u.Id = pm.SenderId
        WHERE pm.Id = @Id
      `);
    return result.recordset[0];
  },

  async markAsRead(chatId, userId) {
    const pool = await sql.connect(config);
    await pool.request()
      .input('ChatId', sql.UniqueIdentifier, chatId)
      .input('UserId', sql.UniqueIdentifier, userId)
      .query(`
        UPDATE PrivateMessages
        SET IsRead = 1
        WHERE ChatId = @ChatId AND SenderId != @UserId AND IsRead = 0
      `);
  },

  async getChatById(chatId) {
    const pool = await sql.connect(config);
    const result = await pool.request()
      .input('Id', sql.UniqueIdentifier, chatId)
      .query('SELECT * FROM PrivateChats WHERE Id = @Id');
    return result.recordset[0];
  },
};

module.exports = privateChat;
