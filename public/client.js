/* ============================================================
   client.js  –  Cờ Caro Multiplayer (v2 – cross-machine)
============================================================ */
const socket = io({ transports: ['websocket', 'polling'] });

const BOARD_SIZE = 15;
const TURN_DURATION = 30; // seconds

let myRole      = null;
let myName      = '';
let currentTurn = null;
let timerInterval  = null;
let timerSecondsLeft = TURN_DURATION;
let gameActive  = false;

// ── Screen elements ──────────────────────────────────────────
const screenMenu    = document.getElementById('screen-menu');
const screenWaiting = document.getElementById('screen-waiting');
const screenGame    = document.getElementById('screen-game');

// ── Menu ─────────────────────────────────────────────────────
const playerNameInput  = document.getElementById('player-name-input');
const btnFindMatch     = document.getElementById('btn-find-match');
const waitingPlayerName = document.getElementById('waiting-player-name');
const shareLinkText    = document.getElementById('share-link-text');
const btnCopyLink      = document.getElementById('btn-copy-link');
const btnCancelMatch   = document.getElementById('btn-cancel-match');

// ── Game ─────────────────────────────────────────────────────
const boardEl        = document.getElementById('board');
const boardStatus    = document.getElementById('board-status');
const nameX          = document.getElementById('name-x');
const nameO          = document.getElementById('name-o');
const cardX          = document.getElementById('card-player-x');
const cardO          = document.getElementById('card-player-o');
const indicatorX     = document.getElementById('indicator-x');
const indicatorO     = document.getElementById('indicator-o');
const myRoleDisplay  = document.getElementById('my-role-display');
const timerDisplay   = document.getElementById('timer-display');
const timerBar       = document.getElementById('timer-bar');
const btnLeave       = document.getElementById('btn-leave');

// ── Chat ─────────────────────────────────────────────────────
const chatMessages   = document.getElementById('chat-messages');
const chatInput      = document.getElementById('chat-input');
const btnSendChat    = document.getElementById('btn-send-chat');

// ── Modal ────────────────────────────────────────────────────
const modalOverlay   = document.getElementById('modal-overlay');
const modalEmoji     = document.getElementById('modal-emoji');
const modalTitle     = document.getElementById('modal-title');
const modalMsg       = document.getElementById('modal-msg');
const btnModalClose  = document.getElementById('btn-modal-close');

// ============================================================
//  UTILITIES
// ============================================================
function showScreen(el) {
    [screenMenu, screenWaiting, screenGame].forEach(s => s.classList.remove('active'));
    el.classList.add('active');
}

function showModal(emoji, title, msg) {
    modalEmoji.textContent = emoji;
    modalTitle.textContent = title;
    modalMsg.textContent   = msg;
    modalOverlay.classList.add('active');
}

