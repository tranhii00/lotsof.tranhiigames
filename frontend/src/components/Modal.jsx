import styles from './Modal.module.css';

export default function Modal({ 
  emoji, 
  title, 
  msg, 
  type, 
  onClose, 
  onRematch, 
  rematchStatus, 
  onBackToLobby, 
  lobbyStatus 
}) {
  const isWin  = type === 'win';
  const isLose = type === 'lose';

  // If opponent disconnected or this is a system warning, hide rematch/lobby buttons
  const isRematchable = type === 'win' || type === 'lose' || type === 'draw';

  return (
    <div className={styles.overlay}>
      <div className={`${styles.card} ${isWin ? styles.win : isLose ? styles.lose : ''}`}>

        {/* Big animated result emoji */}
        <div className={`${styles.emoji} ${isWin ? styles.bounce : isLose ? styles.shake : ''}`}>
          {emoji}
        </div>

        <h2 className={styles.title}>{title}</h2>
        <p className={styles.msg}>{msg}</p>

        {rematchStatus?.requested && (
          <p className={styles.rematchTip}>{rematchStatus.msg}</p>
        )}
        {lobbyStatus?.requested && (
          <p className={styles.rematchTip}>{lobbyStatus.msg}</p>
        )}

        <div className={styles.actions}>
          {isRematchable && (
            <>
              <button className={`${styles.btn} ${styles.primary}`} onClick={onRematch}>
                🔥 Chơi tiếp (Rematch)
              </button>
              <button className={`${styles.btn} ${styles.lobby}`} onClick={onBackToLobby}>
                🔄 Quay về Sảnh chờ
              </button>
            </>
          )}
          <button className={`${styles.btn} ${styles.secondary}`} onClick={onClose}>
            🏠 Rời phòng về Menu
          </button>
        </div>
      </div>
    </div>
  );
}
