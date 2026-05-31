import { useState, useEffect, useRef } from 'react';
import { bgm, HAYD_TRACKS } from '../utils/bgm';
import { sfx } from '../utils/sfx';
import styles from './MusicPlayer.module.css';

export default function MusicPlayer() {
  const [trackIndex, setTrackIndex] = useState(0);
  const [playing, setPlaying] = useState(true); // Default ON
  
  // Local volume states (completely independent)
  const [bgmVolume, setBgmVolume] = useState(() => Number(localStorage.getItem('bgmVolume') || '35'));
  const [sfxVolume, setSfxVolume] = useState(() => Number(localStorage.getItem('sfxVolume') || '50'));

  // Use a Ref to hold the synchronous state of 'playing' for event listeners
  const playingRef = useRef(true);

  // One-time setup
  useEffect(() => {
    bgm.loadTrack(0);
    bgm.setVolume(bgmVolume / 100);
    sfx.setVolume(sfxVolume / 100);
    
    // The healer: if it's supposed to be playing but it's paused, play it on user interaction
    const unlockAudio = () => {
      if (playingRef.current && bgm.audio.paused) {
        bgm.play();
      }
    };

    // Attempt to play immediately (may fail if blocked by browser autoplay policy)
    bgm.play();

    // 🌟 Ultra-Healer: Bind to every possible early interaction to guarantee instant unlock
    const evts = ['click', 'mousedown', 'touchstart', 'keydown'];
    evts.forEach(e => window.addEventListener(e, unlockAudio));

    return () => {
      evts.forEach(e => window.removeEventListener(e, unlockAudio));
    };
  }, []); // Run ONLY once on mount

  const handlePlayPause = (e) => {
    e.stopPropagation(); // Prevent this click from bubbling to the global unlocker
    const nextPlay = !playing;
    setPlaying(nextPlay);
    playingRef.current = nextPlay; // Update ref synchronously
    
    if (nextPlay) {
      bgm.play();
    } else {
      bgm.pause();
    }
  };

  const handleNext = () => {
    const nextIdx = (trackIndex + 1) % HAYD_TRACKS.length;
    setTrackIndex(nextIdx);
    bgm.loadTrack(nextIdx);
    setPlaying(true);
    playingRef.current = true;
    bgm.play();
  };

  const handlePrev = () => {
    const prevIdx = (trackIndex - 1 + HAYD_TRACKS.length) % HAYD_TRACKS.length;
    setTrackIndex(prevIdx);
    bgm.loadTrack(prevIdx);
    setPlaying(true);
    playingRef.current = true;
    bgm.play();
  };

  const handleBgmVolume = (e) => {
    const v = Number(e.target.value);
    setBgmVolume(v);
    bgm.setVolume(v / 100);
  };

  const handleSfxVolume = (e) => {
    const v = Number(e.target.value);
    setSfxVolume(v);
    sfx.setVolume(v / 100);
  };

  const currentTrack = HAYD_TRACKS[trackIndex];

  return (
    <div className={styles.player}>
      <div className={styles.trackInfo}>
        <span className={styles.note}>🎵 BGM:</span>
        <div className={styles.marquee}>
          <span className={styles.title}>{currentTrack.title}</span>
          <span className={styles.artist}> - {currentTrack.artist}</span>
        </div>
      </div>

      <div className={styles.controls}>
        <button onClick={handlePlayPause} className={`${styles.btn} ${styles.playBtn}`} style={{ padding: '6px 12px', fontSize: '0.85rem' }} title={playing ? 'Tạm dừng BGM' : 'Chạy BGM'}>
          {playing ? 'TẠM DỪNG BGM ⏸' : 'BẬT NHẠC NỀN ▶'}
        </button>
      </div>

      <div className={styles.volRow}>
        <span className={styles.volIcon} title="Âm lượng nhạc nền">📻 BGM</span>
        <input
          type="range"
          min="0"
          max="100"
          value={bgmVolume}
          onChange={handleBgmVolume}
          className={styles.slider}
        />
        <span className={styles.volPct}>{bgmVolume}%</span>
      </div>

      <div className={styles.volRow}>
        <span className={styles.volIcon} title="Âm lượng hiệu ứng âm thanh">🔊 SFX</span>
        <input
          type="range"
          min="0"
          max="100"
          value={sfxVolume}
          onChange={handleSfxVolume}
          className={styles.slider}
        />
        <span className={styles.volPct}>{sfxVolume}%</span>
      </div>
    </div>
  );
}
