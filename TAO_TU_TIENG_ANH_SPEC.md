# Spec game: TAO TU TIENG ANH

Tai lieu nay dung de giao cho mot AI/dev khac code them game moi vao project realtime hien tai. Project dang co Node.js + Express + Socket.IO o backend va React + Vite o frontend. Da co lobby chon game, Caro, Sentence Scramble va Word Chain.

## 1. Muc tieu

Them game moi ten:

```text
TAO TU TIENG ANH
English Word Builder
```

Game dung chung room/socket/lobby hien tai. Hai nguoi choi vao cung room, host chon game `english_word_builder`, sau do game bat dau.

Y tuong chinh:

```text
Nguoi choi 1 nhap chu cai dau cua tu can tao.
Nguoi choi 2 nhap chu cai cuoi cua tu can tao.
Khi ca hai da nhap xong, server reveal cap chu cai dau/cuoi cho ca hai.
Hai nguoi dua nhau viet mot tu tieng Anh co nghia, bat dau va ket thuc dung cap chu cai do.
Ai dat 10 diem truoc thi thang ca game.
```

## 2. Tich hop vao project hien tai

Can them game type moi vao ca backend va frontend:

```js
ENGLISH_WORD_BUILDER: 'english_word_builder'
```

Vi tri can sua:

```text
src/config.js
frontend/src/constants.js
src/socketHandlers.js
frontend/src/hooks/useGameSocket.js
frontend/src/components/LobbyScreen.jsx
frontend/src/App.jsx
```

Can tao component man hinh moi:

```text
frontend/src/components/EnglishWordBuilderScreen.jsx
frontend/src/components/EnglishWordBuilderScreen.module.css
```

Co the tao file logic rieng cho backend:

```text
src/englishWordBuilderRules.js
```

Nhung khong nen tao dictionary moi. Hay tai su dung dictionary cua Word Chain:

```js
const { normalizeWord, isValidWord } = require('./wordChainRules');
```

Ly do: `wordChainRules.js` da co san logic doc `src/words_alpha.txt`, fallback common words va online Dictionary API. File `src/words_alpha.txt` la word list tu GitHub `dwyl/english-words` ma game Word Chain dang dung.

## 3. Vai tro nguoi choi va luan phien dat chu

Dung role `host` va `guest` cua room de xac dinh vai tro ban dau, nhung khong co dinh ca tran.

Quy tac:

```text
Moi nguoi giu vai tro dat chu trong 3 round lien tiep.
Sau moi 3 round, hai nguoi doi vai cho nhau.
Nguoi dang giu vai firstLetterPlayerId se dat chu cai dau.
Nguoi dang giu vai lastLetterPlayerId se dat chu cai cuoi.
```

Ban dau:

```text
Round 1-3:
host  = nguoi dat chu dau
guest = nguoi dat chu cuoi

Round 4-6:
guest = nguoi dat chu dau
host  = nguoi dat chu cuoi

Round 7-9:
host  = nguoi dat chu dau
guest = nguoi dat chu cuoi

Round 10-12:
guest = nguoi dat chu dau
host  = nguoi dat chu cuoi
```

Cong thuc backend:

```js
const roleBlock = Math.floor((round - 1) / 3);
const swapped = roleBlock % 2 === 1;
firstLetterPlayerId = swapped ? guestId : hostId;
lastLetterPlayerId = swapped ? hostId : guestId;
```

UI khong nen noi "host luon dat chu dau". Hay hien theo tung round:

```text
Ban dat chu dau
Ban dat chu cuoi
Dang cho doi thu dat chu...
```

## 4. Luat choi chi tiet

### 4.1 Phase chon chu cai

Moi round bat dau bang phase:

```text
letter_input
```

Luot nay:

```text
host nhap 1 chu cai: firstLetter
guest nhap 1 chu cai: lastLetter
```

Yeu cau:

```text
Chi cho nhap a-z.
Tu dong lowercase khi gui len server.
Moi nguoi chi thay input cua minh.
Khong broadcast chu cai khi moi chi co 1 nguoi nhap.
Khi ca 2 da nhap xong, server moi reveal firstLetter va lastLetter cho ca hai.
```

Vi du:

```text
host nhap: a
guest nhap: e
Server reveal: A _ _ _ E
Tu hop le: apple, amaze, angle...
```

### 4.2 Phase giai tu

Sau khi reveal chu dau/cuoi, round chuyen sang:

