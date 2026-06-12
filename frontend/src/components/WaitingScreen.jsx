import { useState } from 'react';
import styles from './WaitingScreen.module.css';

export default function WaitingScreen({ myName, myAvatar, roomId, onCancel }) {
  const [copied, setCopied] = useState(false);

  // Generate shareable link with ?room=ROOMID
  const shareUrl = `${window.location.origin}${window.location.pathname}?room=${roomId}`;

  const copyLink = () => {
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  const copyId = () => {
    navigator.clipboard.writeText(roomId).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.ring} />
        <h2>Đang chờ đối thủ...</h2>
        <div className={styles.playerAvatar} style={{ backgroundColor: myAvatar?.color || '#FF7A00' }}>
          <span className={styles.playerEmoji}>{myAvatar?.emoji || '🦊'}</span>
        </div>
        <p className={styles.name}>{myName}</p>

        <div className={styles.roomBox}>
          <span className={styles.roomLabel}>Room ID của bạn</span>
          <div className={styles.roomId}>{roomId}</div>
          <div className={styles.btnRow}>
            <button className={styles.copyBtn} onClick={copyId}>
              {copied ? '✓' : '📋'} Room ID
            </button>
            <button className={styles.copyBtn} onClick={copyLink}>
              {copied ? '✓' : '🔗'} Link
            </button>
          </div>
        </div>

        <p className={styles.hint}>
          Gửi <strong>Room ID</strong> hoặc <strong>link</strong> cho bạn bè.<br />
          Bạn bè mở link → tự vào phòng ngay!
        </p>

        <button className={styles.btnDanger} onClick={onCancel}>Huỷ tìm trận</button>
      </div>
    </div>
  );
}
