import { useState } from 'react';
import styles from './MenuScreen.module.css';

export default function MenuScreen({ myName, onCreateRoom, onJoinRoom, joinError }) {
  const [name, setName]     = useState(myName || '');
  const [joinId, setJoinId] = useState('');
  const [tab, setTab]       = useState('create'); // 'create' | 'join'

  const nameOk = name.trim().length > 0;

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.logo}>
          <span className={styles.logoX}>✕</span>
          <span className={styles.logoTitle}>Cờ Caro</span>
          <span className={styles.logoO}>○</span>
        </div>
        <p className={styles.sub}>Multiplayer · Thời gian thực</p>

        <div className={styles.field}>
          <label>Tên của bạn</label>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Nhập tên..."
            maxLength={20}
            onKeyDown={e => e.key === 'Enter' && nameOk && onCreateRoom(name.trim())}
          />
        </div>

        <div className={styles.tabs}>
          <button
            className={tab === 'create' ? styles.tabActive : styles.tab}
            onClick={() => setTab('create')}
          >🏠 Tạo phòng</button>
          <button
            className={tab === 'join' ? styles.tabActive : styles.tab}
            onClick={() => setTab('join')}
          >🔗 Vào phòng</button>
        </div>

        {tab === 'create' && (
          <div className={styles.section}>
            <p className={styles.hint}>Tạo phòng mới và chia sẻ Room ID cho bạn bè.</p>
            <button
              className={styles.btnPrimary}
              disabled={!nameOk}
              onClick={() => onCreateRoom(name.trim())}
            >
              Tạo phòng ngay ✨
            </button>
          </div>
        )}

        {tab === 'join' && (
          <div className={styles.section}>
            <div className={styles.field}>
              <label>Room ID (6 ký tự)</label>
              <input
                value={joinId}
                onChange={e => setJoinId(e.target.value.toUpperCase())}
                placeholder="VD: AB3C7X"
                maxLength={6}
                style={{ textTransform: 'uppercase', letterSpacing: '4px', fontSize: '20px', textAlign: 'center' }}
                onKeyDown={e => e.key === 'Enter' && nameOk && joinId.length === 6 && onJoinRoom(name.trim(), joinId)}
              />
            </div>
            {joinError && <p className={styles.error}>⚠️ {joinError}</p>}
            <button
              className={styles.btnPrimary}
              disabled={!nameOk || joinId.length !== 6}
              onClick={() => onJoinRoom(name.trim(), joinId)}
            >
              Vào phòng →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
