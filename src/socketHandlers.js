const { EVENTS, TURN_MS, GAME_TYPES } = require('./config');
const { getWinningLine, checkDraw, emptyBoard } = require('./gameRules');
const { getRandomSentence, normalizeSentence, getMatchSentences } = require('./sentenceScrambleRules');
const { getRandomStarter, isValidWord } = require('./wordChainRules');
const { getRoom, deleteRoom, getRoomCount } = require('./rooms');
const { validateCreateRoom, validateJoinRoom, validateMove, validateChat } = require('./validators');

function sysMsg(text) {
  return { system: true, message: text, time: new Date().toLocaleTimeString('vi-VN', { hour:'2-digit', minute:'2-digit' }) };
}

function createSentenceScores(players) {
  return Object.keys(players).reduce((acc, id) => {
    acc[id] = 0;
    return acc;
  }, {});
}

function createSentencePlayerState(players) {
  return Object.keys(players).reduce((acc, id) => {
    acc[id] = { sentenceIndex: 0, completed: 0 };
    return acc;
  }, {});
}

function emitSentenceRoundToPlayer(io, socketId, gameState) {
  const playerState = gameState.playersState[socketId];
  if (!playerState) return;

  const sentence = gameState.matchSentences[playerState.sentenceIndex];
  if (!sentence) return;

  io.to(socketId).emit(EVENTS.SENTENCE_ROUND_STARTED, {
    round: playerState.sentenceIndex + 1,
    words: sentence.words
  });
}

function startCaroTimer(io, roomId) {
  const room = getRoom(roomId);
  if (!room || room.selectedGame !== GAME_TYPES.CARO) return;
  clearTimeout(room.timer);
  io.to(roomId).emit(EVENTS.TURN_TIMER, { timestamp: Date.now(), duration: TURN_MS });
  room.timer = setTimeout(() => {
    const r = getRoom(roomId);
    if (!r) return;
    const winner = r.gameState.turn === 'X' ? 'O' : 'X';
    r.status = 'finished';
    r.gameState.lastWinner = winner;
    io.to(roomId).emit(EVENTS.GAME_OVER, { winner, reason: 'timeout', winningLine: null });
    io.to(roomId).emit(EVENTS.SYSTEM_MSG, sysMsg('⏰ Hết thời gian! Trận đấu kết thúc.'));
  }, TURN_MS);
}

function startWordChainRound(io, roomId) {
  const room = getRoom(roomId);
  if (!room || room.selectedGame !== GAME_TYPES.WORD_CHAIN) return;

  const gs = room.gameState;
  if (!gs) return;

  clearTimeout(room.timer);

  const activePlayer = room.players[gs.activePlayerId];
  if (!activePlayer) return;

  const requiredLetter = gs.currentWord.slice(-1).toLowerCase();

  io.to(roomId).emit(EVENTS.WORD_ROUND_STARTED, {
    activePlayerId: gs.activePlayerId,
    currentWord: gs.currentWord,
    requiredLetter: requiredLetter,
    hp: gs.hp,
    wordList: gs.usedWords,
    timeLeft: 10
  });

  io.to(roomId).emit(EVENTS.TURN_TIMER, { timestamp: Date.now(), duration: 10_000 });

  room.timer = setTimeout(() => {
    handleWordChainTimeout(io, roomId);
  }, 10_000);
}

function handleWordChainTimeout(io, roomId) {
  const room = getRoom(roomId);
  if (!room || room.selectedGame !== GAME_TYPES.WORD_CHAIN) return;

  const gs = room.gameState;
  if (!gs) return;

  const activeId = gs.activePlayerId;
  const activePlayer = room.players[activeId];
  if (!activePlayer) return;

  // Deduct HP
  gs.hp[activeId] = Math.max(0, gs.hp[activeId] - 1);
  io.to(roomId).emit(EVENTS.WORD_HP_UPDATE, { hp: gs.hp });
  io.to(roomId).emit(EVENTS.SYSTEM_MSG, sysMsg(`⏰ Hết giờ! ${activePlayer.name} bị trừ 1 HP.`));

  if (gs.hp[activeId] <= 0) {
    endWordChainGame(io, roomId, activeId);
  } else {
    // Switch turn
    const playerIds = Object.keys(room.players);
    const nextId = playerIds.find(id => id !== activeId);
    gs.activePlayerId = nextId;

    const freshWord = getRandomStarter();
    gs.currentWord = freshWord;
    gs.usedWords.push(freshWord);

    io.to(roomId).emit(EVENTS.SYSTEM_MSG, sysMsg(`🔄 Đổi lượt! Từ mới: "${freshWord.toUpperCase()}". Lượt tiếp theo thuộc về ${room.players[nextId].name}.`));
    startWordChainRound(io, roomId);
  }
}