```text
solving
```

Ca hai nguoi cung co the nhap tu. Tu hop le neu:

```text
La tieng Anh co nghia theo isValidWord(word).
Chi gom chu cai a-z.
Do dai toi thieu 3 ky tu.
Bat dau bang firstLetter.
Ket thuc bang lastLetter.
Chua duoc dung trong round/game hien tai neu muon tranh lap tu.
```

Ai submit dung truoc thi thang round va duoc +1 diem.

Sau khi co nguoi thang round:

```text
Server emit ket qua round cho ca hai.
Cho 1.5-2 giay de xem ket qua.
Bat dau round moi o phase letter_input.
```

Ai dat 10 diem truoc thi thang ca game.

## 5. Co che bo qua

Nguoi choi co nut:

```text
Bo qua
```

Nut nay chi hien/enable trong phase `solving`.

### 5.1 Khi mot nguoi bam bo qua

Gia su player A bam `Bo qua`.

Server chuyen round sang:

```text
skip_challenge
```

Luc nay:

```text
Player A da bo qua, khong duoc submit tu nua trong round nay.
Player B co tong cong 20 giay de quyet dinh.
```

20 giay nay chia lam 2 giai doan:

```text
0-10 giay dau: Player B co quyen bam Bo qua.
10-20 giay sau: Player B khong duoc bo qua nua, chi con quyen submit tu.
```

### 5.2 Neu Player B bo qua trong 10 giay dau

Ket qua:

```text
Khong ai duoc diem.
Round ket thuc.
Server bat dau round moi.
```

Day la truong hop ca hai deu thay kho.

### 5.3 Neu Player B khong bo qua trong 10 giay dau

Sau moc 10 giay:

```text
Nut Bo qua cua Player B bi disable.
Player B con 10 giay de viet tu.
```

Neu Player B submit dung:

```text
Player B thang round.
Player B +1 diem.
```

Neu Player B submit sai hoac het 20 giay:

```text
Player B thua round.
Player A +1 diem.
```

Quy uoc nay lam cho nut bo qua co chien thuat: neu ban bo qua som, doi thu co co hoi an diem; neu doi thu khong giai duoc, ban lai duoc diem.

## 6. Co che an input khi ngoi gan nhau

Can co "private input mode" cho ca 2 phase:

```text
Phase letter_input: chu cai moi nguoi nhap phai bi an.
Phase solving: tu nguoi choi dang go phai bi an tren man hinh cua chinh ho neu ho bat che do an.
```

Khuyen nghi UI:

```text
Input chu cai dung type="password" hoac hien dau cham.
Input tu dung type="password" mac dinh.
Co nut icon con mat de nguoi choi tu bat/tat xem input cua minh.
Khong bao gio broadcast noi dung dang go realtime sang doi thu.
Chi gui len server khi bam Submit.
Chi reveal tu da submit sau khi server xac nhan ket qua round.
```

Server khong can biet nguoi choi dang go gi. Server chi nhan:

```text
letter_submit
word_submit
skip
```

## 7. Backend state de xuat

Khi host chon game `english_word_builder`, server tao:

```js
room.selectedGame = GAME_TYPES.ENGLISH_WORD_BUILDER;
room.status = 'playing';
room.gameState = {
  type: 'english_word_builder',
  phase: 'letter_input',
  targetScore: 10,
  round: 1,
  scores: {
    [hostSocketId]: 0,
    [guestSocketId]: 0
  },
  letters: {
    firstBy: hostSocketId,
    lastBy: guestSocketId,
    firstLetter: null,
    lastLetter: null
  },
  usedWords: [],
  roundWinnerId: null,
  skip: {
    skippedBy: null,
    challengedPlayerId: null,
    startedAt: null,
    skipWindowMs: 10000,
    totalMs: 20000,
    timer: null
  },
  roundTimer: null
};
```

## 8. Socket events de xuat

Them vao `src/config.js` va `frontend/src/constants.js`.

Client -> Server:

```js
WORD_BUILDER_SUBMIT_LETTER: 'word_builder_submit_letter'
WORD_BUILDER_SUBMIT_WORD:   'word_builder_submit_word'
WORD_BUILDER_SKIP:          'word_builder_skip'
```

Server -> Client:

