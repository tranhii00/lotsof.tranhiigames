import { useState } from 'react';
import styles from './WaitingScreen.module.css';

export default function WaitingScreen({ myName, roomId, onCancel }) {
  const [copied, setCopied] = useState(false);
  const shareUrl = window.location.href;

  const copy = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.ring} />
        <h2>Đang chờ đối thủ...</h2>
        <p className={styles.name}>👤 {myName}</p>

        <div className={styles.roomBox}>
          <span className={styles.roomLabel}>Room ID của bạn</span>
          <div className={styles.roomId}>{roomId}</div>
          <button className={styles.copyBtn} onClick={() => copy(roomId)}>
            {copied ? '✓ Đã sao chép' : 'Sao chép Room ID'}
          </button>
        </div>

        <p className={styles.hint}>
          Gửi Room ID này cho bạn bè.<br />
          Họ vào game → "Vào phòng" → nhập ID → kết nối!
        </p>

        <button className={styles.btnDanger} onClick={onCancel}>Huỷ bỏ</button>
      </div>
    </div>
  );
}
