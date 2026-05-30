import styles from './ConnectionBanner.module.css';

export default function ConnectionBanner({ status }) {
  if (status === 'connected') return null;

  const messages = {
    connecting:    '🔄 Đang kết nối tới server...',
    disconnected:  '📡 Mất kết nối — đang thử kết nối lại...',
    reconnecting:  '🔁 Đang kết nối lại...',
  };

  return (
    <div className={`${styles.banner} ${status === 'disconnected' ? styles.error : ''}`}>
      {messages[status] || '...'}
    </div>
  );
}
