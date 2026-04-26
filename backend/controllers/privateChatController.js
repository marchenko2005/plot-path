const privateChatModel = require('../models/privateChat');

module.exports = {
  // GET /api/chat — список чатів поточного юзера
  async getMyChats(req, res) {
    try {
      const chats = await privateChatModel.getChatsByUser(req.user.userId);
      res.json(chats);
    } catch (err) {
      console.error('[Chat] getMyChats error:', err);
      res.status(500).json({ error: 'Failed to load chats' });
    }
  },

  // GET /api/chat/:userId — отримати або створити чат з іншим юзером, повернути історію
  async getChatWithUser(req, res) {
    try {
      const myId = req.user.userId;
      const { userId: otherId } = req.params;

      if (myId === otherId) {
        return res.status(400).json({ error: 'Cannot chat with yourself' });
      }

      const chatId = await privateChatModel.getOrCreate(myId, otherId);
      const messages = await privateChatModel.getMessages(chatId);
      await privateChatModel.markAsRead(chatId, myId);

      res.json({ chatId, messages });
    } catch (err) {
      console.error('[Chat] getChatWithUser error:', err);
      res.status(500).json({ error: 'Failed to load chat' });
    }
  },
};
