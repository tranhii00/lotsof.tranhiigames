const io = require('socket.io-client');
const { EVENTS, GAME_TYPES } = require('./src/config');

const host = io('http://localhost:3001');
const guest = io('http://localhost:3001');

host.on('connect', () => {
  console.log('Host connected:', host.id);
  host.emit(EVENTS.CREATE_ROOM, { playerName: 'HostPlayer' });
});

host.on(EVENTS.ROOM_CREATED, ({ roomId }) => {
  console.log('Room created:', roomId);
  guest.connect();
  guest.emit(EVENTS.JOIN_ROOM, { roomId, playerName: 'GuestPlayer' });
});

host.on(EVENTS.ROOM_READY, (data) => {
  console.log('Host received ROOM_READY:', data);
  // Host selects game
  console.log('Host emitting SELECT_GAME...');
  host.emit(EVENTS.SELECT_GAME, { gameType: GAME_TYPES.CARO });
});

guest.on(EVENTS.ROOM_READY, (data) => {
  console.log('Guest received ROOM_READY:', data);
});

host.on(EVENTS.GAME_STARTED, (data) => {
  console.log('Host received GAME_STARTED:', data);
});

guest.on(EVENTS.GAME_STARTED, (data) => {
  console.log('Guest received GAME_STARTED:', data);
  setTimeout(() => {
    process.exit(0);
  }, 1000);
});
