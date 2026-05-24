import { useState, useEffect, useRef } from 'react';
import styles from './Timer.module.css';

const TOTAL = 30;

export default function Timer({ timerInfo }) {
  const [secs, setSecs] = useState(TOTAL);
  const ref = useRef(null);

  useEffect(() => {
    if (!timerInfo) { setSecs(TOTAL); return; }
    const { timestamp, duration } = timerInfo;

    const tick = () => {
      const elapsed = (Date.now() - timestamp) / 1000;
      const left = Math.max(0, Math.ceil(duration / 1000 - elapsed));
      setSecs(left);
    };

    tick();
    ref.current = setInterval(tick, 500);
    return () => clearInterval(ref.current);
  }, [timerInfo]);

  const pct = (secs / TOTAL) * 100;
  const danger = secs <= 10;

  return (
    <div className={styles.box}>
      <div className={styles.label}>⏱ Còn lại</div>
      <div className={`${styles.display} ${danger ? styles.danger : ''}`}>{secs}</div>
      <div className={styles.barBg}>
        <div
          className={`${styles.bar} ${danger ? styles.barDanger : ''}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
