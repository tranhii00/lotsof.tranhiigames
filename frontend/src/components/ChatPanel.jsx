import { useState, useRef, useEffect, useCallback } from 'react';
import styles from './ChatPanel.module.css';

export default function ChatPanel({ messages, onSend, myName }) {
  const [text, setText] = useState('');
  const bottomRef  = useRef(null);
  const containerRef = useRef(null);

  // Smart auto-scroll: only if user is near the bottom
  const scrollToBottom = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const isNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
    if (isNearBottom) bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => { scrollToBottom(); }, [messages, scrollToBottom]);

  const send = () => {
    const msg = text.trim();
    if (!msg) return;
    onSend(msg);
    setText('');
  };

  return (
    <div className={styles.panel}>
      <div className={styles.header}>💬 Chat</div>
      <div className={styles.messages} ref={containerRef}>
        {messages.length === 0 && <p className={styles.empty}>Chưa có tin nhắn...</p>}
        {messages.map((m, i) => {
          if (m.system) return (
            <div key={i} className={styles.systemMsg}>{m.message}</div>
          );
          const isMine = m.isMine || m.sender === myName;
          return (
            <div key={i} className={`${styles.msg} ${isMine ? styles.mine : styles.theirs}`}>
              {!isMine && <span className={styles.sender}>{m.sender}</span>}
              <div className={styles.bubble}>{m.message}</div>
              <span className={styles.time}>{m.time}</span>
            </div>
          );
        })}
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
