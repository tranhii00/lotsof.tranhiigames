import { useState, useEffect, useRef } from 'react';
import styles from './EnglishWordBuilderScreen.module.css';
import ChatPanel from './ChatPanel';

export default function EnglishWordBuilderScreen({
  ewbState,
  lobbyInfo,
  myRole,
  socketId,
  onSubmitLetter,
  onSubmitWord,
  onSkip,
  onLeave,
  onChat,
  chatMsgs
}) {
  const {
    round,
    phase,
    firstLetterPlayerId,
    lastLetterPlayerId,
    firstLetter,
    lastLetter,
    lettersSubmitted,
    scores,
    submitResult,
    skipState,
    roundEndResult
  } = ewbState;

  const [letterInput, setLetterInput] = useState('');
  const [wordInput, setWordInput] = useState('');
  const [chatOpen, setChatOpen] = useState(true);
  const [shake, setShake] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const wordInputRef = useRef(null);

  const players = Object.entries(lobbyInfo.players).map(([id, p]) => ({ id, ...p }));
  const me = players.find(p => p.role === myRole) || {};
  const opp = players.find(p => p.role !== myRole) || {};

  const myScore = scores[me.id] || 0;
  const oppScore = scores[opp.id] || 0;

  const isMyTurnToSet = (firstLetterPlayerId === socketId && !lettersSubmitted[socketId]) ||
                        (lastLetterPlayerId === socketId && !lettersSubmitted[socketId]);

  const letterToSetType = firstLetterPlayerId === socketId ? 'chữ cái ĐẦU' : 'chữ cái CUỐI';

  // Handle letter submit
  const handleLetterSubmit = (e) => {
    e.preventDefault();
    const clean = letterInput.trim().toLowerCase();
    if (!/^[a-z]$/.test(clean)) return;
    onSubmitLetter(clean);
    setLetterInput('');
  };

  // Handle word submit
  const handleWordSubmit = (e) => {
    e.preventDefault();
    const clean = wordInput.trim().toLowerCase();
    if (!clean) return;
    setIsSubmitting(true);
    onSubmitWord(clean);
  };

  // Track submit errors to clear/shake input
  useEffect(() => {
    if (submitResult) {
      setIsSubmitting(false);
      if (submitResult.correct === true) {
        setWordInput('');
      } else {
        setShake(true);
        setWordInput(''); // Clear wrong input
        const timer = setTimeout(() => setShake(false), 500);
        return () => clearTimeout(timer);
      }
    }
  }, [submitResult]);

  // Keep input focused when solving or when submission finishes
  useEffect(() => {
    if (phase === 'solving' && !isSubmitting && wordInputRef.current) {
      wordInputRef.current.focus();
    }
  }, [phase, isSubmitting]);

  // Determine skip UI
  const hasSkipped = skipState && skipState.skippedFirstPlayerId === socketId;
  const opponentSkipped = skipState && skipState.skippedFirstPlayerId === opp.id;
  const skipTimeSeconds = skipState ? Math.ceil(skipState.timeLeftMs / 1000) : 0;

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <button className={styles.btnLeave} onClick={onLeave}>🚪 Thoát</button>
        <div className={styles.roundInfo}>
          <h2>MAKE A WORD</h2>
          <p>Round {round}</p>
        </div>
        <div className={styles.scores}>
          <div className={styles.scoreCard}>
            <span className={styles.avatarMini} style={{ backgroundColor: me.avatar?.color || '#FF7A00' }}>
              {me.avatar?.emoji || '🦊'}
            </span>
            <span className={styles.scoreName}>{me.name} (Bạn)</span>
            <span className={styles.scoreVal}>{myScore}</span>
          </div>
          <div className={styles.vs}>VS</div>
          <div className={styles.scoreCard}>
            <span className={styles.scoreVal}>{oppScore}</span>
            <span className={styles.scoreName}>{opp?.name || 'Đối thủ'}</span>
            <span className={styles.avatarMini} style={{ backgroundColor: opp.avatar?.color || '#4E5D6C' }}>
              {opp.avatar?.emoji || '🐼'}
            </span>
          </div>
        </div>
      </div>

      {/* Main Game Screen */}
      <div className={styles.gameBody}>
        {phase === 'setting' ? (
          <div className={styles.phaseCard}>
            <h3>🎭 Giai đoạn đặt chữ cái</h3>
            {isMyTurnToSet ? (
              <form onSubmit={handleLetterSubmit} className={styles.letterForm}>
                <p>Bạn được giao đặt <strong>{letterToSetType}</strong> cho từ cần tạo.</p>
                <div className={styles.inputGroup}>
                  <input
                    type="text"
                    maxLength={1}
                    value={letterInput}
                    onChange={(e) => setLetterInput(e.target.value.toLowerCase().replace(/[^a-z]/g, ''))}
                    placeholder="Nhập 1 chữ cái (a-z)..."
                    className={styles.letterInput}
                    autoFocus
                  />
                  <button type="submit" className={styles.btnSubmit} disabled={!/^[a-z]$/.test(letterInput.trim().toLowerCase())}>
                    Xác nhận
                  </button>
                </div>
              </form>
            ) : (
              <div className={styles.waitingState}>
                <p>⌛ {lettersSubmitted[socketId] ? 'Bạn đã chọn chữ cái. Đang chờ đối thủ...' : 'Đang chờ đối thủ đặt chữ cái...'}</p>
                <div className={styles.statusList}>
                  <div className={styles.statusItem}>
                    <span>{me.name} (Bạn):</span>
                    <span className={lettersSubmitted[me.id] ? styles.submitted : styles.pending}>
                      {lettersSubmitted[me.id] ? '✓ Sẵn sàng' : '✍ Đang nghĩ...'}
                    </span>
                  </div>
                  <div className={styles.statusItem}>
                    <span>{opp?.name || 'Đối thủ'}:</span>
                    <span className={lettersSubmitted[opp?.id] ? styles.submitted : styles.pending}>
                      {lettersSubmitted[opp?.id] ? '✓ Sẵn sàng' : '✍ Đang nghĩ...'}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className={styles.phaseCard}>
            <h3>🚀 Đua tốc độ gõ từ</h3>

            {roundEndResult && (
              <div className={`${styles.roundEndNotice} ${
                roundEndResult.winnerId === socketId
                  ? styles.roundEndWin
                  : !roundEndResult.winnerId
                  ? styles.roundEndDraw
                  : styles.roundEndLose
              }`}>
                {(() => {
                  const isWinnerMe = roundEndResult.winnerId === socketId;
                  
                  if (roundEndResult.reason === 'both_skip') {
                    return "🤝 Cả hai cùng Bỏ qua! Đang chuyển sang vòng mới...";
                  }
                  if (roundEndResult.reason === 'correct_word') {
                    return isWinnerMe 
                      ? "🎉 Bạn đã trả lời đúng trước! Nhận được +1 điểm." 
                      : `Đối thủ (${opp?.name || 'Đối thủ'}) đã trả lời đúng trước! Đối thủ nhận +1 điểm.`;
                  }
                  if (roundEndResult.reason === 'opponent_invalid_word') {
                    return isWinnerMe
                      ? `❌ Đối thủ (${opp?.name || 'Đối thủ'}) trả lời sai từ! Bạn nhận được +1 điểm.`
                      : "❌ Bạn trả lời sai từ! Đối thủ nhận được +1 điểm.";
                  }
                  if (roundEndResult.reason === 'opponent_timeout') {
                    return isWinnerMe
                      ? `⏱️ Hết giờ! Đối thủ (${opp?.name || 'Đối thủ'}) không trả lời được. Bạn nhận được +1 điểm.`
                      : "⏱️ Hết giờ! Bạn không trả lời được. Đối thủ nhận được +1 điểm.";
                  }
                  if (roundEndResult.reason === 'timeout') {
                    return "⏱️ Hết thời gian! Không ai ghi được điểm.";
                  }
                  return "";
                })()}
              </div>
            )}

            {opponentSkipped && (
              <div className={styles.skipWarning}>
                ⚠️ Đối thủ đã Bỏ qua! Bạn có <strong>{skipTimeSeconds} giây</strong> để tiếp tục - {skipTimeSeconds > 10 ? 'có thể Bỏ qua (Skip) để hòa và qua vòng mới' : 'bắt buộc phải nhập từ (sai đối thủ được điểm)'}!
              </div>
            )}

            {hasSkipped && (
              <div className={styles.skipWaiting}>
                ⌛ Bạn đã Bỏ qua. Đang đợi đối thủ kết thúc lượt...
              </div>
            )}

            {submitResult && !submitResult.correct && (
              <div className={styles.errorMsg}>
                ❌ {submitResult.reason}
              </div>
            )}

            <p className={styles.solveInstructions}>
              Tìm từ tiếng Anh có nghĩa bắt đầu bằng <strong>{firstLetter?.toUpperCase()}</strong> và kết thúc bằng <strong>{lastLetter?.toUpperCase()}</strong>!
            </p>

            <div 
              className={styles.wordRevealBox}
              style={roundEndResult?.correctWord ? (() => {
                const len = roundEndResult.correctWord.length;
                if (len <= 5) return { fontSize: '3rem', gap: '1.5rem' };
                if (len <= 7) return { fontSize: '2.4rem', gap: '1rem' };
                if (len <= 10) return { fontSize: '1.8rem', gap: '0.5rem' };
                return { fontSize: '1.3rem', gap: '0.25rem' };
              })() : {}}
            >
              {roundEndResult?.correctWord ? (
                Array.from(roundEndResult.correctWord).map((char, idx) => (
                  <span key={idx} className={styles.revealLetter}>
                    {char.toUpperCase()}
                  </span>
                ))
              ) : (
                <>
                  <span className={styles.revealLetter}>{firstLetter?.toUpperCase()}</span>
                  <span className={styles.revealDots}>. . . . .</span>
                  <span className={styles.revealLetter}>{lastLetter?.toUpperCase()}</span>
                </>
              )}
            </div>

            <form onSubmit={handleWordSubmit} className={`${styles.wordForm} ${shake ? styles.shake : ''}`}>
              <input
                ref={wordInputRef}
                type="text"
                value={wordInput}
                onChange={(e) => setWordInput(e.target.value)}
                placeholder={hasSkipped ? "Đã chọn Bỏ qua" : `Bắt đầu bằng "${firstLetter?.toUpperCase()}" và kết thúc bằng "${lastLetter?.toUpperCase()}"...`}
                disabled={hasSkipped || isSubmitting || !!roundEndResult}
                className={styles.wordInput}
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="none"
                spellCheck="false"
              />
              <button
                type="submit"
                disabled={hasSkipped || !wordInput.trim() || isSubmitting || !!roundEndResult}
                className={styles.btnSubmitWord}
              >
                Gửi từ
              </button>
            </form>

            <div className={styles.skipAction}>
              <button
                onClick={onSkip}
                disabled={hasSkipped || (skipState && !skipState.canOpponentSkip) || !!roundEndResult}
                className={styles.btnSkip}
              >
                {hasSkipped ? 'Đã bỏ qua' : 'Bỏ qua (Skip)'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Chat Area at Bottom */}
      <div className={styles.chatSection}>
        <div className={styles.chatHeader}>
          <button className={styles.chatToggle} onClick={() => setChatOpen(!chatOpen)}>
            💬 Trò chuyện {chatOpen ? '▲' : '▼'}
          </button>
        </div>
        {chatOpen && (
          <div className={styles.chatPanelWrapper}>
            <ChatPanel messages={chatMsgs} onSend={onChat} myName={me.name} />
          </div>
        )}
      </div>
    </div>
  );
}
