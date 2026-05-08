const sql = require('mssql');
const config = require('../db/sqlConfig');
const friendshipModel = require('../models/friendship');
const notificationModel = require('../models/notification');
const { emitToUser } = require('../socket');

async function getUserSnippet(pool, userId) {
  const result = await pool.request()
    .input('Id', sql.UniqueIdentifier, userId)
    .query('SELECT Username, AvatarUrl FROM Users WHERE Id = @Id');
  return result.recordset[0];
}

module.exports = {
  // POST /api/friends/request/:userId
  async sendRequest(req, res) {
    const senderId = req.user.userId;
    const { userId: receiverId } = req.params;

    if (senderId === receiverId) {
      return res.status(400).json({ error: 'Cannot send request to yourself' });
    }

    try {
      const requestId = await friendshipModel.sendRequest(senderId, receiverId);

      if (!requestId) {
        return res.status(409).json({ error: 'Request already exists or already friends' });
      }

      const pool = await sql.connect(config);
      const sender = await getUserSnippet(pool, senderId);

      const payload = { requestId, sender: { id: senderId, ...sender } };
      await notificationModel.create(receiverId, 'friend_request', payload);
      emitToUser(receiverId, 'notification:friend_request', payload);

      res.status(201).json({ message: 'Friend request sent', requestId });
    } catch (err) {
      console.error('[Friends] sendRequest error:', err);
      res.status(500).json({ error: 'Failed to send friend request' });
    }
  },

  // DELETE /api/friends/request/:userId
  async cancelRequest(req, res) {
    const senderId = req.user.userId;
    const { userId: receiverId } = req.params;

    try {
      await friendshipModel.cancelRequest(senderId, receiverId);
      res.json({ message: 'Friend request cancelled' });
    } catch (err) {
      console.error('[Friends] cancelRequest error:', err);
      res.status(500).json({ error: 'Failed to cancel request' });
    }
  },

  // PUT /api/friends/request/:requestId/accept
  async acceptRequest(req, res) {
    const userId = req.user.userId;
    const { requestId } = req.params;

    try {
      const request = await friendshipModel.getRequestById(requestId);

      if (!request) return res.status(404).json({ error: 'Request not found' });
      if (request.ReceiverId !== userId) return res.status(403).json({ error: 'Forbidden' });
      if (request.Status !== 'pending') return res.status(409).json({ error: 'Request already responded to' });

      await friendshipModel.acceptRequest(requestId);

      const pool = await sql.connect(config);
      const acceptor = await getUserSnippet(pool, userId);

      const payload = { friend: { id: userId, ...acceptor } };
      await notificationModel.create(request.SenderId, 'friend_accepted', payload);
      emitToUser(request.SenderId, 'notification:friend_accepted', payload);

      res.json({ message: 'Friend request accepted' });
    } catch (err) {
      console.error('[Friends] acceptRequest error:', err);
      res.status(500).json({ error: 'Failed to accept request' });
    }
  },

  // PUT /api/friends/request/:requestId/reject
  async rejectRequest(req, res) {
    const userId = req.user.userId;
    const { requestId } = req.params;

    try {
      const request = await friendshipModel.getRequestById(requestId);

      if (!request) return res.status(404).json({ error: 'Request not found' });
      if (request.ReceiverId !== userId) return res.status(403).json({ error: 'Forbidden' });

      await friendshipModel.rejectRequest(requestId);
      res.json({ message: 'Friend request rejected' });
    } catch (err) {
      console.error('[Friends] rejectRequest error:', err);
      res.status(500).json({ error: 'Failed to reject request' });
    }
  },

  // GET /api/friends/requests
  async getIncomingRequests(req, res) {
    try {
      const requests = await friendshipModel.getIncomingRequests(req.user.userId);
      res.json(requests);
    } catch (err) {
      console.error('[Friends] getIncomingRequests error:', err);
      res.status(500).json({ error: 'Failed to load requests' });
    }
  },

  // GET /api/friends
  async getFriends(req, res) {
    try {
      const friends = await friendshipModel.getFriends(req.user.userId);
      res.json(friends);
    } catch (err) {
      console.error('[Friends] getFriends error:', err);
      res.status(500).json({ error: 'Failed to load friends' });
    }
  },

  // GET /api/friends/suggestions
  async getFriendSuggestions(req, res) {
    try {
      const limit = Math.min(parseInt(req.query.limit) || 10, 50);
      const suggestions = await friendshipModel.getSuggestions(req.user.userId, limit);
      res.json(suggestions);
    } catch (err) {
      console.error('[Friends] getFriendSuggestions error:', err);
      res.status(500).json({ error: 'Failed to load suggestions' });
    }
  },
};
