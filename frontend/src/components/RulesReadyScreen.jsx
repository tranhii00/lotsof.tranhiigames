import React from 'react';
import styles from './RulesReadyScreen.module.css';

const RULES = {
  caro: {
    title: 'CỜ CARO',
    badge: 'ĐẤU TRÍ CHIẾN THUẬT',
    items: [
      'Đủ 5 quân liên tiếp là thắng.',
      'Bị chặn kín 2 đầu thì không tính.'
    ]
  },
  sentence_scramble: {
    title: 'ĐUA XẾP CÂU',
    badge: 'PHẢN XẠ TIẾNG ANH',
    items: [
      'Ghép các mảnh từ thành câu tiếng Anh hoàn chỉnh.',
      'Đúng 5 câu trước sẽ giành chiến thắng.'
    ]
  },
  word_chain: {
    title: 'NỐI TỪ TIẾNG ANH',
    badge: 'NỐI TỪ KỊCH TÍNH',
    items: [
      'Gõ từ tiếng Anh bắt đầu bằng chữ cái cuối của từ đối thủ.',
      'Độ dài từ bắt buộc từ 3 chữ cái trở lên.',
      'Thời gian nghĩ là 10 giây. Nhập sai từ hoặc hết giờ sẽ bị trừ 1 HP (mỗi người có 3 HP).'
    ]
  },
  english_word_builder: {
    title: 'MAKE A WORD',
    badge: 'TẠO TỪ TIẾNG ANH',
    items: [
      'Hai người lần lượt chọn chữ cái đầu và cuối của từ.',
      'Gõ từ tiếng Anh khớp với 2 chữ cái đó; ai đúng trước được +1đ - đủ 10đ trước sẽ thắng.',
      'Khi bạn Skip, đối phương có 15s để tiếp tục - 5s đầu có thể Skip để hòa và qua vòng mới; 10s sau bắt buộc nhập từ. Nhập đúng +1đ, sai thì điểm cho đối phương.'
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
