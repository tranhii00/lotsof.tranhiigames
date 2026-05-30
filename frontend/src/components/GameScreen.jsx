import { useState } from 'react';
import Board from './Board';
import Timer from './Timer';
import ChatPanel from './ChatPanel';
import styles from './GameScreen.module.css';

export default function GameScreen({
  myRole, myName, opponentName,
  board, currentTurn, timerInfo, turnDuration,
  chatMsgs, lastMove, winningLine,
  onMove, onChat, onLeave,
}) {
  const [chatOpen, setChatOpen] = useState(true);
  const xName = myRole === 'X' ? myName : opponentName;
  const oName = myRole === 'O' ? myName : opponentName;
  const isMyTurn = currentTurn === myRole;
  const gameOver = Boolean(winningLine);

  return (
    <div className={styles.layout}>

      {/* ── TOP BAR (status + timer + player info) ── */}
      <div className={styles.topBar}>
        <div className={`${styles.playerChip} ${currentTurn === 'X' ? styles.activeX : ''}`}>
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
