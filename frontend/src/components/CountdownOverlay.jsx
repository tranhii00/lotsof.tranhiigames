import React from 'react';
import styles from './CountdownOverlay.module.css';

export default function CountdownOverlay({ number }) {
  if (number === null) return null;

  const isGo = number === 'START!' || number === 'GO!';

  return (
    <div className={styles.overlay}>
      <div className={styles.container}>
        <div className={`${styles.stripes} ${styles.stripesTop}`} />
        
        <h1 className={`${styles.number} ${isGo ? styles.goText : ''}`}>
          {number}
        </h1>
        
        <div className={styles.subtext}>
          {isGo ? '🚀 VÀO TRẬN!' : 'TRẬN ĐẤU SẮP BẮT ĐẦU...'}
        </div>
        
        <div className={`${styles.stripes} ${styles.stripesBottom}`} />
      </div>
    </div>
  );
}