```js
WORD_BUILDER_ROUND_STARTED:     'word_builder_round_started'
WORD_BUILDER_LETTER_WAITING:    'word_builder_letter_waiting'
WORD_BUILDER_LETTERS_REVEALED:  'word_builder_letters_revealed'
WORD_BUILDER_SUBMIT_RESULT:     'word_builder_submit_result'
WORD_BUILDER_SKIP_STARTED:      'word_builder_skip_started'
WORD_BUILDER_SKIP_WINDOW_CLOSED:'word_builder_skip_window_closed'
WORD_BUILDER_ROUND_OVER:        'word_builder_round_over'
WORD_BUILDER_SCORE_UPDATE:      'word_builder_score_update'
WORD_BUILDER_GAME_OVER:         'word_builder_game_over'
```

## 9. Payload chi tiet

### 9.1 Submit chu cai

```js
socket.emit(EVENTS.WORD_BUILDER_SUBMIT_LETTER, {
  letter: 'a'
});
```

Server tu biet socket do la host hay guest:

```text
host -> firstLetter
guest -> lastLetter
```

Neu moi co 1 nguoi nhap:

```js
socket.emit(EVENTS.WORD_BUILDER_LETTER_WAITING, {
  submitted: true
});
```

Khi ca 2 nhap xong:

```js
io.to(roomId).emit(EVENTS.WORD_BUILDER_LETTERS_REVEALED, {
  round: 1,
  firstLetter: 'a',
  lastLetter: 'e',
  scores
});
```

### 9.2 Submit tu

```js
socket.emit(EVENTS.WORD_BUILDER_SUBMIT_WORD, {
  word: 'apple'
});
```

Neu sai:

```js
socket.emit(EVENTS.WORD_BUILDER_SUBMIT_RESULT, {
  correct: false,
  reason: 'Tu phai ket thuc bang E'
});
```

Neu dung:

```js
io.to(roomId).emit(EVENTS.WORD_BUILDER_ROUND_OVER, {
  winnerId: socket.id,
  winnerName: player.name,
  word: 'apple',
  reason: 'correct_word',
  scores
});
```

### 9.3 Bo qua

```js
socket.emit(EVENTS.WORD_BUILDER_SKIP);
```

Nguoi dau tien bo qua:

```js
io.to(roomId).emit(EVENTS.WORD_BUILDER_SKIP_STARTED, {
  skippedBy: socket.id,
  skippedByName: player.name,
  challengedPlayerId,
  skipWindowMs: 10000,
  totalMs: 20000,
  startedAt: Date.now()
});
```

Sau 10 giay:

```js
io.to(roomId).emit(EVENTS.WORD_BUILDER_SKIP_WINDOW_CLOSED, {
  challengedPlayerId,
  remainingMs: 10000
});
```

Neu nguoi bi challenge bo qua trong 10 giay dau:

```js
io.to(roomId).emit(EVENTS.WORD_BUILDER_ROUND_OVER, {
  winnerId: null,
  reason: 'both_skipped',
  scores
});
```

Neu nguoi bi challenge het gio hoac submit sai sau 10 giay:

```js
io.to(roomId).emit(EVENTS.WORD_BUILDER_ROUND_OVER, {
  winnerId: skippedBy,
  reason: 'challenge_failed',
  scores
});
```

## 10. Server workflow

### 10.1 Start game

```text
select_game english_word_builder
server init gameState
emit game_started
emit word_builder_round_started
```

`word_builder_round_started` khong gui chu cai nao het:

```js
io.to(roomId).emit(EVENTS.WORD_BUILDER_ROUND_STARTED, {
  round,
  phase: 'letter_input',
  scores,
  firstLetterPlayerId: hostId,
  lastLetterPlayerId: guestId
});
```

### 10.2 Letter phase

```text
Server nhan letter cua host -> luu firstLetter.
Server nhan letter cua guest -> luu lastLetter.
Neu chua du 2 letter -> chi bao nguoi vua submit la da nhan.
Neu du 2 letter -> phase = solving, emit letters_revealed.
```

### 10.3 Normal solving phase

```text
Ca 2 duoc submit word.
Ca 2 duoc bam skip.
Submit dung -> +1 diem, round over.
Submit sai -> bao rieng nguoi submit, cho sua neu van con phase solving.
Skip -> vao skip_challenge.
```

### 10.4 Skip challenge phase

