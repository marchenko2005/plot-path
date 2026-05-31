const sql = require('mssql');
const config = require('../db/sqlConfig');
const clubModel = require('../models/club');
const { emitToUser, getIO } = require('../socket');
const { processBadge } = require('../models/achievementProgress');

function requireMember(role) {
  return role !== null;
}
function requireAdmin(role) {
  return role === 'admin';
}

module.exports = {
  // POST /api/clubs
  async createClub(req, res) {
    const { name, description, avatarUrl, isPublic, tagIds } = req.body;
    if (!name?.trim()) return res.status(400).json({ error: 'Club name is required' });
    try {
      const result = await clubModel.create({
        name: name.trim(), description, avatarUrl, isPublic, tagIds, creatorId: req.user.userId,
      });
      res.status(201).json(result);
    } catch (err) {
      console.error('[Club] createClub error:', err);
      res.status(500).json({ error: 'Failed to create club' });
    }
  },

  // GET /api/clubs/search?q=&page=
  async searchClubs(req, res) {
    const { q, page } = req.query;
    try {
      const clubs = await clubModel.search(q, parseInt(page) || 1);
      res.json(clubs);
    } catch (err) {
      console.error('[Club] searchClubs error:', err);
      res.status(500).json({ error: 'Failed to search clubs' });
    }
  },

  // GET /api/clubs/my
  async getMyClubs(req, res) {
    try {
      const clubs = await clubModel.getMyClubs(req.user.userId);
      res.json(clubs);
    } catch (err) {
      console.error('[Club] getMyClubs error:', err);
      res.status(500).json({ error: 'Failed to load clubs' });
    }
  },

  // GET /api/clubs/:clubId
  async getClub(req, res) {
    const { clubId } = req.params;
    try {
      const data = await clubModel.getById(clubId);
      if (!data) return res.status(404).json({ error: 'Club not found' });

      const role = await clubModel.getMemberRole(clubId, req.user.userId);
      const isMember = role !== null;

      // Non-members can see public clubs but not messages/members list
      if (!isMember && !data.IsPublic) {
        return res.status(403).json({ error: 'This club is private' });
      }

      let myRating = null;
      if (data.currentBook) {
        myRating = await clubModel.getUserRating(data.currentBook.ClubBookId, req.user.userId);
      }

      res.json({ ...data, viewerRole: role, myRating });
    } catch (err) {
      console.error('[Club] getClub error:', err);
      res.status(500).json({ error: 'Failed to load club' });
    }
  },

  // POST /api/clubs/join/:inviteCode
  async joinByCode(req, res) {
    const { inviteCode } = req.params;
    try {
      const result = await clubModel.joinByCode(inviteCode, req.user.userId);
      if (!result) return res.status(404).json({ error: 'Invalid invite code' });
      if (result.alreadyMember) return res.status(409).json({ error: 'Already a member' });
      res.json({ message: 'Joined successfully', clubId: result.clubId });
    } catch (err) {
      console.error('[Club] joinByCode error:', err);
      res.status(500).json({ error: 'Failed to join club' });
    }
  },

  // DELETE /api/clubs/:clubId/leave
  async leaveClub(req, res) {
    const { clubId } = req.params;
    try {
      const role = await clubModel.getMemberRole(clubId, req.user.userId);
      if (!requireMember(role)) return res.status(403).json({ error: 'Not a member' });

      const result = await clubModel.leave(clubId, req.user.userId);
      if (result.error === 'last_admin') {
        return res.status(400).json({ error: 'Cannot leave — you are the only admin. Assign another admin first.' });
      }
      res.json({ message: 'Left club' });
    } catch (err) {
      console.error('[Club] leaveClub error:', err);
      res.status(500).json({ error: 'Failed to leave club' });
    }
  },

  // PUT /api/clubs/:clubId/members/:userId/role
  async setMemberRole(req, res) {
    const { clubId, userId: targetId } = req.params;
    const { role } = req.body;
    if (!['admin', 'member'].includes(role)) {
      return res.status(400).json({ error: 'Role must be admin or member' });
    }
    try {
      const viewerRole = await clubModel.getMemberRole(clubId, req.user.userId);
      if (!requireAdmin(viewerRole)) return res.status(403).json({ error: 'Admin only' });

      const targetRole = await clubModel.getMemberRole(clubId, targetId);
      if (!requireMember(targetRole)) return res.status(404).json({ error: 'User is not a member' });

      await clubModel.setMemberRole(clubId, targetId, role);
      res.json({ message: 'Role updated' });
    } catch (err) {
      console.error('[Club] setMemberRole error:', err);
      res.status(500).json({ error: 'Failed to update role' });
    }
  },

  // PUT /api/clubs/:clubId
  async updateClub(req, res) {
    const { clubId } = req.params;
    const { name, description, avatarUrl, isPublic, tagIds } = req.body;
    if (!name?.trim()) return res.status(400).json({ error: 'Club name is required' });
    try {
      const role = await clubModel.getMemberRole(clubId, req.user.userId);
      if (!requireAdmin(role)) return res.status(403).json({ error: 'Admin only' });
      await clubModel.update(clubId, { name: name.trim(), description, avatarUrl, isPublic, tagIds });
      res.json({ message: 'Club updated' });
    } catch (err) {
      console.error('[Club] updateClub error:', err);
      res.status(500).json({ error: 'Failed to update club' });
    }
  },

  // POST /api/clubs/:clubId/book
  async setCurrentBook(req, res) {
    const { clubId } = req.params;
    const { bookId, startDate, endDate } = req.body;
    if (!bookId || !startDate || !endDate) {
      return res.status(400).json({ error: 'bookId, startDate and endDate are required' });
    }
    try {
      const role = await clubModel.getMemberRole(clubId, req.user.userId);
      if (!requireAdmin(role)) return res.status(403).json({ error: 'Admin only' });

      const clubBookId = await clubModel.setCurrentBook(clubId, bookId, startDate, endDate);

      // Notify all club members via Socket.IO
      getIO().to(`club:${clubId}`).emit('club:book_changed', { clubId, clubBookId });

      res.status(201).json({ message: 'Book set', clubBookId });
    } catch (err) {
      console.error('[Club] setCurrentBook error:', err);
      res.status(500).json({ error: 'Failed to set book' });
    }
  },

  // POST /api/clubs/:clubId/book/complete
  async completeCurrentBook(req, res) {
    const { clubId } = req.params;
    try {
      const role = await clubModel.getMemberRole(clubId, req.user.userId);
      if (!requireAdmin(role)) return res.status(403).json({ error: 'Admin only' });

      const completed = await clubModel.completeCurrentBook(clubId);
      if (!completed) return res.status(404).json({ error: 'No active book' });

      getIO().to(`club:${clubId}`).emit('club:book_completed', { clubId });

      res.json({ message: 'Book completed' });
    } catch (err) {
      console.error('[Club] completeCurrentBook error:', err);
      res.status(500).json({ error: 'Failed to complete book' });
    }
  },

  // POST /api/clubs/:clubId/book/rate
  async rateBook(req, res) {
    const { clubId } = req.params;
    const { clubBookId, rating } = req.body;
    if (!clubBookId || rating == null || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'clubBookId and rating (1–5) are required' });
    }
    try {
      const role = await clubModel.getMemberRole(clubId, req.user.userId);
      if (!requireMember(role)) return res.status(403).json({ error: 'Members only' });

      const { allRated } = await clubModel.rateBook(clubId, clubBookId, req.user.userId, rating);

      if (allRated) {
        await clubModel.completeCurrentBook(clubId);
        getIO().to(`club:${clubId}`).emit('club:book_completed', { clubId });
      }

      // Зарахувати оцінку як прогрес у всіх активних маршрутах, що містять цю книгу
      const userId = req.user.userId;
      const pool = await sql.connect(config);

      const bookResult = await pool.request()
        .input('ClubBookId', sql.UniqueIdentifier, clubBookId)
        .query('SELECT BookId FROM ClubBooks WHERE Id = @ClubBookId');

      if (bookResult.recordset.length > 0) {
        const bookId = bookResult.recordset[0].BookId;

        const activeRoutes = await pool.request()
          .input('UserId', sql.UniqueIdentifier, userId)
          .input('BookId', sql.UniqueIdentifier, bookId)
          .query(`
            SELECT ur.RouteId FROM UserRoutes ur
            JOIN RouteBooks rb ON rb.RouteId = ur.RouteId
            WHERE ur.UserId = @UserId AND rb.BookId = @BookId AND ur.Status = 'in_progress'
          `);

        const newBadges = [];
        const tryBadge = async (name, payload = {}) => {
          const awarded = await processBadge(userId, name, payload);
          if (awarded) newBadges.push(awarded);
        };

        for (const { RouteId: routeId } of activeRoutes.recordset) {
          await pool.request()
            .input('UserId', sql.UniqueIdentifier, userId)
            .input('BookId', sql.UniqueIdentifier, bookId)
            .input('RouteId', sql.UniqueIdentifier, routeId)
            .query(`
              MERGE UserBookProgress AS target
              USING (SELECT @UserId AS UserId, @BookId AS BookId, @RouteId AS RouteId) AS source
              ON (target.UserId = source.UserId AND target.BookId = source.BookId AND target.RouteId = source.RouteId)
              WHEN MATCHED THEN UPDATE SET IsRead = 1, ReadAt = GETDATE()
              WHEN NOT MATCHED THEN INSERT (UserId, BookId, RouteId, IsRead, ReadAt)
                VALUES (@UserId, @BookId, @RouteId, 1, GETDATE());
            `);

          await tryBadge('First Book Completed');

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
                UPDATE UserRoutes SET Status = 'completed', CompletedAt = GETDATE()
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
        }

        await tryBadge('Multiple Genres Explorer');

        res.json({ message: 'Rating saved', allRated, newBadges });
        return;
      }

      res.json({ message: 'Rating saved', allRated });
    } catch (err) {
      console.error('[Club] rateBook error:', err);
      res.status(500).json({ error: 'Failed to save rating' });
    }
  },

  // GET /api/clubs/:clubId/history
  async getHistory(req, res) {
    const { clubId } = req.params;
    try {
      const role = await clubModel.getMemberRole(clubId, req.user.userId);
      if (!requireMember(role)) return res.status(403).json({ error: 'Members only' });

      const history = await clubModel.getHistory(clubId);
      res.json(history);
    } catch (err) {
      console.error('[Club] getHistory error:', err);
      res.status(500).json({ error: 'Failed to load history' });
    }
  },

  // GET /api/clubs/:clubId/messages
  async getMessages(req, res) {
    const { clubId } = req.params;
    const limit = parseInt(req.query.limit) || 50;
    try {
      const role = await clubModel.getMemberRole(clubId, req.user.userId);
      if (!requireMember(role)) return res.status(403).json({ error: 'Members only' });

      const messages = await clubModel.getMessages(clubId, limit);
      res.json(messages);
    } catch (err) {
      console.error('[Club] getMessages error:', err);
      res.status(500).json({ error: 'Failed to load messages' });
    }
  },

  // GET /api/clubs/:clubId/recommendations
  async getRecommendations(req, res) {
    const { clubId } = req.params;
    try {
      const role = await clubModel.getMemberRole(clubId, req.user.userId);
      if (!requireMember(role)) return res.status(403).json({ error: 'Members only' });

      const recommendations = await clubModel.getRecommendations(clubId);
      res.json(recommendations);
    } catch (err) {
      console.error('[Club] getRecommendations error:', err);
      res.status(500).json({ error: 'Failed to load recommendations' });
    }
  },
};