function endWordChainGame(io, roomId, loserId) {
  const room = getRoom(roomId);
  if (!room) return;

  clearTimeout(room.timer);
  room.status = 'finished';

  const playerIds = Object.keys(room.players);
  const winnerId = playerIds.find(id => id !== loserId);
  const winner = room.players[winnerId];

  io.to(roomId).emit(EVENTS.WORD_GAME_OVER, {
    winnerId: winnerId,
    winnerName: winner ? winner.name : 'Đối thủ'
  });

  if (winner) {
    io.to(roomId).emit(EVENTS.SYSTEM_MSG, sysMsg(`🏆 ${winner.name} đã chiến thắng chung cuộc!`));
  }
}

module.exports = function registerHandlers(io) {
  io.on('connection', (socket) => {
    console.log(`[+] ${socket.id} | rooms: ${getRoomCount()}`);

    // ── CREATE ROOM ───────────────────────────────────────────
    socket.on(EVENTS.CREATE_ROOM, (payload) => {
      const v = validateCreateRoom(payload);
      if (!v.ok) return socket.emit(EVENTS.JOIN_ERROR, v.error);

      const name = payload.playerName.trim();
      const room = require('./rooms').createRoom(socket.id, name);

      socket.join(room.id);
      socket.roomId = room.id;
      socket.playerName = name;
      socket.emit(EVENTS.ROOM_CREATED, { roomId: room.id, role: 'host' });
      console.log('[CREATE]', room.id, name);
    });

    // ── JOIN ROOM ─────────────────────────────────────────────
    socket.on(EVENTS.JOIN_ROOM, (payload) => {
      const v = validateJoinRoom(payload);
      if (!v.ok) return socket.emit(EVENTS.JOIN_ERROR, v.error);

      const rid = payload.roomId.trim().toUpperCase();
      const name = payload.playerName.trim();
      const room = getRoom(rid);

      if (!room) return socket.emit(EVENTS.JOIN_ERROR, 'Phòng không tồn tại!');
      if (room.status !== 'waiting') return socket.emit(EVENTS.JOIN_ERROR, 'Phòng đã đầy hoặc đang chơi!');

      require('./rooms').addPlayer(rid, socket.id, name);
      socket.join(rid);
      socket.roomId = rid;
      socket.playerName = name;

      const hostId = Object.keys(room.players).find(id => room.players[id].role === 'host');
      const guestId = socket.id;

      // Broadcast room_ready to enter lobby
      io.to(rid).emit(EVENTS.ROOM_READY, {
        roomId: rid,
        hostId: hostId,
        players: room.players
      });
      io.to(rid).emit(EVENTS.SYSTEM_MSG, sysMsg(`👋 ${name} đã vào phòng.`));
      console.log('[LOBBY]', rid, 'ready');
    });

    // ── SELECT GAME (Host only) ───────────────────────────────
    socket.on(EVENTS.SELECT_GAME, ({ gameType }) => {
      console.log(`[SELECT_GAME] Request from ${socket.id} for game: ${gameType}`);
      const rid = socket.roomId;
      const room = rid && getRoom(rid);
      if (!room) {
        console.log(`[SELECT_GAME] Failed: Room not found for socket ${socket.id}`);
        return;
      }
      if (room.status !== 'lobby') {
        console.log(`[SELECT_GAME] Failed: Room status is not lobby. Current status: ${room.status}`);
        return;
      }
      
      const player = room.players[socket.id];
      if (!player) {
        console.log(`[SELECT_GAME] Failed: Player not found in room`);
        return;
      }
      if (player.role !== 'host') {
        console.log(`[SELECT_GAME] Failed: Player is not host. Role: ${player.role}`);
        return;
      }

      if (!Object.values(GAME_TYPES).includes(gameType)) {
        console.log(`[SELECT_GAME] Failed: Invalid game type ${gameType}`);
        return;
      }

      console.log(`[SELECT_GAME] Success! Starting ${gameType} for room ${rid}`);
      room.selectedGame = gameType;
      room.status = 'playing';

      io.to(rid).emit(EVENTS.GAME_SELECTED, { gameType });

      // Initialize game state based on type
      if (gameType === GAME_TYPES.CARO) {
        const players = Object.values(room.players);
        players.find(p => p.role === 'host').caroRole = 'X';
        players.find(p => p.role === 'guest').caroRole = 'O';

        room.gameState = {
          board: emptyBoard(),
          turn: 'X',
          lastWinner: null,
          rematchRequests: {},
          lobbyRequests: {}
        };
        
        io.to(rid).emit(EVENTS.GAME_STARTED, { 
          gameType, 
          turn: 'X',
          hostRole: 'X'
        });
        io.to(rid).emit(EVENTS.SYSTEM_MSG, sysMsg(`🎮 Bắt đầu Cờ Caro!`));
        startCaroTimer(io, rid);

      } else if (gameType === GAME_TYPES.SENTENCE_SCRAMBLE) {
        const matchSentences = getMatchSentences(5);
        room.gameState = {
          targetScore: 5,
          matchSentences,
          rematchRequests: {},
          lobbyRequests: {},
          scores: createSentenceScores(room.players),
          playersState: createSentencePlayerState(room.players)
        };

        io.to(rid).emit(EVENTS.GAME_STARTED, { gameType });
        io.to(rid).emit(EVENTS.SYSTEM_MSG, sysMsg(`🧩 Bắt đầu Đua Xếp Câu! Ai đạt 5 điểm trước sẽ thắng.`));

        Object.keys(room.players).forEach(id => {
          emitSentenceRoundToPlayer(io, id, room.gameState);
        });
      } else if (gameType === GAME_TYPES.WORD_CHAIN) {
        const starterWord = getRandomStarter();
        const initialHp = {};
        Object.keys(room.players).forEach(id => {
          initialHp[id] = 3;
        });

        room.gameState = {
          hp: initialHp,
          usedWords: [starterWord],
          currentWord: starterWord,
          activePlayerId: socket.id, // Host starts first
          rematchRequests: {},
          lobbyRequests: {}
        };

        io.to(rid).emit(EVENTS.GAME_STARTED, { gameType });
        io.to(rid).emit(EVENTS.SYSTEM_MSG, sysMsg(`🗣️ Bắt đầu Nối Từ Tiếng Anh! Lượt đầu thuộc về ${room.players[socket.id].name}. Chữ cái cần nối: "${starterWord.slice(-1).toUpperCase()}".`));

        startWordChainRound(io, rid);
      }
    });

    // ── CARO: MAKE MOVE ───────────────────────────────────────
    socket.on(EVENTS.MAKE_MOVE, (payload) => {
      const rid = socket.roomId;
      const room = rid && getRoom(rid);
      if (!room || room.status !== 'playing' || room.selectedGame !== GAME_TYPES.CARO) return;

      const v = validateMove(payload);
      if (!v.ok) return;

      const player = room.players[socket.id];
      if (!player || room.gameState.turn !== player.caroRole) return;
      
      const { r, c } = payload;
      if (room.gameState.board[r][c] !== null) return;

      clearTimeout(room.timer);
      room.gameState.board[r][c] = player.caroRole;
      io.to(rid).emit(EVENTS.MOVE_MADE, { r, c, role: player.caroRole });

      const line = getWinningLine(room.gameState.board, r, c, player.caroRole);
      if (line) {
        room.status = 'finished';
        room.gameState.lastWinner = player.caroRole;
        io.to(rid).emit(EVENTS.GAME_OVER, { winner: player.caroRole, reason: 'win', winningLine: line });
        io.to(rid).emit(EVENTS.SYSTEM_MSG, sysMsg(`🏆 ${player.name} thắng!`));
      } else if (checkDraw(room.gameState.board)) {
        room.status = 'finished';
        room.gameState.lastWinner = null;
        io.to(rid).emit(EVENTS.GAME_OVER, { winner: null, reason: 'draw', winningLine: null });
        io.to(rid).emit(EVENTS.SYSTEM_MSG, sysMsg('🤝 Trận hòa! Bàn cờ đầy.'));
      } else {
        room.gameState.turn = player.caroRole === 'X' ? 'O' : 'X';
        io.to(rid).emit(EVENTS.TURN_UPDATE, room.gameState.turn);
        startCaroTimer(io, rid);
      }
    });

    // ── SENTENCE SCRAMBLE: SUBMIT ANSWER ──────────────────────
    socket.on(EVENTS.SENTENCE_SUBMIT_ANSWER, ({ words }) => {
      const rid = socket.roomId;
      const room = rid && getRoom(rid);
      if (!room || room.status !== 'playing' || room.selectedGame !== GAME_TYPES.SENTENCE_SCRAMBLE) return;

      const player = room.players[socket.id];
      const gs = room.gameState;
      if (!player || !gs) return;

      const pState = gs.playersState[socket.id];
      if (!pState) return;

      const currentSentence = gs.matchSentences[pState.sentenceIndex];
      if (!currentSentence) return;

      if (!Array.isArray(words)) return;

      const submittedText = normalizeSentence(words.join(' '));
      const targetText = normalizeSentence(currentSentence.answer);

      if (submittedText === targetText) {
        // Correct answer!
        pState.completed += 1;
        gs.scores[socket.id] = pState.completed;
        
        // Notify both of the score update
        io.to(rid).emit(EVENTS.SENTENCE_SCORE_UPDATE, { scores: gs.scores });

        // Check win condition
        if (pState.completed >= gs.targetScore) {
          room.status = 'finished';
          io.to(rid).emit(EVENTS.SENTENCE_GAME_OVER, { 
            winnerId: socket.id, 
            winnerName: player.name 
          });
          io.to(rid).emit(EVENTS.SYSTEM_MSG, sysMsg(`🏆 ${player.name} đã chiến thắng chung cuộc!`));
        } else {
          pState.sentenceIndex += 1;
          const newSentence = gs.matchSentences[pState.sentenceIndex];
          
          if (newSentence) {
            // Only the player who solved the sentence advances to the next one.
            socket.emit(EVENTS.SENTENCE_SUBMIT_RESULT, { correct: true });
            emitSentenceRoundToPlayer(io, socket.id, gs);
            io.to(rid).emit(EVENTS.SENTENCE_ROUND_WON, {
              playerId: socket.id,
              playerName: player.name,
              score: pState.completed,
              nextRound: pState.sentenceIndex + 1
            });
          }
        }
      } else {
        // Wrong answer
        socket.emit(EVENTS.SENTENCE_SUBMIT_RESULT, { correct: false });
      }
    });

    // ── WORD CHAIN: SUBMIT ANSWER ────────────────────────────
    socket.on(EVENTS.WORD_SUBMIT_ANSWER, async ({ word }) => {
      const rid = socket.roomId;
      const room = rid && getRoom(rid);
      if (!room || room.status !== 'playing' || room.selectedGame !== GAME_TYPES.WORD_CHAIN) return;

      const gs = room.gameState;
      if (!gs || gs.activePlayerId !== socket.id) return; // Only active player can submit

      const rawWord = String(word).trim().toLowerCase();
      const requiredLetter = gs.currentWord.slice(-1).toLowerCase();

      // Rule validation:
      // 1. Must start with requiredLetter
      if (rawWord[0] !== requiredLetter) {
        socket.emit(EVENTS.WORD_VALIDATION_RESULT, { correct: false, reason: `Từ phải bắt đầu bằng chữ "${requiredLetter.toUpperCase()}"!` });
        // Deduct 1 HP for wrong answer
        gs.hp[socket.id] = Math.max(0, gs.hp[socket.id] - 1);
        io.to(rid).emit(EVENTS.WORD_HP_UPDATE, { hp: gs.hp });
        if (gs.hp[socket.id] <= 0) {
          endWordChainGame(io, rid, socket.id);
        }
        return;
      }

      // 2. Must not be already used
      if (gs.usedWords.includes(rawWord)) {
        socket.emit(EVENTS.WORD_VALIDATION_RESULT, { correct: false, reason: `Từ "${rawWord.toUpperCase()}" đã được sử dụng rồi!` });
        gs.hp[socket.id] = Math.max(0, gs.hp[socket.id] - 1);
        io.to(rid).emit(EVENTS.WORD_HP_UPDATE, { hp: gs.hp });
        if (gs.hp[socket.id] <= 0) {
          endWordChainGame(io, rid, socket.id);
        }
        return;
      }

      // 3. Must be a valid dictionary word
      const valid = await isValidWord(rawWord);
      if (!valid) {
        socket.emit(EVENTS.WORD_VALIDATION_RESULT, { correct: false, reason: `Từ "${rawWord.toUpperCase()}" không hợp lệ!` });
        gs.hp[socket.id] = Math.max(0, gs.hp[socket.id] - 1);
        io.to(rid).emit(EVENTS.WORD_HP_UPDATE, { hp: gs.hp });
        if (gs.hp[socket.id] <= 0) {
          endWordChainGame(io, rid, socket.id);
        }
        return;
      }

      // If correct!
      socket.emit(EVENTS.WORD_VALIDATION_RESULT, { correct: true });

      gs.usedWords.push(rawWord);
      gs.currentWord = rawWord;

      // Switch turn
      const playerIds = Object.keys(room.players);
      const nextId = playerIds.find(id => id !== socket.id);
      gs.activePlayerId = nextId;

      startWordChainRound(io, rid);
    });

    // ── REQUEST REMATCH ────────────────────────────────────────
    socket.on(EVENTS.REQUEST_REMATCH, () => {
      const rid = socket.roomId;
      const room = rid && getRoom(rid);
      if (!room || room.status !== 'finished') return;

      if (!room.gameState.rematchRequests) room.gameState.rematchRequests = {};
      room.gameState.rematchRequests[socket.id] = true;
      
      const requesters = Object.keys(room.gameState.rematchRequests);
      const players = Object.keys(room.players);

      if (requesters.length === 1) {
        const requesterName = room.players[socket.id].name;
        socket.to(rid).emit(EVENTS.REMATCH_UPDATE, { msg: `🔥 ${requesterName} muốn chơi tiếp!`, requested: true });
        socket.emit(EVENTS.REMATCH_UPDATE, { msg: 'Đang đợi đối thủ đồng ý...', requested: true });
      } else if (requesters.length >= 2) {
        // Clear rematch and restart CURRENT game type!
        room.status = 'playing';
        room.gameState.rematchRequests = {};

        if (room.selectedGame === GAME_TYPES.CARO) {
          room.gameState.board = emptyBoard();
          room.gameState.turn = room.gameState.lastWinner || 'X';
          
          const xId = players.find(id => room.players[id].caroRole === 'X');
          const oId = players.find(id => room.players[id].caroRole === 'O');

          io.to(xId).emit(EVENTS.REMATCH_START, { turn: room.gameState.turn, board: room.gameState.board });
          io.to(oId).emit(EVENTS.REMATCH_START, { turn: room.gameState.turn, board: room.gameState.board });
          io.to(rid).emit(EVENTS.SYSTEM_MSG, sysMsg(`🎮 Ván mới bắt đầu! Lượt đi đầu tiên: ${room.gameState.turn}`));
          startCaroTimer(io, rid);
        } else if (room.selectedGame === GAME_TYPES.SENTENCE_SCRAMBLE) {
          const matchSentences = getMatchSentences(5);
          room.gameState.targetScore = 5;
          room.gameState.matchSentences = matchSentences;
          room.gameState.scores = createSentenceScores(room.players);
          room.gameState.playersState = createSentencePlayerState(room.players);

          // Re-emit game started to clear modals and reset UI
          io.to(rid).emit(EVENTS.GAME_STARTED, { gameType: GAME_TYPES.SENTENCE_SCRAMBLE });
          io.to(rid).emit(EVENTS.SYSTEM_MSG, sysMsg(`🧩 Đua Xếp Câu ván mới bắt đầu!`));

          Object.keys(room.players).forEach(id => {
            emitSentenceRoundToPlayer(io, id, room.gameState);
          });
        } else if (room.selectedGame === GAME_TYPES.WORD_CHAIN) {
          const starterWord = getRandomStarter();
          const initialHp = {};
          Object.keys(room.players).forEach(id => {
            initialHp[id] = 3;
          });

          room.gameState = {
            hp: initialHp,
            usedWords: [starterWord],
            currentWord: starterWord,
            activePlayerId: socket.id, // Whoever triggers the start goes first
            rematchRequests: {},
            lobbyRequests: {}
          };

          io.to(rid).emit(EVENTS.GAME_STARTED, { gameType: GAME_TYPES.WORD_CHAIN });
          io.to(rid).emit(EVENTS.SYSTEM_MSG, sysMsg(`🗣️ Nối Từ Tiếng Anh ván mới bắt đầu! Lượt đầu thuộc về ${room.players[socket.id].name}. Chữ cái cần nối: "${starterWord.slice(-1).toUpperCase()}".`));

          startWordChainRound(io, rid);
        }
      }
    });

    // ── REQUEST LOBBY (Quay về sảnh chờ) ────────────────────────
    socket.on(EVENTS.REQUEST_LOBBY, () => {
      const rid = socket.roomId;
      const room = rid && getRoom(rid);
      if (!room || room.status !== 'finished') return;

      if (!room.gameState.lobbyRequests) room.gameState.lobbyRequests = {};
      room.gameState.lobbyRequests[socket.id] = true;
      
      const requesters = Object.keys(room.gameState.lobbyRequests);

      if (requesters.length === 1) {
        const requesterName = room.players[socket.id].name;
        socket.to(rid).emit(EVENTS.LOBBY_UPDATE, { msg: `🔄 ${requesterName} muốn về Sảnh chờ!`, requested: true });
        socket.emit(EVENTS.LOBBY_UPDATE, { msg: 'Đang đợi đối thủ đồng ý...', requested: true });
      } else if (requesters.length >= 2) {
        // Go back to lobby
        room.status = 'lobby';
        room.selectedGame = null;
        room.gameState = null;
        
        io.to(rid).emit(EVENTS.ROOM_READY, {
          roomId: rid,
          hostId: Object.keys(room.players).find(id => room.players[id].role === 'host'),
          players: room.players
        });
        io.to(rid).emit(EVENTS.SYSTEM_MSG, sysMsg(`🔄 Cả hai đồng ý quay lại Sảnh chờ.`));
      }
    });

    // ── CHAT ──────────────────────────────────────────────────
    socket.on(EVENTS.CHAT_MSG, (payload) => {
      const rid = socket.roomId;
      const room = rid && getRoom(rid);
      if (!room) return;
      const v = validateChat(payload);
      if (!v.ok) return;
      const player = room.players[socket.id];
      if (!player) return;
      io.to(rid).emit(EVENTS.CHAT_MSG, {
        sender: player.name,
        senderId: socket.id,
        message: String(payload.message).slice(0, 200),
        time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      });
    });

    // ── LEAVE ROOM ────────────────────────────────────────────
    socket.on(EVENTS.LEAVE_ROOM, () => {
      const rid = socket.roomId;
      const room = rid && getRoom(rid);
      if (room) {
        clearTimeout(room.timer);
        socket.to(rid).emit(EVENTS.OPPONENT_DISCONNECTED);
        socket.to(rid).emit(EVENTS.SYSTEM_MSG, sysMsg('🔌 Đối thủ đã rời phòng.'));
        deleteRoom(rid);
      }
      socket.roomId = null;
    });

    // ── CANCEL WAIT ───────────────────────────────────────────
    socket.on(EVENTS.CANCEL_ROOM, () => {
      const rid = socket.roomId;
      const room = rid && getRoom(rid);
      if (room) {
        clearTimeout(room.timer);
        deleteRoom(rid);
      }
      socket.roomId = null;
    });

    // ── DISCONNECT ────────────────────────────────────────────
    socket.on('disconnect', () => {
      const rid = socket.roomId;
      const room = rid && getRoom(rid);
      if (room) {
        clearTimeout(room.timer);
        socket.to(rid).emit(EVENTS.OPPONENT_DISCONNECTED);
        socket.to(rid).emit(EVENTS.SYSTEM_MSG, sysMsg('🔌 Đối thủ mất kết nối.'));
        deleteRoom(rid);
      }
      console.log(`[-] ${socket.id}`);
    });
  });
};
