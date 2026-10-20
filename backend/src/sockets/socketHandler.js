const { Server } = require('socket.io');
const { verifyAccessToken } = require('../utils/jwt');
const prisma = require('../config/prisma');

let ioInstance = null;

function initSocket(server, allowedOrigins) {
  const io = new Server(server, {
    cors: {
      origin: allowedOrigins,
      credentials: true,
      methods: ['GET', 'POST', 'PATCH'],
    },
  });

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.replace('Bearer ', '');
      if (!token) {
        return next(new Error('Authentication token required'));
      }

      const decoded = verifyAccessToken(token);
      if (!decoded || !decoded.userId) {
        return next(new Error('Invalid or expired token'));
      }

      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: { id: true, email: true, fullName: true, isActive: true },
      });

      if (!user || !user.isActive) {
        return next(new Error('User inactive or not found'));
      }

      socket.user = user;
      next();
    } catch (err) {
      next(new Error('Socket authentication failed'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`[Socket] User connected: ${socket.user.fullName} (${socket.user.id})`);

    // Join personal user room
    socket.join(`user:${socket.user.id}`);

    // Join tenant room after verifying membership
    socket.on('join_tenant', async ({ tenantId }) => {
      if (!tenantId) return;

      const member = await prisma.tenantMember.findFirst({
        where: {
          tenantId,
          userId: socket.user.id,
          status: 'ACTIVE',
        },
      });

      if (member) {
        socket.join(`tenant:${tenantId}`);
        console.log(`[Socket] ${socket.user.fullName} joined tenant room: tenant:${tenantId}`);
      }
    });

    socket.on('disconnect', () => {
      console.log(`[Socket] User disconnected: ${socket.user.id}`);
    });
  });

  ioInstance = io;
  return io;
}

function getIO() {
  return ioInstance;
}

// Event dispatcher helpers
function emitToTenant(tenantId, event, data) {
  if (ioInstance) {
    ioInstance.to(`tenant:${tenantId}`).emit(event, data);
  }
}

function emitToUser(userId, event, data) {
  if (ioInstance) {
    ioInstance.to(`user:${userId}`).emit(event, data);
  }
}

module.exports = {
  initSocket,
  getIO,
  emitToTenant,
  emitToUser,
};
