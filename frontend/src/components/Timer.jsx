import { useState, useEffect, useRef } from 'react';
import styles from './Timer.module.css';

export default function Timer({ timerInfo, turnDuration }) {
  const total = Math.floor((turnDuration || 30000) / 1000);
  const [secs, setSecs] = useState(total);
  const ref = useRef(null);

  useEffect(() => {
    if (!timerInfo) { setSecs(total); return; }
    const { timestamp, duration } = timerInfo;
    const totalSecs = Math.floor(duration / 1000);

    const tick = () => {
      const elapsed = (Date.now() - timestamp) / 1000;
      setSecs(Math.max(0, Math.ceil(totalSecs - elapsed)));
    };
    tick();
    ref.current = setInterval(tick, 500);
    return () => clearInterval(ref.current);
  }, [timerInfo, total]);

  const pct = (secs / total) * 100;
  const danger = secs <= 10;

  return (
    <div className={styles.box}>
      <div className={styles.label}>⏱ Còn lại</div>
      <div className={`${styles.display} ${danger ? styles.danger : ''}`}>{secs}</div>
      <div className={styles.barBg}>
        <div className={`${styles.bar} ${danger ? styles.barDanger : ''}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
