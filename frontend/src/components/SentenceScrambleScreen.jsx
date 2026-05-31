import { useState, useEffect } from 'react';
import styles from './SentenceScrambleScreen.module.css';

export default function SentenceScrambleScreen({ 
  ssState, 
  lobbyInfo, 
  myRole, 
  onSubmit, 
  onLeave, 
  onChat, 
  chatMsgs 
}) {
  const { round, words, scores, submitResult } = ssState;
  
  const [pool, setPool] = useState([]);
  const [answer, setAnswer] = useState([]);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // When a new round starts or words are received from server
    if (words && words.length > 0) {
      setPool(words.map((w, i) => ({ id: `word-${i}`, text: w })));
      setAnswer([]);
      setIsSubmitting(false); // Reset submit lock
    }
  }, [words, round]);

  useEffect(() => {
    if (submitResult === true) {
      setShowSuccess(true);
      const timer = setTimeout(() => setShowSuccess(false), 1500);
      return () => clearTimeout(timer);
    } else if (submitResult === false) {
      setIsSubmitting(false); // Unlock if answer is wrong
    }
  }, [submitResult]);

  const players = Object.entries(lobbyInfo.players).map(([id, p]) => ({ id, ...p }));
  const me = players.find(p => p.role === myRole) || {};
  const opp = players.find(p => p.role !== myRole) || {};

  const myScore = scores[me.id] || 0;
  const oppScore = scores[opp.id] || 0;

  const handlePoolClick = (wordObj) => {
    setPool(prev => prev.filter(w => w.id !== wordObj.id));
    setAnswer(prev => [...prev, wordObj]);
  };

  const handleAnswerClick = (wordObj) => {
    setAnswer(prev => prev.filter(w => w.id !== wordObj.id));
    setPool(prev => [...prev, wordObj]);
  };

  const handleReset = () => {
    setPool([...pool, ...answer]);
    setAnswer([]);
  };

  const handleSubmit = () => {
    if (pool.length > 0 || isSubmitting) return; // Must use all words and not already submitting
    setIsSubmitting(true);
    const submittedWords = answer.map(w => w.text);
    onSubmit(submittedWords);
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button className={styles.btnLeave} onClick={onLeave}>Thoát</button>
        <div className={styles.roundInfo}>
          <h2>Vòng {round}</h2>
          <p>Sắp xếp các từ thành câu hoàn chỉnh</p>
        </div>
      </div>

      <div className={styles.scoreboard}>
        <div className={styles.scoreCard}>
          <span className={styles.playerName}>{me.name} (Bạn)</span>
          <span className={styles.scoreValue}>{myScore}</span>
        </div>
        <div className={styles.scoreDivider}>VS</div>
        <div className={styles.scoreCard}>
          <span className={styles.scoreValue}>{oppScore}</span>
          <span className={styles.playerName}>{opp?.name}</span>
        </div>
      </div>

      <div className={styles.gameArea}>
        <div className={styles.zoneLabel}>Vùng trả lời:</div>
        <div className={`${styles.zone} ${styles.answerZone}`}>
          {answer.length === 0 && <span className={styles.placeholder}>Bấm vào từ bên dưới để ghép câu...</span>}
          {answer.map(w => (
            <button key={w.id} className={styles.wordBtn} onClick={() => handleAnswerClick(w)}>
              {w.text}
            </button>
          ))}
        </div>

        <div className={styles.zoneLabel}>Kho từ:</div>
        <div className={`${styles.zone} ${styles.poolZone}`}>
          {pool.length === 0 && <span className={styles.placeholder}>Đã dùng hết từ</span>}
          {pool.map(w => (
            <button key={w.id} className={styles.wordBtn} onClick={() => handlePoolClick(w)}>
              {w.text}
            </button>
          ))}
        </div>

        <div className={styles.actions}>
          <button className={styles.btnReset} onClick={handleReset} disabled={answer.length === 0}>
            Làm lại
          </button>
          <button 
            className={`${styles.btnSubmit} ${submitResult === false ? styles.btnError : ''}`} 
            onClick={handleSubmit} 
            disabled={pool.length > 0 || isSubmitting}
          >
            {isSubmitting ? 'Đang gửi...' : 'Gửi Đáp Án'}
          </button>
        </div>
        
        {submitResult === false && (
          <p className={styles.errorMsg}>❌ Sai rồi! Hãy thử sắp xếp lại nhé.</p>
        )}

        {showSuccess && (
          <p className={styles.successMsg}>✓ Chính xác! Bạn nhận +1 điểm.</p>
        )}
      </div>
    </div>
  );
}
