import { io } from 'socket.io-client';

let socketInstance = null;

const resolveSocketUrl = () => {
  if (process.env.NODE_ENV === 'development') {
    return 'http://localhost:3006';
  }

  const envUrl = (process.env.REACT_APP_API_URL || '').trim();
  if (envUrl) return envUrl.replace(/\/$/, '');

  return window.location.origin;
};

export const getSupportSocket = () => {
  if (socketInstance) return socketInstance;

  socketInstance = io(resolveSocketUrl(), {
    transports: ['websocket', 'polling']
  });

  return socketInstance;
};

export const disconnectSupportSocket = () => {
  if (!socketInstance) return;
  socketInstance.disconnect();
  socketInstance = null;
};
