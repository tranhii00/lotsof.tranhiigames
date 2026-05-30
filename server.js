const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const { getRoomCount } = require('./src/rooms');
const registerHandlers = require('./src/socketHandlers');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
});

const PORT = process.env.PORT || 3001;
const distPath = path.join(__dirname, 'frontend', 'dist');

// Serve built React app
app.use(express.static(distPath));
app.get('/api/status', (_, res) => res.json({ ok: true, rooms: getRoomCount(), uptime: Math.floor(process.uptime()) }));
app.get('*', (_, res) => res.sendFile(path.join(distPath, 'index.html')));

// Register all socket handlers
registerHandlers(io);

server.listen(PORT, '0.0.0.0', () => {
  console.log('='.repeat(44));
  console.log('  🎮  CỜ CARO MULTIPLAYER SERVER');
  console.log(`  http://localhost:${PORT}`);
  console.log('='.repeat(44));
});
