import { useGameSocket } from './hooks/useGameSocket';
import ConnectionBanner from './components/ConnectionBanner';
import MenuScreen from './components/MenuScreen';
import WaitingScreen from './components/WaitingScreen';
import GameScreen from './components/GameScreen';
import LobbyScreen from './components/LobbyScreen';
import SentenceScrambleScreen from './components/SentenceScrambleScreen';
import WordChainScreen from './components/WordChainScreen';
import EnglishWordBuilderScreen from './components/EnglishWordBuilderScreen';
import Modal from './components/Modal';
import MusicPlayer from './components/MusicPlayer';
import MatchFoundOverlay from './components/MatchFoundOverlay';
import CountdownOverlay from './components/CountdownOverlay';
import MatchmakingCountdownOverlay from './components/MatchmakingCountdownOverlay';
import RulesReadyScreen from './components/RulesReadyScreen';
import styles from './App.module.css';

export default function App() {
  const {
    connStatus, screen, myName, myAvatar, setMyAvatar,
    myRole, roomId, opponentName, lobbyInfo, socketId,
    board, currentTurn, timerInfo, turnDuration,
    ssState, wcState, ewbState,
    chatMsgs, modal, joinError,
    lastMove, winningLine, rematchStatus, lobbyStatus,
    showMatchFound, rulesGameType, readyStatus, countdownNumber, showCountdown, matchmakingCountdown,
    actions,
  } = useGameSocket();

  return (
    <div className={styles.appContainer}>
      <ConnectionBanner status={connStatus} />

      {/* Render BGM Player permanently in the root — NEVER unmounts, plays continuously through menu/waiting/game screens */}
      <div className={styles.musicOverlay}>
        <MusicPlayer />
      </div>

      {matchmakingCountdown && (
        <MatchmakingCountdownOverlay number={matchmakingCountdown} />
      )}

      {showMatchFound && (
        <MatchFoundOverlay opponentName={opponentName} />
      )}

      {showCountdown && (
        <CountdownOverlay number={countdownNumber} />
      )}

      {screen === 'menu' && (
        <MenuScreen
          myName={myName}
          onCreateRoom={(name, av) => {
            setMyAvatar(av);
            actions.createRoom(name, av);
          }}
          onJoinRoom={(name, rid, av) => {
            setMyAvatar(av);
            actions.joinRoom(name, rid, av);
          }}
          joinError={joinError}
        />
      )}

      {screen === 'waiting' && (
        <WaitingScreen
          myName={myName}
          myAvatar={myAvatar}
          roomId={roomId}
          onCancel={actions.cancelWait}
        />
      )}

      {screen === 'lobby' && lobbyInfo && (
        <LobbyScreen
          roomId={roomId}
          lobbyInfo={lobbyInfo}
          myRole={myRole}
          onSelectGame={actions.selectGame}
          onLeave={actions.leaveRoom}
        />
      )}

      {screen === 'caro' && (
        <GameScreen
          myRole={myRole}
          myName={myName}
          opponentName={opponentName}
          lobbyInfo={lobbyInfo}
          board={board}
          currentTurn={currentTurn}
          timerInfo={timerInfo}
          turnDuration={turnDuration}
          chatMsgs={chatMsgs}
          lastMove={lastMove}
          winningLine={winningLine}
          onMove={actions.makeMove}
          onChat={actions.sendChat}
          onLeave={actions.leaveRoom}
        />
      )}

      {screen === 'sentence_scramble' && (
        <SentenceScrambleScreen
          ssState={ssState}
          lobbyInfo={lobbyInfo}
          myRole={myRole}
          onSubmit={actions.submitSentence}
          onLeave={actions.leaveRoom}
          onChat={actions.sendChat}
          chatMsgs={chatMsgs}
        />
      )}

      {screen === 'word_chain' && (
        <WordChainScreen
          wcState={wcState}
          lobbyInfo={lobbyInfo}
          myRole={myRole}
          onSubmit={actions.submitWord}
          onLeave={actions.leaveRoom}
          onChat={actions.sendChat}
          chatMsgs={chatMsgs}
          timerInfo={timerInfo}
        />
      )}

      {screen === 'english_word_builder' && (
        <EnglishWordBuilderScreen
          ewbState={ewbState}
          lobbyInfo={lobbyInfo}
          myRole={myRole}
          socketId={socketId}
          onSubmitLetter={actions.submitEwbLetter}
          onSubmitWord={actions.submitEwbWord}
          onSkip={actions.skipEwb}
          onLeave={actions.leaveRoom}
          onChat={actions.sendChat}
          chatMsgs={chatMsgs}
        />
      )}

      {screen === 'rules_ready' && rulesGameType && (
        <RulesReadyScreen
          gameType={rulesGameType}
          readyStatus={readyStatus}
          lobbyInfo={lobbyInfo}
          socketId={socketId}
          onReady={actions.playerReady}
        />
      )}

      {modal && (
        <Modal
          emoji={modal.emoji}
          title={modal.title}
          msg={modal.msg}
          type={modal.type}
          onClose={actions.closeModal}
          onRematch={actions.requestRematch}
          rematchStatus={rematchStatus}
          onBackToLobby={actions.requestLobby}
          lobbyStatus={lobbyStatus}
        />
      )}
    </div>
  );
}
