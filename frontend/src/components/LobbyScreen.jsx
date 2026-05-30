import styles from './LobbyScreen.module.css';
import { GAME_TYPES } from '../constants';

export default function LobbyScreen({ roomId, lobbyInfo, myRole, onSelectGame, onLeave }) {
  const isHost = myRole === 'host';
  const players = Object.values(lobbyInfo.players);
  const me = players.find(p => p.role === myRole) || {};
  const opp = players.find(p => p.role !== myRole);

  return (
    <div className={styles.page}>
      <div className={styles.lobby}>
        <div className={styles.header}>
        <h2>Phòng chờ: {roomId}</h2>
        <button onClick={onLeave} className={styles.leaveBtn}>Thoát</button>
      </div>

      <div className={styles.players}>
        <div className={styles.playerCard}>
          <div className={styles.avatar}>🧑‍💻</div>
          <div className={styles.name}>{me.name} (Bạn)</div>
          {isHost && <div className={styles.role}>Chủ phòng</div>}
        </div>
        <div className={styles.vs}>VS</div>
        <div className={styles.playerCard}>
          <div className={styles.avatar}>👤</div>
          <div className={styles.name}>{opp?.name || 'Đang tải...'}</div>
          {!isHost && <div className={styles.role}>Chủ phòng</div>}
        </div>
      </div>

      <div className={styles.gameSelection}>
        <h3>Chọn Game để bắt đầu</h3>
        {isHost ? (
          <div className={styles.gameList}>
            <div className={styles.gameCard} onClick={() => onSelectGame(GAME_TYPES.CARO)}>
              <div className={styles.gameIcon}>❌⭕</div>
              <div className={styles.gameName}>Cờ Caro</div>
              <p>Trí tuệ, truyền thống.</p>
            </div>
            <div className={styles.gameCard} onClick={() => onSelectGame(GAME_TYPES.SENTENCE_SCRAMBLE)}>
              <div className={styles.gameIcon}>🧩🔤</div>
              <div className={styles.gameName}>Đua Xếp Câu</div>
              <p>Sắp xếp câu đúng thứ tự.</p>
            </div>
            <div className={styles.gameCard} onClick={() => onSelectGame(GAME_TYPES.WORD_CHAIN)}>
              <div className={styles.gameIcon}>🗣️🔗</div>
              <div className={styles.gameName}>Nối Từ Tiếng Anh</div>
              <p>Phản xạ nhanh, vốn từ rộng.</p>
            </div>
          </div>
        ) : (
          <div className={styles.waitingHost}>
            <div className={styles.spinner}></div>
            <p>Đang chờ chủ phòng chọn game...</p>
          </div>
        )}
      </div>
      </div>
    </div>
  );
}
