// Shared constants — single source of truth
const BOARD_SIZE = 15;
const TURN_MS = 30_000;

const GAME_TYPES = {
  CARO: 'caro',
  SENTENCE_SCRAMBLE: 'sentence_scramble',
  WORD_CHAIN: 'word_chain',
  ENGLISH_WORD_BUILDER: 'english_word_builder'
};

const EVENTS = {
  // Client → Server
  CREATE_ROOM: 'create_room',
  JOIN_ROOM:   'join_room',
  MAKE_MOVE:   'make_move',
  CHAT_MSG:    'chat_message',
  LEAVE_ROOM:  'leave_room',
  CANCEL_ROOM: 'cancel_room',
  REQUEST_REMATCH: 'request_rematch',
  CHANGE_MUSIC:    'change_music',
  PLAYER_READY:    'player_ready',
  
  // Lobby Events
  SELECT_GAME: 'select_game',
  REQUEST_LOBBY: 'request_lobby',

  // Sentence Scramble Events (Client → Server)
  SENTENCE_SUBMIT_ANSWER: 'sentence_submit_answer',

  // Word Chain Events (Client → Server)
  WORD_SUBMIT_ANSWER: 'word_submit_answer',

  // English Word Builder Events (Client → Server)
  EWB_SUBMIT_LETTER: 'ewb_submit_letter',
  EWB_SUBMIT_WORD: 'ewb_submit_word',
  EWB_SKIP: 'ewb_skip',

  // Server → Client
  ROOM_CREATED:           'room_created',
  JOIN_ERROR:             'join_error',
  ROOM_READY:             'room_ready', // triggers lobby UI
  LOBBY_UPDATE:           'lobby_update', // updates returning to lobby requests
  GAME_SELECTED:          'game_selected',
  GAME_STARTED:           'game_started', // starts the actual game
  MATCH_FOUND:            'match_found', // legacy, mapped to room_ready/game_started flows now
  MOVE_MADE:              'move_made',
  TURN_UPDATE:            'turn_update',
  TURN_TIMER:             'turn_timer',
  GAME_OVER:              'game_over',
  OPPONENT_DISCONNECTED:  'opponent_disconnected',
  SYSTEM_MSG:             'system_message',
  REMATCH_UPDATE:         'rematch_update',
  REMATCH_START:          'rematch_start',
  MUSIC_SYNC:             'music_sync',
  READY_UPDATE:           'ready_update',
  START_COUNTDOWN:        'start_countdown',

  // Sentence Scramble Events (Server → Client)
  SENTENCE_ROUND_STARTED: 'sentence_round_started',
  SENTENCE_SUBMIT_RESULT: 'sentence_submit_result',
  SENTENCE_ROUND_WON:     'sentence_round_won',
  SENTENCE_SCORE_UPDATE:  'sentence_score_update',
  SENTENCE_GAME_OVER:     'sentence_game_over',

  // Word Chain Events (Server → Client)
  WORD_ROUND_STARTED:     'word_round_started',
  WORD_HP_UPDATE:         'word_hp_update',
  WORD_VALIDATION_RESULT: 'word_validation_result',
  WORD_GAME_OVER:         'word_game_over',

  // English Word Builder Events (Server → Client)
  EWB_ROUND_STARTED:      'ewb_round_started',
  EWB_LETTER_SUBMITTED:   'ewb_letter_submitted',
  EWB_SOLVING_START:      'ewb_solving_start',
  EWB_WORD_RESULT:        'ewb_word_result',
  EWB_SKIP_UPDATE:        'ewb_skip_update',
  EWB_ROUND_END:          'ewb_round_end',
  EWB_GAME_OVER:          'ewb_game_over',
};

module.exports = { BOARD_SIZE, TURN_MS, GAME_TYPES, EVENTS };
