import { useState, useEffect } from 'react';
import styles from './MenuScreen.module.css';

const AVATARS = [
  { id: 'fox', emoji: '🦊', color: '#FF7A00' },
  { id: 'panda', emoji: '🐼', color: '#4E5D6C' },
  { id: 'unicorn', emoji: '🦄', color: '#E040FB' },
  { id: 'frog', emoji: '🐸', color: '#4CAF50' },
  { id: 'lion', emoji: '🦁', color: '#FFB800' },
  { id: 'octopus', emoji: '🐙', color: '#FF5252' },
  { id: 'dino', emoji: '🦖', color: '#8BC34A' },
  { id: 'penguin', emoji: '🐧', color: '#00BCD4' }
];

export default function MenuScreen({ myName, onCreateRoom, onJoinRoom, joinError }) {
  const [name, setName]     = useState(myName || '');
  const [joinId, setJoinId] = useState('');
  const [tab, setTab]       = useState('create');
  const [selectedAvatar, setSelectedAvatar] = useState(AVATARS[0]);

  // Auto-fill room ID from URL ?room=XXXXXX
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const roomParam = params.get('room');
    if (roomParam && /^[A-Z0-9]{6}$/i.test(roomParam)) {
      setJoinId(roomParam.toUpperCase());
      setTab('join');
    }
  }, []);

  const nameOk = name.trim().length > 0;
  const canJoin = nameOk && joinId.length === 6;

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.logo}>
          <span className={styles.x}>✕</span>
          <span className={styles.logoTitle}>MINI ONLINE GAMES</span>
          <span className={styles.o}>○</span>
        </div>
        <p className={styles.sub} style={{ fontSize: '0.8rem', opacity: 0.85, letterSpacing: '0.5px' }}>
          WEB NÀY ĐƯỢC TẠO RA BẰNG MỘT CÁCH KHÔNG THỂ NGỜ TỚI
        </p>

        <div className={styles.field}>
          <label>Tên của bạn</label>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Nhập tên..."
            maxLength={20}
            autoFocus
          />
        </div>

        <div className={styles.avatarSection}>
          <label className={styles.avatarLabel}>Chọn Avatar của bạn</label>
          <div className={styles.avatarGrid}>
            {AVATARS.map((av) => (
              <button
                key={av.id}
                type="button"
                className={`${styles.avatarBtn} ${selectedAvatar.id === av.id ? styles.avatarBtnActive : ''}`}
                style={{ '--avatar-bg': av.color }}
                onClick={() => setSelectedAvatar(av)}
              >
                <span className={styles.avatarEmoji}>{av.emoji}</span>
              </button>
            ))}
          </div>
        </div>

        <div className={styles.tabs}>
          <button className={tab === 'create' ? styles.tabActive : styles.tab} onClick={() => setTab('create')}>🏠 Tạo phòng</button>
          <button className={tab === 'join'   ? styles.tabActive : styles.tab} onClick={() => setTab('join')}>🔗 Vào phòng</button>
        </div>

        {tab === 'create' && (
          <div className={styles.section}>
            <p className={styles.hint}>Tạo phòng mới và chia sẻ Room ID cho bạn bè.</p>
            <button className={styles.btnPrimary} disabled={!nameOk} onClick={() => onCreateRoom(name.trim(), selectedAvatar)}>
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
                style={{ letterSpacing: '5px', fontSize: '22px', textAlign: 'center', textTransform: 'uppercase' }}
                onKeyDown={e => e.key === 'Enter' && canJoin && onJoinRoom(name.trim(), joinId, selectedAvatar)}
              />
            </div>
            {joinError && <p className={styles.error}>⚠️ {joinError}</p>}
            <button className={styles.btnPrimary} disabled={!canJoin} onClick={() => onJoinRoom(name.trim(), joinId, selectedAvatar)}>
              Vào phòng →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
