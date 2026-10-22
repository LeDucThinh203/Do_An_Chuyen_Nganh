import { io } from 'socket.io-client';
import Session from '../Session/session';
import { getSupportSocketTicket } from '../api';

let socketInstance = null;

const resolveSocketUrl = () => {
  if (process.env.NODE_ENV === 'development') {
    return 'http://localhost:3006';
  }

  return (process.env.REACT_APP_SOCKET_URL || 'https://my-store-backend-4fuu.onrender.com').replace(/\/$/, '');
};

export const getSupportSocket = () => {
  if (socketInstance) return socketInstance;

  socketInstance = io(resolveSocketUrl(), {
    transports: ['websocket', 'polling'],
    auth: (callback) => {
      if (!Session.isLoggedIn()) {
        callback({});
        return;
      }
      getSupportSocketTicket()
        .then((payload) => callback({ ticket: payload?.ticket || '' }))
        .catch(() => callback({ ticket: '' }));
    },
  });

  return socketInstance;
};

export const disconnectSupportSocket = () => {
  if (!socketInstance) return;
  socketInstance.disconnect();
  socketInstance = null;
};

if (typeof window !== 'undefined') {
  window.addEventListener(Session.AUTH_CHANGED_EVENT, () => {
    if (!Session.isLoggedIn()) disconnectSupportSocket();
  });
}
