import styles from './Board.module.css';

const SIZE = 15;

export default function Board({ board, myRole, currentTurn, onMove }) {
  const isMyTurn = currentTurn === myRole;

  return (
    <div className={`${styles.board} ${!isMyTurn ? styles.disabled : ''}`}>
      {Array.from({ length: SIZE }, (_, r) =>
        Array.from({ length: SIZE }, (_, c) => {
          const val = board[r]?.[c];
          return (
            <div
              key={`${r}-${c}`}
              className={`${styles.cell} ${val ? styles[val.toLowerCase()] : ''} ${!val && isMyTurn ? styles.hoverable : ''}`}
              onClick={() => !val && isMyTurn && onMove(r, c)}
            >
              {val === 'X' ? '✕' : val === 'O' ? '○' : ''}
            </div>
          );
        })
      )}
    </div>
  );
}
