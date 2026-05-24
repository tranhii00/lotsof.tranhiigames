import styles from './Modal.module.css';

export default function Modal({ emoji, title, msg, onClose }) {
  return (
    <div className={styles.overlay}>
      <div className={styles.card}>
        <div className={styles.emoji}>{emoji}</div>
        <h2>{title}</h2>
        <p>{msg}</p>
        <button className={styles.btn} onClick={onClose}>Quay lại Menu</button>
      </div>
    </div>
  );
}
