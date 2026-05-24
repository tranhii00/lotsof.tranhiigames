import Board from './Board';
import Timer from './Timer';
import ChatPanel from './ChatPanel';
import styles from './GameScreen.module.css';

export default function GameScreen({
  myRole, myName, opponentName,
  board, currentTurn, timerInfo,
  chatMsgs, onMove, onChat, onLeave
}) {
  const xName = myRole === 'X' ? myName : opponentName;
  const oName = myRole === 'O' ? myName : opponentName;
  const isMyTurn = currentTurn === myRole;

  return (
    <div className={styles.layout}>
      {/* LEFT */}
      <div className={styles.left}>
        <div className={`${styles.playerCard} ${currentTurn === 'X' ? styles.active : ''}`}>
          <span className={styles.symbolX}>✕</span>
          <div>
            <div className={styles.playerLabel}>Người chơi X</div>
            <div className={styles.playerName}>{xName}{myRole==='X'?' (bạn)':''}</div>
          </div>
        </div>

        <Timer timerInfo={timerInfo} duration={30} />

        <div className={`${styles.playerCard} ${currentTurn === 'O' ? styles.active : ''}`}>
          <span className={styles.symbolO}>○</span>
          <div>
            <div className={styles.playerLabel}>Người chơi O</div>
            <div className={styles.playerName}>{oName}{myRole==='O'?' (bạn)':''}</div>
          </div>
        </div>

        <div className={styles.myTag}>
          Bạn là: <strong className={myRole === 'X' ? styles.tagX : styles.tagO}>
            {myRole === 'X' ? '✕ X' : '○ O'}
          </strong>
        </div>

        <button className={styles.leaveBtn} onClick={onLeave}>🚪 Thoát</button>
      </div>

      {/* CENTER */}
      <div className={styles.center}>
        <div className={`${styles.status} ${isMyTurn ? styles.statusYou : ''}`}>
          {isMyTurn ? '⚡ Lượt của bạn!' : `⏳ Chờ ${currentTurn === 'X' ? xName : oName}...`}
        </div>
        <Board board={board} myRole={myRole} currentTurn={currentTurn} onMove={onMove} />
      </div>

      {/* RIGHT */}
      <div className={styles.right}>
        <ChatPanel messages={chatMsgs} onSend={onChat} myName={myName} />
      </div>
    </div>
  );
}
