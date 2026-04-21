import { Server } from 'socket.io';

let ioRef = null;

export const initSupportSocket = (httpServer) => {
  ioRef = new Server(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
      allowedHeaders: ['Content-Type', 'Authorization']
    }
  });

  ioRef.on('connection', (socket) => {
    socket.on('support:register', (payload = {}) => {
      const role = payload.role === 'admin' ? 'admin' : 'user';
      const userId = payload.userId ? Number(payload.userId) : null;
      const guestId = payload.guestId ? String(payload.guestId).trim() : null;

      socket.data.role = role;
      socket.data.userId = userId;
      socket.data.guestId = guestId;

      if (role === 'admin') {
        socket.join('support-admins');
        socket.emit('support:registered', { role: 'admin' });
        return;
      }

      const roomId = userId ? `support-user-${userId}` : guestId ? `support-guest-${guestId}` : null;
      if (roomId) {
        socket.join(roomId);
        socket.data.roomId = roomId;
        socket.emit('support:registered', { role: 'user', roomId });
      }
    });

    socket.on('support:join-room', (roomId) => {
      if (!roomId || typeof roomId !== 'string') return;
      socket.join(roomId);
    });

    socket.on('support:leave-room', (roomId) => {
      if (!roomId || typeof roomId !== 'string') return;
      socket.leave(roomId);
    });
  });

  return ioRef;
};

export const getSupportIo = () => ioRef;