```text
Nguoi skip dau tien bi khoa submit.
Doi thu co 10 giay dau de skip theo.
Neu doi thu skip theo -> round over khong diem.
Sau 10 giay, doi thu khong duoc skip nua.
Doi thu con 10 giay de submit.
Submit dung -> doi thu +1.
Submit sai hoac het gio -> nguoi skip dau tien +1.
```

### 10.5 End round

Sau moi round:

```text
clear timer
update scores
kiem tra targetScore = 10
neu co nguoi dat 10 -> game over
neu chua -> delay 1500ms -> startNextRound
```

## 11. Validation backend

Bat buoc validate tren server:

```text
Room ton tai.
Socket thuoc room.
Room dang selectedGame = english_word_builder.
Game status dang playing.
Letter chi la 1 ky tu a-z.
Host chi duoc set firstLetter.
Guest chi duoc set lastLetter.
Khong cho submit word truoc khi reveal letters.
Word normalize bang normalizeWord(word).
Word phai /^[a-z]{3,}$/.
Word[0] === firstLetter.
Word[word.length - 1] === lastLetter.
Word hop le theo await isValidWord(word).
Khong cho submit sau khi round da over.
Khong cho nguoi da skip submit trong skip_challenge.
Khong cho challenged player skip sau khi skipWindowMs da het.
```

## 12. Frontend UI

Man hinh `EnglishWordBuilderScreen` gom:

```text
Header:
- Ten game: Tao Tu Tieng Anh
- Round hien tai
- Nut Thoat

Scoreboard:
- Diem cua ban
- Diem doi thu
- Target: 10 diem

Letter phase:
- Neu ban la host: input "Nhap chu cai dau"
- Neu ban la guest: input "Nhap chu cai cuoi"
- Input mac dinh bi an
- Nut Gui Chu Cai
- Trang thai: Dang cho doi thu nhap...

Reveal/Solving phase:
- Hien thi mau: A _ _ _ E
- Input nhap tu, mac dinh type=password
- Nut icon mat de hien/an tu cua minh
- Nut Submit
- Nut Bo qua
- Feedback loi rieng cho minh

Skip challenge:
- Banner: "Doi thu da bo qua"
- Countdown 20s
- 10s dau hien nut "Bo qua cung"
- Sau 10s disable nut skip, chi con submit
- Hien text trang thai ro rang

Round result:
- Hien tu dung da submit
- Hien nguoi thang round
- Sau do tu chuyen round moi
```

Can giu chat panel va music player neu cac game khac dang dung chung.

## 13. UX an toan khi 2 nguoi ngoi gan nhau

Yeu cau quan trong:

```text
Khong hien realtime input cua doi thu.
Khong hien chu cai cua doi thu truoc khi ca hai da submit.
Input cua minh nen co che do che dau cham mac dinh.
Co nut hien/an input neu nguoi choi muon kiem tra.
Khi submit, disable input trong luc server validate.
Sai thi chi nguoi submit thay reason.
Dung/round over thi ca hai moi thay tu da thang round.
```

## 14. Edge cases

Can xu ly:

```text
Ca hai chon cap chu cai rat kho, vi du q-z.
Ca hai bo qua -> khong diem, round moi.
Nguoi choi submit lien tuc spam -> server lock khi dang validate.
Dictionary API cham -> can disable submit va hien Dang kiem tra.
Disconnect -> doi thu nhan opponent_disconnected nhu game khac.
Rematch -> reset score ve 0, round ve 1.
Return lobby -> room.status = lobby, selectedGame = null, gameState = null.
```

Khuyen nghi: khong can server tu dam bao cap chu cai co ton tai tu trong version dau, vi chu cai do do nguoi choi dat. Neu muon hay hon o version sau, server co the check trong `words_alpha.txt` xem co it nhat 1 tu hop le voi cap first/last hay khong; neu khong co thi yeu cau chon lai.

## 15. Pseudocode backend

```js
async function handleWordBuilderSubmitWord(socket, payload) {
  const room = getRoom(socket.roomId);
  const gs = room?.gameState;
  if (!room || room.selectedGame !== GAME_TYPES.ENGLISH_WORD_BUILDER) return;
  if (!['solving', 'skip_challenge'].includes(gs.phase)) return;

  const playerId = socket.id;
  const word = normalizeWord(payload.word);

  if (gs.phase === 'skip_challenge' && playerId === gs.skip.skippedBy) {
    return socket.emit(EVENTS.WORD_BUILDER_SUBMIT_RESULT, {
      correct: false,
      reason: 'Ban da bo qua round nay'
    });
  }

  const invalidReason = await validateBuilderWord(word, gs.letters);
  if (invalidReason) {
    if (gs.phase === 'skip_challenge' && playerId === gs.skip.challengedPlayerId) {
      return awardRound(room, gs.skip.skippedBy, 'challenge_failed');
    }
    return socket.emit(EVENTS.WORD_BUILDER_SUBMIT_RESULT, {
      correct: false,
      reason: invalidReason
    });
  }

  awardRound(room, playerId, 'correct_word', word);
}
```

