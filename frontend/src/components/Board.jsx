import styles from './Board.module.css';

const SIZE = 15;

export default function Board({ board, myRole, currentTurn, onMove, lastMove, winningLine, gameOver }) {
  const isMyTurn = !gameOver && currentTurn === myRole;

  // Build a Set for O(1) winning cell lookup
  const winSet = winningLine
    ? new Set(winningLine.map(({ r, c }) => `${r}-${c}`))
    : null;

  // Calculate coordinates for the SVG line (using percentages 0-100% of the board)
  let svgLine = null;
  if (winningLine && winningLine.length >= 5) {
    const sorted = [...winningLine].sort((a, b) => (a.r !== b.r ? a.r - b.r : a.c - b.c));
    const first = sorted[0];
    const last = sorted[sorted.length - 1];

    // Compute coordinate percentages (center of cells)
    const x1 = (first.c + 0.5) * (100 / SIZE);
    const y1 = (first.r + 0.5) * (100 / SIZE);
    const x2 = (last.c + 0.5) * (100 / SIZE);
    const y2 = (last.r + 0.5) * (100 / SIZE);

    svgLine = { x1: `${x1}%`, y1: `${y1}%`, x2: `${x2}%`, y2: `${y2}%` };
  }

  return (
    <div className={styles.container}>
      <div className={`${styles.board} ${!isMyTurn ? styles.disabled : ''}`}>
        {Array.from({ length: SIZE }, (_, r) =>
          Array.from({ length: SIZE }, (_, c) => {
            const val   = board[r]?.[c];
            const isWin  = winSet?.has(`${r}-${c}`);
            const isLast = lastMove?.r === r && lastMove?.c === c;

            return (
              <div
                key={`${r}-${c}`}
                className={[
                  styles.cell,
                  val ? styles[val.toLowerCase()] : '',
                  isWin  ? styles.winning  : '',
                  isLast ? styles.lastMove : '',
                  !val && isMyTurn ? styles.hoverable : '',
                ].join(' ')}
                onClick={() => !val && isMyTurn && onMove(r, c)}
              >
                {val === 'X' ? '✕' : val === 'O' ? '○' : ''}
              </div>
            );
          })
        )}

        {/* Dynamic neon vector connection line overlay */}
        {svgLine && (
          <svg className={styles.lineOverlay}>
            <line
              x1={svgLine.x1}
              y1={svgLine.y1}
              x2={svgLine.x2}
              y2={svgLine.y2}
              className={styles.neonLine}
            />
          </svg>
        )}
      </div>
    </div>
  );
}
