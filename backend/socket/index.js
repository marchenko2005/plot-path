const { Server } = require('socket.io');
const { verifyToken } = require('../utils/jwtHelper');
const privateChatModel = require('../models/privateChat');
const clubModel = require('../models/club');

let io;

function initSocket(server) {
  io = new Server(server, {
    cors: {
      origin: 'http://localhost:3001',
      credentials: true,
    },
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('No token'));
    try {
      const payload = verifyToken(token);
      socket.userId = payload.userId;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', async (socket) => {
    socket.join(`user:${socket.userId}`);
    console.log(`[Socket] User ${socket.userId} connected`);

    // Join all club rooms the user belongs to
    try {
      const clubIds = await clubModel.getUserClubIds(socket.userId);
      for (const clubId of clubIds) {
        socket.join(`club:${clubId}`);
      }
    } catch (err) {
      console.error('[Socket] Failed to join club rooms:', err);
    }

    // ─── Private chat ─────────────────────────────────────────────────────────

    // { receiverId, text }
    socket.on('chat:send', async ({ receiverId, text }) => {
      if (!receiverId || !text?.trim()) return;
      try {
        const chatId = await privateChatModel.getOrCreate(socket.userId, receiverId);
        const message = await privateChatModel.saveMessage(chatId, socket.userId, text.trim());
        io.to(`user:${receiverId}`).emit('chat:message', { chatId, message });
        socket.emit('chat:message', { chatId, message });
      } catch (err) {
        console.error('[Socket] chat:send error:', err);
        socket.emit('chat:error', { error: 'Failed to send message' });
      }
    });

    // { chatId }
    socket.on('chat:read', async ({ chatId }) => {
      if (!chatId) return;
      try {
        await privateChatModel.markAsRead(chatId, socket.userId);
      } catch (err) {
        console.error('[Socket] chat:read error:', err);
      }
    });

    // ─── Club chat ────────────────────────────────────────────────────────────

    // { clubId, text }
    socket.on('club:send', async ({ clubId, text }) => {
      if (!clubId || !text?.trim()) return;
      try {
        const role = await clubModel.getMemberRole(clubId, socket.userId);
        if (!role) return socket.emit('chat:error', { error: 'Not a club member' });

        const message = await clubModel.saveClubMessage(clubId, socket.userId, text.trim());
        io.to(`club:${clubId}`).emit('club:message', { clubId, message });
      } catch (err) {
        console.error('[Socket] club:send error:', err);
        socket.emit('chat:error', { error: 'Failed to send message' });
      }
    });

    // Join a newly-joined club room (called after joinByCode)
    // { clubId }
    socket.on('club:join_room', ({ clubId }) => {
      if (clubId) socket.join(`club:${clubId}`);
    });

    socket.on('disconnect', () => {
      console.log(`[Socket] User ${socket.userId} disconnected`);
    });
  });

  return io;
}

function getIO() {
  if (!io) throw new Error('Socket.IO not initialized');
  return io;
}

function emitToUser(userId, event, data) {
  getIO().to(`user:${userId}`).emit(event, data);
}

module.exports = { initSocket, getIO, emitToUser };