## 16. Definition of Done

Game duoc xem la xong ban dau khi:

```text
Lobby co the chon Tao Tu Tieng Anh.
2 nguoi vao game duoc.
Host nhap chu dau, guest nhap chu cuoi.
Chu cai bi an cho toi khi ca hai cung submit.
Sau khi reveal, ca hai cung co the submit tu.
Tu dung duoc validate bang dictionary Word Chain hien co.
Tu sai bao loi rieng nguoi submit.
Nguoi submit dung truoc duoc +1 diem.
Nut Bo qua dung theo rule 20s / 10s dau.
Nguoi thang 10 diem truoc nhan modal game over.
Co the choi lai hoac quay ve lobby nhu cac game khac.
Khong lam hong Caro, Sentence Scramble, Word Chain.
Test bang 2 tab browser localhost:3001.
```

## 17. Prompt ngan de dua cho AI khac

```text
Hay them game moi "TAO TU TIENG ANH" vao project CỜ CARO realtime.

Game type moi la english_word_builder. Game nay dung chung lobby/socket/room voi cac game hien co. Tai su dung dictionary cua Word Chain trong src/wordChainRules.js, cu the la normalizeWord va isValidWord, khong tao dictionary moi.

Luat chinh: moi round co 2 nguoi cung dat dieu kien cho tu can tao. Mot nguoi nhap chu cai dau, nguoi con lai nhap chu cai cuoi. Hai input nay phai bi an/private, khong hien cho doi thu va chi reveal khi ca hai da submit xong. Sau khi reveal, ca hai dua nhau viet mot tu tieng Anh co nghia bat dau bang chu dau va ket thuc bang chu cuoi. Ai submit dung truoc duoc 1 diem. Ai dat 10 diem truoc thang game.

Luat luan phien dat chu: khong duoc co dinh host luon dat chu dau va guest luon dat chu cuoi. Hai nguoi phai doi vai sau moi 3 round. Ban dau round 1-3: host dat chu dau, guest dat chu cuoi. Round 4-6: guest dat chu dau, host dat chu cuoi. Round 7-9: host dat chu dau, guest dat chu cuoi. Round 10-12: guest dat chu dau, host dat chu cuoi. Tiep tuc theo pattern nay cho den khi co nguoi dat 10 diem.

Cong thuc backend de tinh vai theo round:
const roleBlock = Math.floor((round - 1) / 3);
const swapped = roleBlock % 2 === 1;
firstLetterPlayerId = swapped ? guestId : hostId;
lastLetterPlayerId = swapped ? hostId : guestId;

Server phai gui firstLetterPlayerId va lastLetterPlayerId trong event bat dau round de frontend biet nguoi choi nao nhap chu dau/cuoi. UI khong duoc ghi cung "host dat chu dau"; phai hien theo round: "Ban dat chu dau", "Ban dat chu cuoi", hoac "Dang cho doi thu dat chu".

Co nut Bo qua trong phase solving. Neu mot nguoi bo qua, nguoi con lai co 20 giay. Trong 10 giay dau nguoi con lai co the bo qua luon; neu bo qua thi round moi, khong ai duoc diem. Sau 10 giay, nut bo qua bi khoa, nguoi con lai co 10 giay de submit. Neu submit dung thi nguoi do +1 diem. Neu submit sai hoac het gio thi nguoi da bo qua truoc +1 diem.

Can tao backend gameState rieng, socket events rieng, component EnglishWordBuilderScreen, UI co input an/private mode, scoreboard target 10, round result, rematch/lobby flow. Backend phai validate server-side: room ton tai, socket thuoc room, letter la 1 ky tu a-z, word bat dau/ket thuc dung chu cai, word hop le theo isValidWord, khong cho submit sau khi round ket thuc. Khong lam hong Caro, Sentence Scramble va Word Chain.
```
