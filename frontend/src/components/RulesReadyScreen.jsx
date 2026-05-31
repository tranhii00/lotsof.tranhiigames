import React from 'react';
import styles from './RulesReadyScreen.module.css';

const RULES = {
  caro: {
    title: 'CỜ CARO',
    badge: 'ĐẤU TRÍ CHIẾN THUẬT',
    items: [
      'Đấu trí tuệ 5 nước thắng hàng ngang/dọc/chéo.',
      'Bạn có thể chặn hai đầu để phòng ngự hoặc tấn công.',
      'Thời gian suy nghĩ cho mỗi nước đi là 30 giây.'
    ]
  },
  sentence_scramble: {
    title: 'ĐUA XẾP CÂU',
    badge: 'PHẢN XẠ TIẾNG ANH',
    items: [
      'Ghép các mảnh từ thành câu tiếng Anh hoàn chỉnh có nghĩa.',
      'Ai hoàn thành đúng câu nhanh nhất sẽ giành điểm vòng.',
      'Ván đấu gồm 5 vòng. Ai đạt 5 điểm trước sẽ thắng cuộc!'
    ]
  },
  word_chain: {
    title: 'NỐI TỪ TIẾNG ANH',
    badge: 'NỐI TỪ KỊCH TÍNH',
    items: [
      'Gõ từ tiếng Anh bắt đầu bằng chữ cái cuối của từ đối thủ.',
      'Độ dài từ bắt buộc từ 3 chữ cái trở lên (tra cứu từ điển offline 479,000 từ).',
      'Thời gian nghĩ là 10 giây. Nhập sai từ hoặc hết giờ sẽ bị trừ 1 HP (mỗi người có 3 HP).'
    ]
  }
};

export default function RulesReadyScreen({ gameType, readyStatus, lobbyInfo, socketId, onReady }) {
  const gameRules = RULES[gameType] || { title: 'TRÒ CHƠI', badge: 'THỬ THÁCH', items: ['Đang tải luật chơi...'] };
  
  const players = lobbyInfo?.players || {};
  const isMeReady = readyStatus[socketId] === true;

  return (
    <div className={styles.screen}>
      <div className={styles.card}>
        <div className={styles.topLeftCorner} />
        <div className={styles.bottomRightCorner} />
        
        <div className={styles.header}>
          <div className={styles.badge}>{gameRules.badge}</div>
          <h1 className={styles.title}>{gameRules.title}</h1>
          <div className={styles.divider} />
        </div>
        
        <ul className={styles.rulesList}>
          {gameRules.items.map((item, index) => (
            <li key={index} className={styles.ruleItem}>
              <span className={styles.ruleNum}>{index + 1}</span>
              <span className={styles.ruleText}>{item}</span>
            </li>
          ))}
        </ul>
        
        <div className={styles.playersBox}>
          <div className={styles.playersHeader}>TRẠNG THÁI ĐỒNG BỘ PHÒNG</div>
          {Object.keys(players).map(id => {
            const p = players[id];
            const isReady = readyStatus[id] === true;
            const isSelf = id === socketId;
            
            return (
              <div key={id} className={styles.playerRow}>
                <span className={styles.playerName}>
                  {p.name} {isSelf && '(Bạn)'}
                </span>
                <span className={`${styles.statusTag} ${isReady ? styles.statusReady : styles.statusPending}`}>
                  <span className={`${styles.dot} ${isReady ? styles.dotReady : styles.dotPending}`} />
                  {isReady ? 'ĐÃ SẴN SÀNG' : 'ĐANG ĐỌC LUẬT...'}
                </span>
              </div>
            );
          })}
        </div>
        
        <button 
          className={styles.readyBtn} 
          onClick={onReady}
          disabled={isMeReady}
        >
          {isMeReady ? '✓ BẠN ĐÃ SẴN SÀNG' : 'SẴN SÀNG CHIẾN'}
        </button>
      </div>
    </div>
  );
}
