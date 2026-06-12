const rooms = {};

function genRoomId() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let id = '';
  for (let i = 0; i < 6; i++) id += chars[Math.floor(Math.random() * chars.length)];
  return rooms[id] ? genRoomId() : id;
}

function createRoom(socketId, playerName, avatar = null) {
  const roomId = genRoomId();
  rooms[roomId] = {
    id: roomId,
    status: 'waiting',
    selectedGame: null,
    players: { 
      [socketId]: { 
        id: socketId,
        name: playerName,
        role: 'host',
        score: 0,
        avatar
      } 
    },
    gameState: null,
    timer: null,
  };
  return rooms[roomId];
}

function getRoom(roomId) { return rooms[roomId] || null; }

function deleteRoom(roomId) {
  if (rooms[roomId]) {
    clearTimeout(rooms[roomId].timer);
    delete rooms[roomId];
  }
}

function addPlayer(roomId, socketId, playerName, avatar = null) {
  const room = rooms[roomId];
  if (!room) return false;
  room.players[socketId] = { 
    id: socketId,
    name: playerName,
    role: 'guest',
    score: 0,
    avatar
  };
  room.status = 'lobby'; // Move to lobby when 2 players join
  return true;
}

function getRoomCount() { return Object.keys(rooms).length; }

module.exports = { createRoom, getRoom, deleteRoom, addPlayer, getRoomCount };
