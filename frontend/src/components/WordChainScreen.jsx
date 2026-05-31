import { useState, useEffect, useRef } from 'react';
import styles from './WordChainScreen.module.css';
import Timer from './Timer';

export default function WordChainScreen({
  wcState,
  lobbyInfo,
  myRole,
  onSubmit,
  onLeave,
  onChat,
  chatMsgs,
  timerInfo
}) {
  const { activePlayerId, currentWord, requiredLetter, hp, wordList, submitResult } = wcState;
  const [typedWord, setTypedWord] = useState('');
  const [shake, setShake] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRef = useRef(null);

  // Players resolution
  const players = Object.entries(lobbyInfo.players).map(([id, p]) => ({ id, ...p }));
  const me = players.find(p => p.role === myRole) || {};
  const opp = players.find(p => p.role !== myRole) || {};

  const isMyTurn = activePlayerId === me.id;

  // Reset isSubmitting on turn switch
  useEffect(() => {
    setIsSubmitting(false);
  }, [activePlayerId]);

  // Track correct and wrong submit results
  useEffect(() => {
    if (submitResult?.correct === true) {
      setShowSuccess(true);
      setTypedWord('');
      setIsSubmitting(false);
      const timer = setTimeout(() => setShowSuccess(false), 1500);
      return () => clearTimeout(timer);
    } else if (submitResult?.correct === false) {
      setShake(true);
      setTypedWord(''); // Clear the input field on error!
      setIsSubmitting(false);
      const timer = setTimeout(() => setShake(false), 500);
      return () => clearTimeout(timer);
    }
  }, [submitResult]);

  // Keep input focused on your turn
  useEffect(() => {
    if (isMyTurn && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isMyTurn]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!isMyTurn || isSubmitting) return;
    const word = typedWord.trim();
    if (!word) return;
    setIsSubmitting(true);
    onSubmit(word);
  };

  // HP rendering helper
  const renderHearts = (playerId) => {
    const playerHp = hp[playerId] !== undefined ? hp[playerId] : 3;
    const hearts = [];
    for (let i = 0; i < 3; i++) {
      hearts.push(
        <span 
          key={i} 
          className={`${styles.heart} ${i < playerHp ? styles.activeHeart : styles.lostHeart}`}
        >
          ❤️
        </span>
      );
    }
    return <div className={styles.heartsRow}>{hearts}</div>;
  };

  return (
    <div className={styles.container}>
      {/* Top Header */}
      <div className={styles.header}>
        <button className={styles.btnLeave} onClick={onLeave}>Thoát</button>
        <div className={styles.titleArea}>
          <h2>Nối Từ Tiếng Anh</h2>
          <p>Nhanh mắt nhanh tay - Sát cánh gõ từ!</p>
        </div>
        <div className={styles.timerWrapper}>
          <Timer timerInfo={timerInfo} turnDuration={10000} />
        </div>
      </div>

      {/* Main Players VS Area */}
      <div className={styles.playersArea}>
        {/* Me Card */}
        <div className={`${styles.playerCard} ${isMyTurn ? styles.activeCard : ''}`}>
          <div className={styles.avatar}>🧑‍💻</div>
          <div className={styles.name}>{me.name} (Bạn)</div>
          {renderHearts(me.id)}
          {isMyTurn && <div className={styles.turnBadge}>Đến lượt bạn!</div>}
        </div>

        <div className={styles.vsDivider}>VS</div>

        {/* Opp Card */}
        <div className={`${styles.playerCard} ${!isMyTurn ? styles.activeCard : ''}`}>
          <div className={styles.avatar}>👤</div>
          <div className={styles.name}>{opp?.name || 'Đối thủ'}</div>
          {renderHearts(opp.id)}
          {!isMyTurn && <div className={styles.turnBadge}>Đối thủ nghĩ...</div>}
        </div>
      </div>

      {/* Play Area */}
      <div className={styles.playArea}>
        {/* Starter/Current Word Display */}
        <div className={styles.wordDisplayBox}>
          <div className={styles.displayLabel}>Từ hiện tại:</div>
          <div className={styles.wordBubble}>
            {currentWord ? (
              <>
                <span className={styles.wordBody}>{currentWord.slice(0, -1)}</span>
                <span className={styles.wordTargetLetter}>{currentWord.slice(-1).toUpperCase()}</span>
              </>
            ) : (
              <span className={styles.placeholder}>Đang đợi từ...</span>
            )}
          </div>
          <p className={styles.hintText}>
            Từ tiếp theo phải bắt đầu bằng chữ:{' '}
            <span className={styles.targetLetterHighlight}>
              {requiredLetter ? requiredLetter.toUpperCase() : '?'}
            </span>
          </p>
        </div>

        {/* Input/Submit Form */}
        <form onSubmit={handleSubmit} className={`${styles.form} ${shake ? styles.shake : ''}`}>
          <input
            ref={inputRef}
            type="text"
            className={styles.wordInput}
            placeholder={isMyTurn ? (isSubmitting ? "Đang xác thực..." : `Nhập từ bắt đầu bằng "${requiredLetter?.toUpperCase() || ''}"...`) : "Đợi đối thủ..."}
            value={typedWord}
            onChange={(e) => setTypedWord(e.target.value)}
            disabled={!isMyTurn || isSubmitting}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="none"
            spellCheck="false"
          />
          <button 
            type="submit" 
            className={styles.btnSubmit}
            disabled={!isMyTurn || !typedWord.trim() || isSubmitting}
          >
            {isSubmitting ? "Gửi..." : "Gửi"}
          </button>
        </form>

        {/* Validation / Status messages */}
        <div className={styles.messageContainer}>
          {submitResult?.correct === false && (
            <p className={styles.errorMsg}>❌ {submitResult.reason || 'Từ không hợp lệ!'}</p>
          )}
          {showSuccess && (
            <p className={styles.successMsg}>✓ Chính xác! Chuyển lượt.</p>
          )}
        </div>

        {/* Word History */}
        <div className={styles.historyBox}>
          <div className={styles.historyLabel}>Lịch sử từ vựng ({wordList.length}):</div>
          <div className={styles.historyList}>
            {wordList.map((w, idx) => (
              <span key={idx} className={styles.historyWordBadge}>
                {w}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
