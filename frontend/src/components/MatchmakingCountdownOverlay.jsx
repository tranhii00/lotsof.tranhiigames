import React from 'react';
import styles from './MatchmakingCountdownOverlay.module.css';

export default function MatchmakingCountdownOverlay({ number }) {
  if (!number) return null;
  return (
    <div className={styles.overlay}>
      <div className={styles.container}>
        <h1 key={number} className={styles.number}>{number}</h1>
      </div>
    </div>
  );
}
