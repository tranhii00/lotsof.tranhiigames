const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
});

const PORT = process.env.PORT || 3001;
const BOARD_SIZE = 15;
const TURN_MS = 30000;

// ── Serve React frontend build ──────────────────────────────────
const distPath = path.join(__dirname, 'frontend', 'dist');
app.use(express.static(distPath));

// ── Game State ──────────────────────────────────────────────────
const rooms = {};

// ── Helpers ─────────────────────────────────────────────────────
function genRoomId() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let id = '';
  for (let i = 0; i < 6; i++) id += chars[Math.floor(Math.random() * chars.length)];
  return rooms[id] ? genRoomId() : id;
}

function emptyBoard() {
  return Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(null));
}

function checkWin(board, r, c, role) {
  const dirs = [[0,1],[1,0],[1,1],[1,-1]];
  for (const [dr, dc] of dirs) {
    let n = 1;
    for (let d = 1; d < 5; d++) {
      const nr = r+dr*d, nc = c+dc*d;
      if (nr<0||nr>=BOARD_SIZE||nc<0||nc>=BOARD_SIZE||board[nr][nc]!==role) break;
      n++;
    }
    for (let d = 1; d < 5; d++) {
      const nr = r-dr*d, nc = c-dc*d;
      if (nr<0||nr>=BOARD_SIZE||nc<0||nc>=BOARD_SIZE||board[nr][nc]!==role) break;
      n++;
    }
    if (n >= 5) return true;
  }
  return false;
}

function checkDraw(board) {
  return board.every(row => row.every(c => c !== null));
}

function startTimer(roomId) {
  const room = rooms[roomId];
  if (!room) return;
  clearTimeout(room.timer);
  io.to(roomId).emit('turn_timer', { timestamp: Date.now(), duration: TURN_MS });
  room.timer = setTimeout(() => {
    if (!rooms[roomId]) return;
    const winner = rooms[roomId].turn === 'X' ? 'O' : 'X';
    io.to(roomId).emit('game_over', { winner, reason: 'timeout' });
    delete rooms[roomId];
  }, TURN_MS);
}

// ── Socket Logic ─────────────────────────────────────────────────
io.on('connection', (socket) => {
  console.log('[+]', socket.id, `| Rooms: ${Object.keys(rooms).length}`);

  // CREATE ROOM
  socket.on('create_room', ({ playerName }) => {
    const roomId = genRoomId();
    rooms[roomId] = {
      players: { [socket.id]: { role: 'X', name: playerName || 'Player X' } },
      board: emptyBoard(),
      turn: 'X',
      timer: null,
      status: 'waiting'
    };
    socket.join(roomId);
    socket.roomId = roomId;
    socket.emit('room_created', { roomId, role: 'X' });
    console.log('[ROOM CREATED]', roomId, 'by', playerName);
  });

  // JOIN ROOM
  socket.on('join_room', ({ roomId, playerName }) => {
    const rid = (roomId || '').toUpperCase().trim();
    const room = rooms[rid];

    if (!room) return socket.emit('join_error', 'Phòng không tồn tại! Kiểm tra lại Room ID.');
    if (room.status !== 'waiting') return socket.emit('join_error', 'Phòng đã đầy hoặc đang trong trận đấu!');

    room.players[socket.id] = { role: 'O', name: playerName || 'Player O' };
    room.status = 'playing';
    socket.join(rid);
    socket.roomId = rid;

    const ids = Object.keys(room.players);
    const xName = room.players[ids[0]].name;
    const oName = room.players[ids[1]].name;

    io.to(ids[0]).emit('match_found', { role: 'X', opponentName: oName, turn: 'X', roomId: rid });
    io.to(ids[1]).emit('match_found', { role: 'O', opponentName: xName, turn: 'X', roomId: rid });
    startTimer(rid);
    console.log('[GAME START]', rid, `| ${xName}(X) vs ${oName}(O)`);
  });

  // MAKE MOVE
  socket.on('make_move', ({ r, c }) => {
    const rid = socket.roomId;
    if (!rid || !rooms[rid]) return;
    const room = rooms[rid];
    const player = room.players[socket.id];
    if (!player || room.turn !== player.role) return;
    if (r<0||r>=BOARD_SIZE||c<0||c>=BOARD_SIZE||room.board[r][c]!==null) return;

    clearTimeout(room.timer);
    room.board[r][c] = player.role;
    io.to(rid).emit('move_made', { r, c, role: player.role });

    if (checkWin(room.board, r, c, player.role)) {
      io.to(rid).emit('game_over', { winner: player.role, reason: 'win' });
      console.log('[GAME OVER]', rid, 'winner:', player.role);
      delete rooms[rid];
    } else if (checkDraw(room.board)) {
      io.to(rid).emit('game_over', { winner: null, reason: 'draw' });
      delete rooms[rid];
    } else {
      room.turn = player.role === 'X' ? 'O' : 'X';
      io.to(rid).emit('turn_update', room.turn);
      startTimer(rid);
    }
  });

  // CHAT
  socket.on('chat_message', ({ message }) => {
    const rid = socket.roomId;
    if (!rid || !rooms[rid]) return;
    const player = rooms[rid].players[socket.id];
    if (!player) return;
    io.to(rid).emit('chat_message', {
      sender: player.name,
      message: String(message).slice(0, 200),
      time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
    });
  });

  // DISCONNECT
  socket.on('disconnect', () => {
    const rid = socket.roomId;
    if (rid && rooms[rid]) {
      clearTimeout(rooms[rid].timer);
      socket.to(rid).emit('opponent_disconnected');
      delete rooms[rid];
      console.log('[ROOM CLOSED]', rid, '- player left');
    }
  });
});

// ── Health check ─────────────────────────────────────────────────
app.get('/api/status', (_, res) => {
  res.json({ status: 'online', rooms: Object.keys(rooms).length, uptime: Math.floor(process.uptime()) });
});

// ── SPA fallback (must be last) ──────────────────────────────────
app.get('*', (_, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

// ── Start ────────────────────────────────────────────────────────
server.listen(PORT, '0.0.0.0', () => {
  console.log('='.repeat(48));
  console.log('  🎮  CỜ CARO MULTIPLAYER  🎮');
  console.log('='.repeat(48));
  console.log(`  Server: http://localhost:${PORT}`);
  console.log('='.repeat(48));
});
