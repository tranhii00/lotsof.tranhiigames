import React from 'react';
import styles from './MatchFoundOverlay.module.css';

export default function MatchFoundOverlay() {
  return (
    <div className={styles.overlay}>
      <h1 className={styles.title}>MATCH FOUND</h1>
    </div>
  );
}
