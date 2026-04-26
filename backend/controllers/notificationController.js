const sql = require('mssql');
const config = require('../db/sqlConfig');
const notificationModel = require('../models/notification');

module.exports = {
  // GET /api/notifications/summary
  async getSummary(req, res) {
    try {
      const pool = await sql.connect(config);
      const result = await pool.request()
        .input('UserId', sql.UniqueIdentifier, req.user.userId)
        .query(`
          SELECT
            (SELECT COUNT(*) FROM FriendRequests
             WHERE ReceiverId = @UserId AND Status = 'pending')                          AS FriendRequests,
            (SELECT COUNT(*) FROM PrivateMessages pm
             JOIN PrivateChats pc ON pc.Id = pm.ChatId
             WHERE (pc.UserId1 = @UserId OR pc.UserId2 = @UserId)
               AND pm.SenderId != @UserId AND pm.IsRead = 0)                             AS UnreadMessages,
            (SELECT COUNT(*) FROM Notifications
             WHERE UserId = @UserId AND IsRead = 0)                                      AS UnreadNotifications
        `);
      const row = result.recordset[0];
      res.json({
        friendRequests:       row.FriendRequests,
        unreadMessages:       row.UnreadMessages,
        unreadNotifications:  row.UnreadNotifications,
      });
    } catch (err) {
      console.error('[Notifications] getSummary error:', err);
      res.status(500).json({ error: 'Failed to load summary' });
    }
  },

  // GET /api/notifications
  async getNotifications(req, res) {
    try {
      const notifications = await notificationModel.getForUser(req.user.userId);
      res.json(notifications);
    } catch (err) {
      console.error('[Notifications] getNotifications error:', err);
      res.status(500).json({ error: 'Failed to load notifications' });
    }
  },

  // GET /api/notifications/unread-count
  async getUnreadCount(req, res) {
    try {
      const count = await notificationModel.getUnreadCount(req.user.userId);
      res.json({ count });
    } catch (err) {
      console.error('[Notifications] getUnreadCount error:', err);
      res.status(500).json({ error: 'Failed to get unread count' });
    }
  },

  // PUT /api/notifications/:id/read
  async markAsRead(req, res) {
    try {
      await notificationModel.markAsRead(req.params.id, req.user.userId);
      res.json({ message: 'Marked as read' });
    } catch (err) {
      console.error('[Notifications] markAsRead error:', err);
      res.status(500).json({ error: 'Failed to mark as read' });
    }
  },

  // PUT /api/notifications/read-all
  async markAllAsRead(req, res) {
    try {
      await notificationModel.markAllAsRead(req.user.userId);
      res.json({ message: 'All marked as read' });
    } catch (err) {
      console.error('[Notifications] markAllAsRead error:', err);
      res.status(500).json({ error: 'Failed to mark all as read' });
    }
  },
};
