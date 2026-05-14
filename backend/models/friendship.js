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

  // People You May Know: mutual friends × 0.5 + shared tags × 0.3 + shared clubs × 0.2
  async getSuggestions(userId, limit = 3) {
    const pool = await sql.connect(config);

    const result = await pool.request()
      .input('UserId', sql.UniqueIdentifier, userId)
      .query(`
        SELECT
          u.Id, u.Username, u.AvatarUrl,
          (SELECT COUNT(*) FROM UserTagPreferences WHERE UserId = @UserId) AS MyTags,
          (SELECT COUNT(*) FROM UserTagPreferences WHERE UserId = u.Id)   AS TheirTags,
          (
            SELECT COUNT(*)
            FROM Friendships f1
            JOIN Friendships f2
              ON CASE WHEN f1.UserId1 = @UserId THEN f1.UserId2 ELSE f1.UserId1 END
               = CASE WHEN f2.UserId1 = u.Id   THEN f2.UserId2 ELSE f2.UserId1 END
            WHERE (f1.UserId1 = @UserId OR f1.UserId2 = @UserId)
              AND (f2.UserId1 = u.Id   OR f2.UserId2 = u.Id)
          ) AS MutualFriends,
          (
            SELECT COUNT(*)
            FROM UserTagPreferences t1
            JOIN UserTagPreferences t2 ON t1.TagId = t2.TagId
            WHERE t1.UserId = @UserId AND t2.UserId = u.Id
          ) AS SharedTags,
          (
            SELECT COUNT(*)
            FROM ClubMembers c1
            JOIN ClubMembers c2 ON c1.ClubId = c2.ClubId
            WHERE c1.UserId = @UserId AND c2.UserId = u.Id
          ) AS SharedClubs,
          (
            SELECT COUNT(*)
            FROM BookReviews r1
            JOIN BookReviews r2 ON r1.BookId = r2.BookId
            WHERE r1.UserId = @UserId AND r2.UserId = u.Id
          ) AS SharedBooks,
          (
            SELECT AVG(ABS(CAST(r1.Rating AS FLOAT) - CAST(r2.Rating AS FLOAT)))
            FROM BookReviews r1
            JOIN BookReviews r2 ON r1.BookId = r2.BookId
            WHERE r1.UserId = @UserId AND r2.UserId = u.Id
          ) AS AvgRatingDiff
        FROM Users u
        WHERE u.Id != @UserId
          AND NOT EXISTS (
            SELECT 1 FROM Friendships
            WHERE (UserId1 = @UserId AND UserId2 = u.Id)
               OR (UserId1 = u.Id   AND UserId2 = @UserId)
          )
          AND NOT EXISTS (
            SELECT 1 FROM FriendRequests
            WHERE ((SenderId = @UserId AND ReceiverId = u.Id)
               OR  (SenderId = u.Id   AND ReceiverId = @UserId))
              AND Status = 'pending'
          )
      `);

    return result.recordset
      .map(u => {
        const tagUnion = u.MyTags + u.TheirTags - u.SharedTags;
        const tagJaccard = tagUnion > 0 ? u.SharedTags / tagUnion : 0;
        const ratingSimilarity = u.SharedBooks > 0 ? Math.max(0, 1 - u.AvgRatingDiff / 4) : 0;
        const compatibility = Math.round((tagJaccard * 0.6 + ratingSimilarity * 0.4) * 100);
        return {
          Id:            u.Id,
          Username:      u.Username,
          AvatarUrl:     u.AvatarUrl,
          MutualFriends: u.MutualFriends,
          SharedTags:    u.SharedTags,
          SharedClubs:   u.SharedClubs,
          Compatibility: compatibility,
          Score: Math.round(
            u.MutualFriends * 0.5 +
            u.SharedTags    * 0.3 +
            u.SharedClubs   * 0.2
          ),
        };
      })
      .filter(u => u.Score > 0)
      .sort((a, b) => b.Score - a.Score)
      .slice(0, limit);
  },
};

module.exports = friendship;
