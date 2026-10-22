import 'dotenv/config';
import { Server } from 'socket.io';
import { allowedOrigins } from '../../middleware/csrf.js';
import { verifySupportSocketTicket } from '../../middleware/auth.js';

let ioRef = null;

export const initSupportSocket = (httpServer) => {
  ioRef = new Server(httpServer, {
    cors: {
      origin: allowedOrigins,
      methods: ['GET', 'POST'],
    },
  });

  ioRef.use((socket, next) => {
    const ticket = String(socket.handshake.auth?.ticket || '');
    const user = verifySupportSocketTicket(ticket);
    if (!user) return next(new Error('Unauthorized support socket'));
    socket.data.user = user;
    return next();
  });

  ioRef.on('connection', (socket) => {
    const user = socket.data.user;
    const role = user.role === 'admin' ? 'admin' : 'user';
    const userId = Number(user.id);
    const ownRoomId = role === 'user' && Number.isFinite(userId) ? `support-user-${userId}` : null;

    socket.data.role = role;
    socket.data.userId = userId;
    socket.data.roomId = ownRoomId;

    const sessionExpiresIn = Number(user.sessionExp) * 1000 - Date.now();
    if (sessionExpiresIn > 0) {
      const sessionExpiryTimer = setTimeout(() => socket.disconnect(true), sessionExpiresIn);
      sessionExpiryTimer.unref?.();
      socket.once('disconnect', () => clearTimeout(sessionExpiryTimer));
    }

    socket.on('support:register', () => {
      if (role === 'admin') {
        socket.join('support-admins');
        socket.emit('support:registered', { role: 'admin' });
        return;
      }

      if (ownRoomId) {
        socket.join(ownRoomId);
        socket.emit('support:registered', { role: 'user', roomId: ownRoomId });
      }
    });

    socket.on('support:join-room', (roomId) => {
      if (typeof roomId !== 'string' || !roomId.trim()) return;
      if (role === 'admin' || roomId === ownRoomId) socket.join(roomId);
    });

    socket.on('support:leave-room', (roomId) => {
      if (typeof roomId !== 'string' || !roomId.trim()) return;
      if (role === 'admin' || roomId === ownRoomId) socket.leave(roomId);
    });
  });

  return ioRef;
};

export const getSupportIo = () => ioRef;
