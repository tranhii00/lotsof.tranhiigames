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
            <div className={styles.avatar} style={{ backgroundColor: me.avatar?.color || '#FF7A00' }}>
              {me.avatar?.emoji || '🦊'}
            </div>
            <div className={styles.name}>{me.name} (Bạn)</div>
            <div className={styles.role}>{me.role === 'host' ? 'Chủ phòng' : 'Khách'}</div>
          </div>
          <div className={styles.vs}>VS</div>
          <div className={styles.playerCard}>
            <div className={styles.avatar} style={{ backgroundColor: opp?.avatar?.color || '#4E5D6C' }}>
              {opp ? (opp.avatar?.emoji || '🐼') : '👤'}
            </div>
            <div className={styles.name}>{opp?.name || 'Đang chờ...'}</div>
            {opp && (
              <div className={styles.role}>{opp.role === 'host' ? 'Chủ phòng' : 'Khách'}</div>
            )}
          </div>
        </div>

        <div className={styles.gameSelection}>
          <h3>Chọn Game để bắt đầu 🎮</h3>
          <div className={styles.gameList}>
            <div 
              className={styles.gameCard} 
              onClick={() => onSelectGame(GAME_TYPES.CARO)}
            >
              <div className={styles.gameIcon}>❌⭕</div>
              <div className={styles.gameName}>Cờ Caro</div>
            </div>
            <div 
              className={styles.gameCard} 
              onClick={() => onSelectGame(GAME_TYPES.SENTENCE_SCRAMBLE)}
            >
              <div className={styles.gameIcon}>🧩🔤</div>
              <div className={styles.gameName}>Đua Xếp Câu</div>
            </div>
            <div 
              className={styles.gameCard} 
              onClick={() => onSelectGame(GAME_TYPES.WORD_CHAIN)}
            >
              <div className={styles.gameIcon}>🗣️🔗</div>
              <div className={styles.gameName}>Nối Từ Tiếng Anh</div>
            </div>
            <div 
              className={styles.gameCard} 
              onClick={() => onSelectGame(GAME_TYPES.ENGLISH_WORD_BUILDER)}
            >
              <div className={styles.gameIcon}>🔤🛠️</div>
              <div className={styles.gameName}>Tạo Từ Tiếng Anh</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
