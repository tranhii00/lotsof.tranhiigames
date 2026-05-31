import { useState, useEffect, useCallback, useRef } from 'react';
import { socket } from '../socket';
import { EVENTS, GAME_TYPES, BOARD_SIZE } from '../constants';
import { sfx } from '../utils/sfx';

const mkBoard = () => Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(null));

export function useGameSocket() {
  const [connStatus, setConnStatus] = useState('connecting');
  const [screen, setScreen]         = useState('menu'); // menu, waiting, lobby, caro, sentence_scramble
  const [myName, setMyName]         = useState(() => localStorage.getItem('caroName') || '');
  const [myRole, setMyRole]         = useState(null);
  const [roomId, setRoomId]         = useState('');
  const [opponentName, setOpponentName] = useState('');
  const [lobbyInfo, setLobbyInfo]   = useState(null); // { hostId, players }

  // Caro state
  const [board, setBoard]           = useState(mkBoard);
  const [currentTurn, setCurrentTurn] = useState('X');
  const [timerInfo, setTimerInfo]   = useState(null);
  const [lastMove, setLastMove]     = useState(null);
  const [winningLine, setWinningLine] = useState(null);

  // Sentence Scramble state
  const [ssState, setSsState] = useState({ round: 1, words: [], scores: {}, submitResult: null, lastWinner: null, lastAnswer: null });

  // Word Chain state
  const [wcState, setWcState] = useState({ activePlayerId: '', currentWord: '', requiredLetter: '', hp: {}, wordList: [], submitResult: null });

  // Shared state
  const [chatMsgs, setChatMsgs]     = useState([]);
  const [modal, setModal]           = useState(null);
  const [joinError, setJoinError]   = useState('');
  const [rematchStatus, setRematchStatus] = useState(null); // { requested: boolean, msg: string }
  const [lobbyStatus, setLobbyStatus] = useState(null); // { requested: boolean, msg: string }

  // Valorant matchmaking / ready countdown states
  const [showMatchFound, setShowMatchFound] = useState(false);
  const [rulesGameType, setRulesGameType]   = useState(null);
  const [readyStatus, setReadyStatus]       = useState({});
  const [countdownNumber, setCountdownNumber] = useState(null); // 3, 2, 1, 'START!'
  const [showCountdown, setShowCountdown]   = useState(false);

  const myRoleRef = useRef(null);
  myRoleRef.current = myRole;
  const mySocketIdRef = useRef(null);
  const lobbyInfoRef = useRef(null);
  lobbyInfoRef.current = lobbyInfo;

  useEffect(() => { localStorage.setItem('caroName', myName); }, [myName]);

  const resetGame = useCallback(() => {
    setBoard(mkBoard());
    setLastMove(null);
    setWinningLine(null);
    setCurrentTurn('X');
    setTimerInfo(null);
    setChatMsgs([]);
    setModal(null);
    setMyRole(null);
    setRoomId('');
    setOpponentName('');
    setLobbyInfo(null);
    setRematchStatus(null);
    setLobbyStatus(null);
    setSsState({ round: 1, words: [], scores: {}, submitResult: null, lastWinner: null, lastAnswer: null });
    setWcState({ activePlayerId: '', currentWord: '', requiredLetter: '', hp: {}, wordList: [], submitResult: null });
    setShowMatchFound(false);
    setRulesGameType(null);
    setReadyStatus({});
    setCountdownNumber(null);
    setShowCountdown(false);
  }, []);

  useEffect(() => {
    socket.connect();
    mySocketIdRef.current = socket.id;

    socket.on('connect', () => {
      setConnStatus('connected');
      mySocketIdRef.current = socket.id;
    });
    socket.on('disconnect', () => {
      setConnStatus('disconnected');
      setTimerInfo(null);
    });
    socket.on('reconnect_attempt', () => setConnStatus('reconnecting'));
    socket.on('reconnect', () => setConnStatus('connected'));

    socket.on(EVENTS.ROOM_CREATED, ({ roomId: rid }) => {
      setRoomId(rid);
      setScreen('waiting');
    });

    socket.on(EVENTS.JOIN_ERROR, (msg) => setJoinError(msg));

    socket.on(EVENTS.ROOM_READY, ({ roomId: rid, hostId, players }) => {
      setRoomId(rid);
      setLobbyInfo({ hostId, players });
      const myData = players[mySocketIdRef.current];
      if (myData) {
        setMyRole(myData.role);
        const oppId = Object.keys(players).find(id => id !== mySocketIdRef.current);
        if (oppId) setOpponentName(players[oppId].name);
      }
      setChatMsgs([]);
      setModal(null);
      setRematchStatus(null);
      setLobbyStatus(null);
      
      // Play Match Found sound effect and show overlay
      sfx.playMatchFound();
      setShowMatchFound(true);
      setTimeout(() => {
        setShowMatchFound(false);
      }, 2500);

      setScreen('lobby');
    });

    socket.on(EVENTS.GAME_SELECTED, ({ gameType, readyStatus: rs }) => {
      setRulesGameType(gameType);
      setReadyStatus(rs || {});
      setScreen('rules_ready');
    });

    socket.on(EVENTS.READY_UPDATE, ({ readyStatus: rs }) => {
      setReadyStatus(rs || {});
    });

    socket.on(EVENTS.START_COUNTDOWN, ({ gameType }) => {
      setRulesGameType(null);
      setReadyStatus({});
      
      // Start client countdown sequence (3, 2, 1, GO!)
      setShowCountdown(true);
      setCountdownNumber(3);
      sfx.playCountdownBeep(false);

      setTimeout(() => {
        setCountdownNumber(2);
        sfx.playCountdownBeep(false);
      }, 1000);

      setTimeout(() => {
        setCountdownNumber(1);
        sfx.playCountdownBeep(false);
      }, 2000);

      setTimeout(() => {
        setCountdownNumber('START!');
        sfx.playCountdownBeep(true);
      }, 3000);

      setTimeout(() => {
        setShowCountdown(false);
        setCountdownNumber(null);
      }, 3800);
    });

    socket.on(EVENTS.GAME_STARTED, (payload) => {
      setChatMsgs([]);
      setModal(null);
      setRematchStatus(null);
      setLobbyStatus(null);
      setRulesGameType(null);
      setReadyStatus({});
      
      if (payload.gameType === GAME_TYPES.CARO) {
        setMyRole(lobbyInfoRef.current?.hostId === mySocketIdRef.current ? 'X' : 'O');
        setCurrentTurn(payload.turn);
        setBoard(mkBoard());
        setLastMove(null);
        setWinningLine(null);
        setScreen('caro');
      } else if (payload.gameType === GAME_TYPES.SENTENCE_SCRAMBLE) {
        setSsState({ round: 1, words: [], scores: {}, submitResult: null, lastWinner: null, lastAnswer: null });
        setScreen('sentence_scramble');
      } else if (payload.gameType === GAME_TYPES.WORD_CHAIN) {
        setWcState({ activePlayerId: '', currentWord: '', requiredLetter: '', hp: {}, wordList: [], submitResult: null });
        setScreen('word_chain');
      }
    });

    // CARO EVENTS
    socket.on(EVENTS.MOVE_MADE, ({ r, c, role }) => {
      setLastMove({ r, c });
      setBoard(prev => {
        const next = prev.map(row => [...row]);
        next[r][c] = role;
        return next;
      });
      sfx.playMove(role === 'X');
    });

    socket.on(EVENTS.TURN_UPDATE, (turn) => setCurrentTurn(turn));

    socket.on(EVENTS.TURN_TIMER, ({ timestamp, duration }) => {
      setTimerInfo({ timestamp, duration });
    });

    socket.on(EVENTS.GAME_OVER, ({ winner, reason, winningLine: wl }) => {
      setTimerInfo(null);
      if (wl) setWinningLine(wl);

      const role = myRoleRef.current;
      if (reason === 'timeout') sfx.playBuzzer();
      else if (winner === role) sfx.playWin();
      else if (winner) sfx.playLose();

      setTimeout(() => {
        let emoji, title, msg, type;
        if (reason === 'draw') {
          emoji = '🤝'; title = 'Hòa!'; msg = 'Trận hòa!'; type = 'draw';
        } else if (reason === 'timeout') {
          if (winner === role) { emoji = '⏰'; title = 'Thắng!'; msg = 'Đối thủ hết giờ. Bạn thắng!'; type = 'win'; }
          else                 { emoji = '⌛'; title = 'Hết giờ!'; msg = 'Bạn đã hết giờ suy nghĩ!'; type = 'lose'; }
        } else if (winner === role) {
          emoji = '🏆'; title = 'Chiến thắng!'; msg = 'Bạn đã thắng trận này!'; type = 'win';
        } else {
          emoji = '😔'; title = 'Thất bại'; msg = 'Đối thủ thắng ván này.'; type = 'lose';
        }
        setModal({ emoji, title, msg, type });
      }, 2000);
    });

    // SENTENCE SCRAMBLE EVENTS
    socket.on(EVENTS.SENTENCE_ROUND_STARTED, ({ round, words }) => {
      setSsState(prev => ({ ...prev, round, words, submitResult: null, lastWinner: null, lastAnswer: null }));
    });
    
    socket.on(EVENTS.SENTENCE_SCORE_UPDATE, ({ scores }) => {
      setSsState(prev => ({ ...prev, scores }));
    });
    
    socket.on(EVENTS.SENTENCE_SUBMIT_RESULT, ({ correct, round, words }) => {
      setSsState(prev => {
        const nextState = { ...prev, submitResult: correct };
        if (correct && words) {
          nextState.round = round;
          nextState.words = words;
        }
        return nextState;
      });
      if (correct) sfx.playWin();
      else sfx.playBuzzer();
    });
    
    socket.on(EVENTS.SENTENCE_GAME_OVER, ({ winnerId, winnerName }) => {
      const isWin = winnerId === mySocketIdRef.current;
      const isDraw = winnerId === null;

      if (isWin) sfx.playWin();
      else if (!isDraw) sfx.playLose();

      setModal({ 
        emoji: isWin ? '🏆' : isDraw ? '🤝' : '😔', 
        title: isWin ? 'Chiến thắng!' : isDraw ? 'Hòa!' : 'Thất bại', 
        msg: isWin ? 'Chúc mừng! Bạn đã thắng cuộc!' : isDraw ? 'Trận đấu hòa!' : `Rất tiếc! ${winnerName} đã thắng cuộc.`,
        type: isWin ? 'win' : isDraw ? 'draw' : 'lose'
      });
    });

    // WORD CHAIN EVENTS
    socket.on(EVENTS.WORD_ROUND_STARTED, ({ activePlayerId, currentWord, requiredLetter, hp, wordList }) => {
      setWcState(prev => ({
        ...prev,
        activePlayerId,
        currentWord,
        requiredLetter,
        hp,
        wordList,
        submitResult: null
      }));
    });

    socket.on(EVENTS.WORD_HP_UPDATE, ({ hp }) => {
      setWcState(prev => ({ ...prev, hp }));
    });

    socket.on(EVENTS.WORD_VALIDATION_RESULT, ({ correct, reason }) => {
      setWcState(prev => ({ ...prev, submitResult: { correct, reason } }));
      if (correct) sfx.playWin();
      else sfx.playBuzzer();
    });

    socket.on(EVENTS.WORD_GAME_OVER, ({ winnerId, winnerName }) => {
      const isWin = winnerId === mySocketIdRef.current;
      const isDraw = winnerId === null;

      if (isWin) sfx.playWin();
      else if (!isDraw) sfx.playLose();

      setModal({ 
        emoji: isWin ? '🏆' : isDraw ? '🤝' : '😔', 
        title: isWin ? 'Chiến thắng!' : isDraw ? 'Hòa!' : 'Thất bại', 
        msg: isWin ? 'Chúc mừng! Bạn đã thắng cuộc!' : isDraw ? 'Trận đấu hòa!' : `Rất tiếc! ${winnerName} đã thắng cuộc.`,
        type: isWin ? 'win' : isDraw ? 'draw' : 'lose'
      });
    });

    // SHARED EVENTS
    socket.on(EVENTS.REMATCH_UPDATE, ({ msg, requested }) => {
      setRematchStatus({ requested, msg });
    });

    socket.on(EVENTS.LOBBY_UPDATE, ({ msg, requested }) => {
      setLobbyStatus({ requested, msg });
    });

    socket.on(EVENTS.REMATCH_START, ({ turn, board: newBoard }) => {
      setBoard(newBoard);
      setLastMove(null);
      setWinningLine(null);
      setCurrentTurn(turn);
      setRematchStatus(null);
      setLobbyStatus(null);
      setModal(null);
    });

    socket.on(EVENTS.CHAT_MSG, (data) => {
      const isMine = data.senderId === mySocketIdRef.current;
      setChatMsgs(prev => [...prev, { ...data, isMine }]);
      if (!isMine) sfx.playChat();
    });

    socket.on(EVENTS.SYSTEM_MSG, (data) => {
      setChatMsgs(prev => [...prev, { ...data, system: true }]);
    });

    socket.on(EVENTS.OPPONENT_DISCONNECTED, () => {
      setTimerInfo(null);
      setModal({ emoji: '🔌', title: 'Đối thủ thoát!', msg: 'Đối thủ đã rời trận.', type: 'info' });
    });

    return () => { socket.off(); socket.disconnect(); };
  }, []); // Remove dependency array to avoid reconnection

  // ── Actions ───────────────────────────────────────────────────
  const saveName = useCallback((n) => {
    const name = n.trim() || 'Người chơi';
    setMyName(name);
    return name;
  }, []);

  const createRoom = useCallback((name) => {
    const n = saveName(name);
    setJoinError('');
    socket.emit(EVENTS.CREATE_ROOM, { playerName: n });
  }, [saveName]);

  const joinRoom = useCallback((name, rid) => {
    const n = saveName(name);
    setJoinError('');
    socket.emit(EVENTS.JOIN_ROOM, { playerName: n, roomId: rid });
  }, [saveName]);

  const selectGame = useCallback((gameType) => {
    socket.emit(EVENTS.SELECT_GAME, { gameType });
  }, []);

  const submitSentence = useCallback((words) => {
    socket.emit(EVENTS.SENTENCE_SUBMIT_ANSWER, { words });
  }, []);

  const submitWord = useCallback((word) => {
    socket.emit(EVENTS.WORD_SUBMIT_ANSWER, { word });
  }, []);

  const cancelWait = useCallback(() => {
    socket.emit(EVENTS.CANCEL_ROOM);
    setScreen('menu');
    setRoomId('');
  }, []);

  const makeMove = useCallback((r, c) => {
    socket.emit(EVENTS.MAKE_MOVE, { r, c });
  }, []);

  const sendChat = useCallback((message) => {
    socket.emit(EVENTS.CHAT_MSG, { message });
  }, []);

  const requestRematch = useCallback(() => {
    socket.emit(EVENTS.REQUEST_REMATCH);
  }, []);

  const requestLobby = useCallback(() => {
    socket.emit(EVENTS.REQUEST_LOBBY);
  }, []);

  const playerReady = useCallback(() => {
    socket.emit(EVENTS.PLAYER_READY);
  }, []);

  const leaveRoom = useCallback(() => {
    socket.emit(EVENTS.LEAVE_ROOM);
    resetGame();
    setScreen('menu');
  }, [resetGame]);

  const closeModal = useCallback(() => {
    setModal(null);
    if (screen === 'lobby' || screen === 'rules_ready') {
      // Just hide modal
    } else {
      setScreen('menu');
      resetGame();
    }
  }, [screen, resetGame]);

  return {
    connStatus, screen, myName, setMyName,
    myRole, roomId, opponentName, lobbyInfo, socketId: mySocketIdRef.current,
    board, currentTurn, timerInfo,
    ssState, wcState,
    chatMsgs, modal, joinError,
    lastMove, winningLine, rematchStatus, lobbyStatus,
    showMatchFound, rulesGameType, readyStatus, countdownNumber, showCountdown,
    actions: { createRoom, joinRoom, selectGame, submitSentence, submitWord, cancelWait, makeMove, sendChat, requestRematch, requestLobby, leaveRoom, closeModal, playerReady },
  };
}
