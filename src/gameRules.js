const { BOARD_SIZE } = require('./config');

function emptyBoard() {
  return Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(null));
}

/** Returns array of {r,c} for all 5+ winning cells, or null */
function getWinningLine(board, r, c, role) {
  const dirs = [[0,1],[1,0],[1,1],[1,-1]];
  for (const [dr, dc] of dirs) {
    const line = [{ r, c }];
    for (let d = 1; d < 5; d++) {
      const nr = r+dr*d, nc = c+dc*d;
      if (nr<0||nr>=BOARD_SIZE||nc<0||nc>=BOARD_SIZE||board[nr][nc]!==role) break;
      line.push({ r: nr, c: nc });
    }
    for (let d = 1; d < 5; d++) {
      const nr = r-dr*d, nc = c-dc*d;
      if (nr<0||nr>=BOARD_SIZE||nc<0||nc>=BOARD_SIZE||board[nr][nc]!==role) break;
      line.push({ r: nr, c: nc });
    }
    if (line.length >= 5) return line;
  }
  return null;
}

function checkWin(board, r, c, role) {
  return getWinningLine(board, r, c, role) !== null;
}

function checkDraw(board) {
  return board.every(row => row.every(cell => cell !== null));
}

module.exports = { emptyBoard, getWinningLine, checkWin, checkDraw };
