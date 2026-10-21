import { io } from 'socket.io-client';

const getSocketUrl = () => {
  if (process.env.NEXT_PUBLIC_SOCKET_URL) return process.env.NEXT_PUBLIC_SOCKET_URL;
  if (typeof window !== 'undefined' && window.location.hostname.includes('digitalcrowdtech.in')) {
    return 'https://apitask.digitalcrowdtech.in';
  }
  return 'http://localhost:5100';
};

const SOCKET_URL = getSocketUrl();

let socket = null;

export function getSocket(token, tenantId) {
  if (typeof window === 'undefined') return null;

  if (!socket && token) {
    socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socket.on('connect', () => {
      console.log('[Socket] Connected to TaskDigitalCrowd realtime server');
      if (tenantId) {
        socket.emit('join_tenant', { tenantId });
      }
    });

    socket.on('connect_error', (err) => {
      console.warn('[Socket] Realtime connection warning:', err.message);
    });
  }

  // If already connected and tenantId changed, join new tenant room
  if (socket && tenantId) {
    socket.emit('join_tenant', { tenantId });
  }

  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
