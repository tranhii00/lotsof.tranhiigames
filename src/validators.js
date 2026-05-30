const { BOARD_SIZE } = require('./config');

function err(msg) { return { ok: false, error: msg }; }
const ok = { ok: true };

function validateCreateRoom({ playerName } = {}) {
  if (typeof playerName !== 'string' || !playerName.trim()) return err('Tên không được để trống');
  if (playerName.trim().length > 20) return err('Tên tối đa 20 ký tự');
  return ok;
}

function validateJoinRoom({ roomId, playerName } = {}) {
  if (typeof roomId !== 'string' || !/^[A-Z0-9]{6}$/.test(roomId.trim().toUpperCase()))
    return err('Room ID phải đúng 6 ký tự');
  if (typeof playerName !== 'string' || !playerName.trim()) return err('Tên không được để trống');
  if (playerName.trim().length > 20) return err('Tên tối đa 20 ký tự');
  return ok;
}

function validateMove({ r, c } = {}) {
  if (!Number.isInteger(r) || !Number.isInteger(c)) return err('Toạ độ không hợp lệ');
  if (r < 0 || r >= BOARD_SIZE || c < 0 || c >= BOARD_SIZE) return err('Toạ độ ngoài bàn cờ');
  return ok;
}

function validateChat({ message } = {}) {
  if (typeof message !== 'string' || !message.trim()) return err('Tin nhắn trống');
  return ok;
}

module.exports = { validateCreateRoom, validateJoinRoom, validateMove, validateChat };
