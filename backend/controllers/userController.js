const sql = require('mssql');
const config = require('../db/sqlConfig');
const { processBadge } = require('../models/achievementProgress');
const routeModel = require('../models/route');
const { v4: uuidv4 } = require('uuid');

const userController = {
  async getProfile(req, res) {
    const userId = req.user.userId;
    try {
      const pool = await sql.connect(config);

      const userResult = await pool.request()
        .input('UserId', sql.UniqueIdentifier, userId)
        .query('SELECT Id, Username, Email, AvatarUrl, Age FROM Users WHERE Id = @UserId');
      if (userResult.recordset.length === 0) return res.status(404).json({ error: 'User not found' });

      const tagResult = await pool.request()
        .input('UserId', sql.UniqueIdentifier, userId)
        .query(`
          SELECT t.Id, t.Name, t.Type
          FROM UserTagPreferences up
          JOIN Tags t ON up.TagId = t.Id
          WHERE up.UserId = @UserId
        `);

      const routeResult = await pool.request()
        .input('UserId', sql.UniqueIdentifier, userId)
        .query(`
          SELECT r.Id, r.Name, r.Description, r.Category, r.ImageUrl, ur.Status
          FROM UserRoutes ur
          JOIN Routes r ON ur.RouteId = r.Id
          WHERE ur.UserId = @UserId AND ur.Status = 'in_progress'
        `);

      res.json({
        user: userResult.recordset[0],
        tags: tagResult.recordset,
        routes: routeResult.recordset
      });
    } catch (error) {
      console.error('Error fetching user profile:', error);
      res.status(500).json({ error: 'Failed to fetch user profile' });
    }
  },

  async getPublicProfile(req, res) {
    const { userId } = req.params;
    const viewerId = req.user.userId;
    try {
      const pool = await sql.connect(config);

      const userResult = await pool.request()
        .input('UserId', sql.UniqueIdentifier, userId)
        .query('SELECT Id, Username, AvatarUrl, Age FROM Users WHERE Id = @UserId');

      if (userResult.recordset.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }

      const badgesResult = await pool.request()
        .input('UserId', sql.UniqueIdentifier, userId)
        .query(`
          SELECT b.Id, b.Name, b.Description, b.IconUrl, b.ImageUrl, ub.AwardedAt
          FROM UserBadges ub
          JOIN Badges b ON ub.BadgeId = b.Id
          WHERE ub.UserId = @UserId
          ORDER BY ub.AwardedAt DESC
        `);

      const tagsResult = await pool.request()
        .input('UserId', sql.UniqueIdentifier, userId)
        .query(`
          SELECT t.Id, t.Name, t.Type
          FROM UserTagPreferences up
          JOIN Tags t ON up.TagId = t.Id
          WHERE up.UserId = @UserId
        `);

      // Друзі профілю (перші 3 + загальна кількість)
      const friendsResult = await pool.request()
        .input('UserId', sql.UniqueIdentifier, userId)
        .query(`
          SELECT TOP 3 u.Id, u.Username, u.AvatarUrl
          FROM Friendships f
          JOIN Users u ON u.Id = CASE WHEN f.UserId1 = @UserId THEN f.UserId2 ELSE f.UserId1 END
          WHERE f.UserId1 = @UserId OR f.UserId2 = @UserId
        `);

      const friendsCountResult = await pool.request()
        .input('UserId', sql.UniqueIdentifier, userId)
        .query(`
          SELECT COUNT(*) AS Total
          FROM Friendships
          WHERE UserId1 = @UserId OR UserId2 = @UserId
        `);

      // Статус дружби відносно viewer-а
      const friendshipResult = await pool.request()
        .input('A', sql.UniqueIdentifier, viewerId)
        .input('B', sql.UniqueIdentifier, userId)
        .query(`
          SELECT
            CASE
              WHEN EXISTS (
                SELECT 1 FROM Friendships
                WHERE (UserId1 = @A AND UserId2 = @B) OR (UserId1 = @B AND UserId2 = @A)
              ) THEN 'friends'
              WHEN EXISTS (
                SELECT 1 FROM FriendRequests
                WHERE SenderId = @A AND ReceiverId = @B AND Status = 'pending'
              ) THEN 'request_sent'
              WHEN EXISTS (
                SELECT 1 FROM FriendRequests
                WHERE SenderId = @B AND ReceiverId = @A AND Status = 'pending'
              ) THEN 'request_received'
              ELSE 'none'
            END AS FriendshipStatus
        `);

      // Клуби до яких належить юзер
      const clubsResult = await pool.request()
        .input('UserId', sql.UniqueIdentifier, userId)
        .query(`
          SELECT c.Id, c.Name, c.AvatarUrl
          FROM ClubMembers cm
          JOIN Clubs c ON c.Id = cm.ClubId
          WHERE cm.UserId = @UserId AND c.IsActive = 1
        `);

      res.json({
        user: userResult.recordset[0],
        badges: badgesResult.recordset,
        tags: tagsResult.recordset,
        friends: friendsResult.recordset,
        friendsTotal: friendsCountResult.recordset[0].Total,
        friendshipStatus: friendshipResult.recordset[0].FriendshipStatus,
        clubs: clubsResult.recordset,
      });
    } catch (error) {
      console.error('Error fetching public profile:', error);
      res.status(500).json({ error: 'Failed to fetch user profile' });
    }
  },

  async updateProfile(req, res) {
    const userId = req.user.userId;
    const { username, age } = req.body;    

    if (!username || !username.trim()) {
      return res.status(400).json({ error: 'Username is required.' });
    }

    try {
      const pool = await sql.connect(config);

      const duplicate = await pool.request()
        .input('Username', sql.NVarChar, username.trim())
        .input('UserId', sql.UniqueIdentifier, userId)
        .query('SELECT Id FROM Users WHERE Username = @Username AND Id != @UserId');

      if (duplicate.recordset.length > 0) {
        return res.status(409).json({ error: 'Username is already taken.' });
      }

      await pool.request()
        .input('Username', sql.NVarChar, username.trim())
        .input('Age', sql.Int, age ? parseInt(age) : null)
        .input('UserId', sql.UniqueIdentifier, userId)
        .query('UPDATE Users SET Username = @Username, Age = @Age WHERE Id = @UserId');

      res.json({ message: 'Profile updated.' });
    } catch (error) {
      console.error('Error updating profile:', error);
      res.status(500).json({ error: 'Failed to update profile.' });
    }
  },

  async leaveReview(req, res) {
      const { routeId, bookId } = req.params;
      const { rating, reviewText } = req.body;

      if (!rating || rating < 1 || rating > 5) {
        return res.status(400).json({ error: 'Rating must be between 1 and 5' });
      }

      try {
        const pool = await sql.connect(config);
        const userId = req.user.userId;

        const newBadges = [];
        const tryBadge = async (name, payload = {}) => {
          const awarded = await processBadge(userId, name, payload);
          if (awarded) newBadges.push(awarded);
        };

        // Перевірка, чи користувач почав маршрут
        const routeCheck = await pool.request()
          .input('UserId', sql.UniqueIdentifier, userId)
          .input('RouteId', sql.UniqueIdentifier, routeId)
          .query('SELECT * FROM UserRoutes WHERE UserId = @UserId AND RouteId = @RouteId');

        if (routeCheck.recordset.length === 0) {
          return res.status(400).json({ error: 'You have not started this route' });
        }

        // Додавання відгуку
        await pool.request()
          .input('Id', sql.UniqueIdentifier, uuidv4())
          .input('UserId', sql.UniqueIdentifier, userId)
          .input('BookId', sql.UniqueIdentifier, bookId)
          .input('Rating', sql.Int, rating)
          .input('ReviewText', sql.NVarChar, reviewText || '')
          .input('CreatedAt', sql.DateTime, new Date())
          .query(`
            INSERT INTO BookReviews (Id, UserId, BookId, Rating, ReviewText, CreatedAt)
            VALUES (@Id, @UserId, @BookId, @Rating, @ReviewText, @CreatedAt)
          `);

        // Оновлення або вставка прогресу читання
        await pool.request()
          .input('UserId', sql.UniqueIdentifier, userId)
          .input('BookId', sql.UniqueIdentifier, bookId)
          .input('RouteId', sql.UniqueIdentifier, routeId)
          .input('IsRead', sql.Bit, 1)
          .input('ReadAt', sql.DateTime, new Date())
          .query(`
            MERGE UserBookProgress AS target
            USING (SELECT @UserId AS UserId, @BookId AS BookId, @RouteId AS RouteId) AS source
            ON (target.UserId = source.UserId AND target.BookId = source.BookId AND target.RouteId = source.RouteId)
            WHEN MATCHED THEN
              UPDATE SET IsRead = @IsRead, ReadAt = @ReadAt
            WHEN NOT MATCHED THEN
              INSERT (UserId, BookId, RouteId, IsRead, ReadAt)
              VALUES (@UserId, @BookId, @RouteId, @IsRead, @ReadAt);
          `);

        // Обробка нагород
        await tryBadge('First Book Completed');

        // Перевірка, чи всі книги прочитані
        const booksInRoute = await pool.request()
          .input('RouteId', sql.UniqueIdentifier, routeId)
          .query('SELECT BookId FROM RouteBooks WHERE RouteId = @RouteId');

        const completedBooks = await pool.request()
          .input('UserId', sql.UniqueIdentifier, userId)
          .input('RouteId', sql.UniqueIdentifier, routeId)
          .query(`
            SELECT BookId FROM UserBookProgress
            WHERE UserId = @UserId AND RouteId = @RouteId AND IsRead = 1
          `);

        if (completedBooks.recordset.length === booksInRoute.recordset.length) {
          await pool.request()
            .input('UserId', sql.UniqueIdentifier, userId)
            .input('RouteId', sql.UniqueIdentifier, routeId)
            .query(`
              UPDATE UserRoutes
              SET Status = 'completed', CompletedAt = GETDATE()
              WHERE UserId = @UserId AND RouteId = @RouteId
            `);

          await tryBadge('First Route Completed');

          const isMonthly = await pool.request()
            .input('RouteId', sql.UniqueIdentifier, routeId)
            .query('SELECT IsMonthly FROM Routes WHERE Id = @RouteId');

          if (isMonthly.recordset[0]?.IsMonthly) {
            await tryBadge('Monthly Champion');
          }

          await tryBadge('Monthly Route Master');
          await tryBadge('Speed Reader', { routeId });
        }

        await tryBadge('Multiple Genres Explorer');

        res.json({
          message: 'Review submitted and progress updated',
          newBadges
        });
      } catch (error) {
        console.error('Error submitting review:', error);
        res.status(500).json({ error: 'Failed to submit review', details: error.message });
      }
    },

    async getUserBadges(req, res) {
        const userId = req.user.userId;
        try {
        const pool = await sql.connect(config);
        const result = await pool.request()
            .input('UserId', sql.UniqueIdentifier, userId)
            .query(`
            SELECT b.*, ub.AwardedAt
            FROM UserBadges ub
            JOIN Badges b ON ub.BadgeId = b.Id
            WHERE ub.UserId = @UserId
            `);
        res.json(result.recordset);
        } catch (error) {
        console.error('Error fetching user badges:', error);
        res.status(500).json({ error: 'Failed to fetch user badges' });
        }
  },

  async updateTags(req, res) {
    const userId = req.user.userId;
    const { tagIds = [] } = req.body;
    if (tagIds.length === 0) return res.status(400).json({ error: 'At least one tag must be selected.' });

    try {
      const pool = await sql.connect(config);
      await pool.request()
        .input('UserId', sql.UniqueIdentifier, userId)
        .query('DELETE FROM UserTagPreferences WHERE UserId = @UserId');

      for (const tagId of tagIds) {
        await pool.request()
          .input('UserId', sql.UniqueIdentifier, userId)
          .input('TagId', sql.UniqueIdentifier, tagId)
          .query('INSERT INTO UserTagPreferences (UserId, TagId) VALUES (@UserId, @TagId)');
      }

      res.json({ message: 'Preferences updated successfully.' });
    } catch (error) {
      console.error('Error updating preferences:', error);
      res.status(500).json({ error: 'Failed to update preferences.' });
    }
  },

  async removeTag(req, res) {
    const userId = req.user.userId;
    const { tagId } = req.params;
    if (!tagId) return res.status(400).json({ error: 'Tag ID is required.' });

    try {
      const pool = await sql.connect(config);
      await pool.request()
        .input('UserId', sql.UniqueIdentifier, userId)
        .input('TagId', sql.UniqueIdentifier, tagId)
        .query('DELETE FROM UserTagPreferences WHERE UserId = @UserId AND TagId = @TagId');
      res.json({ message: 'Tag removed successfully.' });
    } catch (error) {
      console.error('Error removing tag:', error);
      res.status(500).json({ error: 'Failed to remove tag.' });
    }
  },

  async getActiveRoutes(req, res) {
    try {
      const routes = await routeModel.getActiveRoutes(req.user.userId);
      res.json(routes);
    } catch (error) {
      console.error('Error fetching active routes:', error);
      res.status(500).json({ error: 'Failed to fetch active routes.' });
    }
  },

  async getCompletedRoutes(req, res) {
    try {
      const routes = await routeModel.getCompletedRoutes(req.user.userId);
      res.json(routes);
    } catch (error) {
      console.error('Error fetching completed routes:', error);
      res.status(500).json({ error: 'Failed to fetch completed routes.' });
    }
  },

  async getSuggestedRoutes(req, res) {
    try {
      const routes = await routeModel.getSuggestedRoutes(req.user.userId);
      res.json(routes);
    } catch (error) {
      console.error('Error fetching suggested routes:', error);
      res.status(500).json({ error: 'Failed to fetch suggested routes.' });
    }
  },
  async getUserTags(req, res) {
    const userId = req.user.userId;
    try {
        const pool = await sql.connect(config);
        const result = await pool.request()
        .input('UserId', sql.UniqueIdentifier, userId)
        .query(`
            SELECT t.Id, t.Name, t.Type
            FROM UserTagPreferences utp
            JOIN Tags t ON utp.TagId = t.Id
            WHERE utp.UserId = @UserId
        `);
        res.json(result.recordset);
    } catch (error) {
        console.error('Error fetching user tags:', error);
        res.status(500).json({ error: 'Failed to fetch user tags.' });
    }
    }

};

module.exports = userController;
