const sql = require('mssql');
const config = require('../db/sqlConfig');
const { v4: uuidv4 } = require('uuid');

const friendship = {
  async sendRequest(senderId, receiverId) {
    const pool = await sql.connect(config);

    const existing = await pool.request()
      .input('A', sql.UniqueIdentifier, senderId)
      .input('B', sql.UniqueIdentifier, receiverId)
      .query(`
        SELECT 1 FROM FriendRequests
        WHERE ((SenderId = @A AND ReceiverId = @B) OR (SenderId = @B AND ReceiverId = @A))
          AND Status = 'pending'
        UNION
        SELECT 1 FROM Friendships
        WHERE (UserId1 = @A AND UserId2 = @B) OR (UserId1 = @B AND UserId2 = @A)
      `);

    if (existing.recordset.length > 0) return null;

    const id = uuidv4();
    await pool.request()
      .input('Id', sql.UniqueIdentifier, id)
      .input('SenderId', sql.UniqueIdentifier, senderId)
      .input('ReceiverId', sql.UniqueIdentifier, receiverId)
      .query(`
        INSERT INTO FriendRequests (Id, SenderId, ReceiverId, Status, CreatedAt)
        VALUES (@Id, @SenderId, @ReceiverId, 'pending', GETDATE())
      `);

    return id;
  },

  async cancelRequest(senderId, receiverId) {
    const pool = await sql.connect(config);
    await pool.request()
      .input('SenderId', sql.UniqueIdentifier, senderId)
      .input('ReceiverId', sql.UniqueIdentifier, receiverId)
      .query(`
        DELETE FROM FriendRequests
        WHERE SenderId = @SenderId AND ReceiverId = @ReceiverId AND Status = 'pending'
      `);
  },

  async getRequestById(requestId) {
    const pool = await sql.connect(config);
    const result = await pool.request()
      .input('Id', sql.UniqueIdentifier, requestId)
      .query('SELECT * FROM FriendRequests WHERE Id = @Id');
    return result.recordset[0];
  },

  async acceptRequest(requestId) {
    const pool = await sql.connect(config);

    const req = await this.getRequestById(requestId);
    if (!req || req.Status !== 'pending') return null;

    await pool.request()
      .input('Id', sql.UniqueIdentifier, requestId)
      .query(`
        UPDATE FriendRequests
        SET Status = 'accepted', RespondedAt = GETDATE()
        WHERE Id = @Id
      `);

    await pool.request()
      .input('Id', sql.UniqueIdentifier, uuidv4())
      .input('UserId1', sql.UniqueIdentifier, req.SenderId)
      .input('UserId2', sql.UniqueIdentifier, req.ReceiverId)
      .query(`
        INSERT INTO Friendships (Id, UserId1, UserId2, CreatedAt)
        VALUES (@Id, @UserId1, @UserId2, GETDATE())
      `);

    return req;
  },

  async rejectRequest(requestId) {
    const pool = await sql.connect(config);
    await pool.request()
      .input('Id', sql.UniqueIdentifier, requestId)
      .query(`
        UPDATE FriendRequests
        SET Status = 'rejected', RespondedAt = GETDATE()
        WHERE Id = @Id AND Status = 'pending'
      `);
  },

  async getIncomingRequests(userId) {
    const pool = await sql.connect(config);
    const result = await pool.request()
      .input('UserId', sql.UniqueIdentifier, userId)
      .query(`
        SELECT fr.Id, fr.SenderId, fr.CreatedAt,
               u.Username, u.AvatarUrl
        FROM FriendRequests fr
        JOIN Users u ON u.Id = fr.SenderId
        WHERE fr.ReceiverId = @UserId AND fr.Status = 'pending'
        ORDER BY fr.CreatedAt DESC
      `);
    return result.recordset;
  },

  async getFriends(userId) {
    const pool = await sql.connect(config);
    const result = await pool.request()
      .input('UserId', sql.UniqueIdentifier, userId)
      .query(`
        SELECT u.Id, u.Username, u.AvatarUrl, f.CreatedAt AS FriendsSince
        FROM Friendships f
        JOIN Users u ON u.Id = CASE WHEN f.UserId1 = @UserId THEN f.UserId2 ELSE f.UserId1 END
        WHERE f.UserId1 = @UserId OR f.UserId2 = @UserId
        ORDER BY f.CreatedAt DESC
      `);
    return result.recordset;
  },
};

module.exports = friendship;
