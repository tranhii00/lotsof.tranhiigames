import { useState, useEffect, useCallback } from 'react';
import { socket } from './socket';
import MenuScreen from './components/MenuScreen';
import WaitingScreen from './components/WaitingScreen';
import GameScreen from './components/GameScreen';
import Modal from './components/Modal';
import './index.css';

const BOARD_SIZE = 15;
const mkBoard = () => Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(null));

export default function App() {
  const [screen, setScreen]           = useState('menu');
  const [myName, setMyName]           = useState(() => localStorage.getItem('caroName') || '');
  const [myRole, setMyRole]           = useState(null);
  const [roomId, setRoomId]           = useState('');
  const [opponentName, setOpponentName] = useState('');
  const [board, setBoard]             = useState(mkBoard);
  const [currentTurn, setCurrentTurn] = useState('X');
  const [timerInfo, setTimerInfo]     = useState(null); // {timestamp, duration}
  const [chatMsgs, setChatMsgs]       = useState([]);
  const [modal, setModal]             = useState(null); // {emoji,title,msg}
  const [joinError, setJoinError]     = useState('');

  useEffect(() => { localStorage.setItem('caroName', myName); }, [myName]);

  // ── Socket bootstrap ──────────────────────────────────────────
  useEffect(() => {
    socket.connect();

    socket.on('room_created', ({ roomId: rid, role }) => {
      setRoomId(rid); setMyRole(role); setScreen('waiting');
    });

    socket.on('join_error', (msg) => setJoinError(msg));

    socket.on('match_found', ({ role, opponentName: opp, turn, roomId: rid }) => {
      setMyRole(role); setOpponentName(opp);
      setRoomId(rid); setCurrentTurn(turn);
      setBoard(mkBoard()); setChatMsgs([]);
      setModal(null);
      setScreen('game');
    });

    socket.on('move_made', ({ r, c, role }) => {
      setBoard(prev => {
        const next = prev.map(row => [...row]);
        next[r][c] = role;
        return next;
      });
    });

    socket.on('turn_update', (turn) => setCurrentTurn(turn));

    socket.on('turn_timer', ({ timestamp, duration }) => {
      setTimerInfo({ timestamp, duration });
    });

    socket.on('game_over', ({ winner, reason }) => {
      setTimerInfo(null);
      let emoji, title, msg;
      if (reason === 'timeout') {
        emoji = '⏰'; title = 'Hết giờ!';
        msg = winner === myRole ? 'Đối thủ hết giờ. Bạn THẮNG!' : 'Bạn đã hết giờ suy nghĩ!';
      } else if (!winner) {
        emoji = '🤝'; title = 'Hòa!'; msg = 'Bàn cờ đầy. Trận hòa!';
      } else if (winner === myRole) {
        emoji = '🏆'; title = 'Chiến thắng!'; msg = 'Xuất sắc! Bạn đã thắng!';
      } else {
        emoji = '😔'; title = 'Thất bại'; msg = 'Tiếc quá! Đối thủ thắng lần này.';
      }
      setModal({ emoji, title, msg });
    });

    socket.on('chat_message', (data) => {
      setChatMsgs(prev => [...prev, data]);
    });

    socket.on('opponent_disconnected', () => {
      setTimerInfo(null);
      setModal({ emoji: '🔌', title: 'Đối thủ thoát!', msg: 'Đối thủ đã rời trận.' });
    });

    socket.on('disconnect', () => {
      setModal({ emoji: '📡', title: 'Mất kết nối', msg: 'Đã mất kết nối với server!' });
    });

    return () => { socket.off(); socket.disconnect(); };
  }, []); // eslint-disable-line

  // ── Actions ───────────────────────────────────────────────────
  const handleCreateRoom = useCallback((name) => {
    setMyName(name); setJoinError('');
    socket.emit('create_room', { playerName: name });
  }, []);

  const handleJoinRoom = useCallback((name, rid) => {
    setMyName(name); setJoinError('');
    socket.emit('join_room', { playerName: name, roomId: rid });
  }, []);

  const handleCancelWait = useCallback(() => {
    socket.disconnect(); socket.connect();
    setScreen('menu');
  }, []);

  const handleMakeMove = useCallback((r, c) => {
    socket.emit('make_move', { r, c });
  }, []);

  const handleSendChat = useCallback((message) => {
    socket.emit('chat_message', { message });
  }, []);

  const handleLeave = useCallback(() => {
    socket.disconnect(); socket.connect();
    setScreen('menu'); setModal(null);
    setBoard(mkBoard());
  }, []);

  // ── Render ────────────────────────────────────────────────────
  return (
    <>
      {screen === 'menu' && (
        <MenuScreen
          myName={myName}
          onCreateRoom={handleCreateRoom}
          onJoinRoom={handleJoinRoom}
          joinError={joinError}
        />
      )}
      {screen === 'waiting' && (
        <WaitingScreen
          myName={myName}
          roomId={roomId}
          onCancel={handleCancelWait}
        />
      )}
      {screen === 'game' && (
        <GameScreen
          myRole={myRole}
          myName={myName}
          opponentName={opponentName}
          board={board}
          currentTurn={currentTurn}
          timerInfo={timerInfo}
          chatMsgs={chatMsgs}
          onMove={handleMakeMove}
          onChat={handleSendChat}
          onLeave={handleLeave}
        />
      )}
      {modal && (
        <Modal {...modal} onClose={handleLeave} />
      )}
    </>
  );
}
