import React from 'react';
import styles from './MatchFoundOverlay.module.css';

export default function MatchFoundOverlay({ opponentName }) {
  return (
    <div className={styles.overlay}>
      <div className={styles.grid} />
      <div className={styles.scanline} />
      
      <div className={styles.container}>
        <div className={`${styles.corner} ${styles.topLeft}`} />
        <div className={`${styles.corner} ${styles.topRight}`} />
        <div className={`${styles.corner} ${styles.bottomLeft}`} />
        <div className={`${styles.corner} ${styles.bottomRight}`} />
        
        <div className={styles.titleContainer}>
          <h1 className={styles.title}>MATCH FOUND</h1>
          <div className={styles.accentBar} />
        </div>
        
        <div className={styles.versusInfo}>
          <div className={styles.vsLabel}>ĐỐI THỦ ĐẦY ĐỦ</div>
          <h2 className={styles.opponentName}>{opponentName || 'ĐỐI THỦ'}</h2>
        </div>
        
        <div className={styles.readyText}>
          ⚡ ĐANG VÀO PHÒNG CHỜ...
        </div>
      </div>
    </div>
  );
}
