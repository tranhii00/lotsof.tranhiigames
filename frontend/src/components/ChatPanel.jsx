import { useState, useRef, useEffect } from 'react';
import styles from './ChatPanel.module.css';

export default function ChatPanel({ messages, onSend }) {
  const [text, setText] = useState('');
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = () => {
    const msg = text.trim();
    if (!msg) return;
    onSend(msg);
    setText('');
  };

  return (
    <div className={styles.panel}>
      <div className={styles.header}>💬 Chat</div>
      <div className={styles.messages}>
        {messages.length === 0 && (
          <p className={styles.empty}>Chưa có tin nhắn nào...</p>
        )}
        {messages.map((m, i) => (
          <div key={i} className={styles.msg}>
            <span className={styles.sender}>{m.sender}</span>
            <span className={styles.time}>{m.time}</span>
            <span className={styles.text}>{m.message}</span>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      <div className={styles.inputRow}>
        <input
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && send()}
          placeholder="Nhắn tin..."
          maxLength={200}
        />
        <button onClick={send}>Gửi</button>
      </div>
    </div>
  );
}
