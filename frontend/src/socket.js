import { io } from 'socket.io-client';

// Dev: dùng localhost:3001 (vì Vite chạy trên 5173 riêng)
// Production: tự kết nối về cùng domain (Railway URL)
const URL = import.meta.env.VITE_SOCKET_URL || window.location.origin;

export const socket = io(URL, {
  autoConnect: false,
  transports: ['websocket', 'polling']
});