function addChatMsg({ sender, message, time, system }) {
    const div = document.createElement('div');
    div.classList.add('chat-msg');
    if (system) {
        div.classList.add('system');
        div.textContent = message;
    } else {
        div.innerHTML = `<span class="msg-sender">${sender}</span><span class="msg-time">${time}</span><span class="msg-text">${message}</span>`;
    }
    chatMessages.appendChild(div);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// ============================================================
//  BOARD
// ============================================================
function initBoard() {
    boardEl.innerHTML = '';
    boardEl.classList.remove('disabled');
    for (let r = 0; r < BOARD_SIZE; r++) {
        for (let c = 0; c < BOARD_SIZE; c++) {
            const cell = document.createElement('div');
            cell.classList.add('cell');
            cell.dataset.r = r;
            cell.dataset.c = c;
            cell.addEventListener('click', onCellClick);
            boardEl.appendChild(cell);
        }
    }
}

function setCell(r, c, role) {
    const cell = boardEl.querySelector(`.cell[data-r="${r}"][data-c="${c}"]`);
    if (cell) {
        cell.textContent = role === 'X' ? '✕' : '○';
        cell.classList.add(role.toLowerCase());
    }
}

function onCellClick(e) {
    if (!gameActive || currentTurn !== myRole) return;
    const cell = e.currentTarget;
    if (cell.textContent) return; // already filled
    const r = parseInt(cell.dataset.r);
    const c = parseInt(cell.dataset.c);
    socket.emit('make_move', { r, c });
}

// ============================================================
//  TURN UI
// ============================================================
function updateTurnUI() {
    const isMyTurn = currentTurn === myRole;
    boardEl.classList.toggle('disabled', !isMyTurn);

    boardStatus.textContent = isMyTurn ? '⚡ Đến lượt của bạn!' : `Đang chờ đối thủ đánh...`;
    boardStatus.className   = `board-status${isMyTurn ? ' your-turn' : ''}`;

    cardX.classList.toggle('active-turn', currentTurn === 'X');
    cardO.classList.toggle('active-turn', currentTurn === 'O');
    indicatorX.className = `active-indicator${currentTurn === 'X' ? ' on' : ''}`;
    indicatorO.className = `active-indicator${currentTurn === 'O' ? ' on' : ''}`;
}

// ============================================================
//  TIMER
// ============================================================
function startClientTimer(duration) {
    clearInterval(timerInterval);
    timerSecondsLeft = Math.floor(duration / 1000);

    const update = () => {
        const pct = (timerSecondsLeft / TURN_DURATION) * 100;
        timerDisplay.textContent = timerSecondsLeft;
        timerBar.style.width     = pct + '%';

        const danger = timerSecondsLeft <= 10;
        timerDisplay.classList.toggle('danger', danger);
        timerBar.classList.toggle('danger', danger);

        if (timerSecondsLeft <= 0) { clearInterval(timerInterval); return; }
        timerSecondsLeft--;
    };
    update();
    timerInterval = setInterval(update, 1000);
}

function stopTimer() {
    clearInterval(timerInterval);
    timerDisplay.textContent = '--';
    timerBar.style.width     = '100%';
    timerDisplay.classList.remove('danger');
    timerBar.classList.remove('danger');
}

// ============================================================
//  MENU ACTIONS
// ============================================================
btnFindMatch.addEventListener('click', () => {
    myName = playerNameInput.value.trim() || 'Người chơi';
    socket.emit('find_match', { playerName: myName });
});

btnCancelMatch.addEventListener('click', () => {
    socket.emit('cancel_find_match');
});

btnCopyLink.addEventListener('click', () => {
    navigator.clipboard.writeText(shareLinkText.textContent)
        .then(() => { btnCopyLink.textContent = '✓ Đã sao chép'; setTimeout(() => { btnCopyLink.textContent = 'Sao chép'; }, 2000); });
});

btnLeave.addEventListener('click', () => { window.location.reload(); });

btnModalClose.addEventListener('click', () => {
    modalOverlay.classList.remove('active');
    showScreen(screenMenu);
});

// ── CHAT ────────────────────────────────────────────────────
function sendChat() {
    const msg = chatInput.value.trim();
    if (!msg) return;
    socket.emit('chat_message', { message: msg });
    chatInput.value = '';
}
btnSendChat.addEventListener('click', sendChat);
chatInput.addEventListener('keydown', e => { if (e.key === 'Enter') sendChat(); });

// ============================================================
//  SOCKET EVENTS
// ============================================================
socket.on('waiting_for_match', () => {
    waitingPlayerName.textContent = myName;
    shareLinkText.textContent     = window.location.href;
    showScreen(screenWaiting);
});

socket.on('match_cancelled', () => {
    showScreen(screenMenu);
});

socket.on('match_found', ({ role, turn, opponentName }) => {
    myRole       = role;
    currentTurn  = turn;
    gameActive   = true;

    nameX.textContent         = role === 'X' ? myName : opponentName;
    nameO.textContent         = role === 'O' ? myName : opponentName;
    myRoleDisplay.textContent = role === 'X' ? '✕ X' : '○ O';
    myRoleDisplay.className   = role.toLowerCase();

    initBoard();
    updateTurnUI();
    showScreen(screenGame);

    addChatMsg({ system: true, message: `Trận đấu bắt đầu! ${nameX.textContent} (X) vs ${nameO.textContent} (O)` });
});

socket.on('move_made', ({ r, c, role }) => {
    setCell(r, c, role);
});

socket.on('turn_update', (turn) => {
    currentTurn = turn;
    updateTurnUI();
});

socket.on('turn_timer_start', ({ duration }) => {
    startClientTimer(duration);
});

socket.on('game_over', ({ winner, reason }) => {
    stopTimer();
    gameActive   = false;
    currentTurn  = null;
    boardEl.classList.add('disabled');
    boardStatus.textContent = '';

    if (reason === 'timeout') {
        const loserName = winner === 'X' ? nameO.textContent : nameX.textContent;
        const winnerName = winner === 'X' ? nameX.textContent : nameO.textContent;
        if (winner === myRole) {
            showModal('⏰', 'Hết giờ!', `${loserName} đã hết thời gian. Bạn THẮNG!`);
        } else {
            showModal('⌛', 'Hết giờ!', `Bạn đã hết thời gian! ${winnerName} THẮNG.`);
        }
    } else if (!winner) {
        showModal('🤝', 'Hòa!', 'Bàn cờ đầy mà không ai thắng. Trận hòa!');
    } else if (winner === myRole) {
        showModal('🏆', 'Chiến thắng!', 'Xuất sắc! Bạn đã thắng trận này!');
    } else {
        showModal('😔', 'Thất bại...', 'Rất tiếc! Đối thủ đã thắng. Cố lên lần sau nhé!');
    }
});

socket.on('chat_message', (data) => {
    addChatMsg(data);
});

socket.on('opponent_disconnected', () => {
    stopTimer();
    gameActive = false;
    showModal('🔌', 'Mất kết nối', 'Đối thủ đã thoát khỏi trận hoặc mất kết nối mạng!');
});

socket.on('connect', () => {
    console.log('[Socket] Đã kết nối tới server:', socket.id);
});

socket.on('disconnect', () => {
    console.warn('[Socket] Mất kết nối với server!');
    if (gameActive) {
        showModal('📡', 'Mất kết nối', 'Bạn đã bị mất kết nối với server!');
    }
});
