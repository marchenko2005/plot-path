const notificationModel = require('../models/notification');

module.exports = {
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
