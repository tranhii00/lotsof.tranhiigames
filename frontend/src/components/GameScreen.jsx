import { useState } from 'react';
import Board from './Board';
import Timer from './Timer';
import ChatPanel from './ChatPanel';
import styles from './GameScreen.module.css';

export default function GameScreen({
  myRole, myName, opponentName, lobbyInfo,
  board, currentTurn, timerInfo, turnDuration,
  chatMsgs, lastMove, winningLine,
  onMove, onChat, onLeave,
}) {
  const [chatOpen, setChatOpen] = useState(true);
  const xName = myRole === 'X' ? myName : opponentName;
  const oName = myRole === 'O' ? myName : opponentName;
  const isMyTurn = currentTurn === myRole;
  const gameOver = Boolean(winningLine);

  const players = lobbyInfo ? Object.values(lobbyInfo.players) : [];
  const hostPlayer = players.find(p => p.role === 'host') || {};
  const guestPlayer = players.find(p => p.role === 'guest') || {};

  return (
    <div className={styles.layout}>

      {/* ── TOP BAR (status + timer + player info) ── */}
      <div className={styles.topBar}>
        <div className={`${styles.playerChip} ${currentTurn === 'X' ? styles.activeX : ''}`}>
          <div className={styles.avatarMini} style={{ backgroundColor: hostPlayer.avatar?.color || '#FF7A00' }}>
            {hostPlayer.avatar?.emoji || '🦊'}
          </div>
          <span className={styles.symX}>✕</span>
          <span>{xName}{myRole === 'X' ? ' (bạn)' : ''}</span>
        </div>

        <div className={styles.center}>
          <div className={`${styles.statusBadge} ${isMyTurn ? styles.yourTurn : ''}`}>
            {isMyTurn ? '⚡ Lượt của bạn!' : `⏳ ${currentTurn === 'X' ? xName : oName}...`}
          </div>
          <Timer timerInfo={timerInfo} turnDuration={turnDuration} />
        </div>

        <div className={`${styles.playerChip} ${currentTurn === 'O' ? styles.activeO : ''}`}>
          <span>{oName}{myRole === 'O' ? ' (bạn)' : ''}</span>
          <span className={styles.symO}>○</span>
          <div className={styles.avatarMini} style={{ backgroundColor: guestPlayer.avatar?.color || '#4E5D6C' }}>
            {guestPlayer.avatar?.emoji || '🐼'}
          </div>
        </div>
      </div>

      {/* ── BOARD ── */}
      <div className={styles.boardWrapper}>
        <Board
          board={board}
          myRole={myRole}
          currentTurn={currentTurn}
          onMove={onMove}
          lastMove={lastMove}
          winningLine={winningLine}
          gameOver={gameOver}
        />
      </div>

      {/* ── BOTTOM: Chat collapsible + leave ── */}
      <div className={styles.bottom}>
        <div className={styles.bottomHeader}>
          <button className={styles.chatToggle} onClick={() => setChatOpen(o => !o)}>
            💬 Chat {chatOpen ? '▲' : '▼'}
          </button>
          <button className={styles.leaveBtn} onClick={onLeave}>🚪 Thoát</button>
        </div>
        {chatOpen && (
          <ChatPanel messages={chatMsgs} onSend={onChat} myName={myName} />
        )}
      </div>
    </div>
  );
}
