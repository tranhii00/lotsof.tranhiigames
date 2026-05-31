// Highly optimized Retro Arcade Sound FX using Web Audio API with Volume Control
let ctx = null;
let globalSfxVolume = Number(localStorage.getItem('sfxVolume') || '50') / 100; // Load local volume

function getContext() {
  if (!ctx) {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (ctx.state === 'suspended') {
    ctx.resume();
  }
  return ctx;
}

export const sfx = {
  // Update sound effect volume (value between 0.0 and 1.0)
  setVolume(vol) {
    globalSfxVolume = Math.max(0, Math.min(1, vol));
    localStorage.setItem('sfxVolume', Math.round(globalSfxVolume * 100).toString());
  },

  getVolume() {
    return globalSfxVolume;
  },

  // Click/Move sound
  playMove(isX) {
    try {
      const c = getContext();
      const osc = c.createOscillator();
      const gain = c.createGain();

      osc.connect(gain);
      gain.connect(c.destination);

      osc.type = isX ? 'triangle' : 'sine';
      osc.frequency.setValueAtTime(isX ? 523.25 : 392.00, c.currentTime);
      osc.frequency.exponentialRampToValueAtTime(isX ? 783.99 : 261.63, c.currentTime + 0.08);

      // Boosted base multiplier from 0.12 to 0.85 for clear, punchy sound
      gain.gain.setValueAtTime(0.85 * globalSfxVolume, c.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.12);

      osc.start();
      osc.stop(c.currentTime + 0.12);
    } catch (e) {
      console.warn('SFX failed', e);
    }
  },

  // Winning fanfare (uplifting chord progression)
  playWin() {
    try {
      const c = getContext();
      const notes = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99, 1046.50];
      notes.forEach((freq, index) => {
        const time = c.currentTime + index * 0.08;
        const osc = c.createOscillator();
        const gain = c.createGain();

        osc.connect(gain);
        gain.connect(c.destination);

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, time);

        // Boosted base multiplier from 0.1 to 0.7 for triumphant volume
        gain.gain.setValueAtTime(0.7 * globalSfxVolume, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.45);

        osc.start(time);
        osc.stop(time + 0.5);
      });
    } catch (e) {}
  },

  // Losing sound (sad descending chord)
  playLose() {
    try {
      const c = getContext();
      const notes = [392.00, 349.23, 311.13, 246.94];
      notes.forEach((freq, index) => {
        const time = c.currentTime + index * 0.15;
        const osc = c.createOscillator();
        const gain = c.createGain();

        osc.connect(gain);
        gain.connect(c.destination);

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, time);

        // Boosted base multiplier from 0.08 to 0.6 for rich volume
        gain.gain.setValueAtTime(0.6 * globalSfxVolume, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.55);

        osc.start(time);
        osc.stop(time + 0.6);
      });
    } catch (e) {}
  },

  // Ticking warnings for low time (<= 10 seconds)
  playTick() {
    try {
      const c = getContext();
      const osc = c.createOscillator();
      const gain = c.createGain();

      osc.connect(gain);
      gain.connect(c.destination);

      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, c.currentTime);

      // Boosted base multiplier from 0.05 to 0.45
      gain.gain.setValueAtTime(0.45 * globalSfxVolume, c.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.04);

      osc.start();
      osc.stop(c.currentTime + 0.05);
    } catch (e) {}
  },

  // Timeout buzzer sound
  playBuzzer() {
    try {
      const c = getContext();
      const osc = c.createOscillator();
      const gain = c.createGain();

      osc.connect(gain);
      gain.connect(c.destination);

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(110.00, c.currentTime);
      osc.frequency.linearRampToValueAtTime(85.00, c.currentTime + 0.35);

      // Boosted base multiplier from 0.15 to 0.85
      gain.gain.setValueAtTime(0.85 * globalSfxVolume, c.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.4);

      osc.start();
      osc.stop(c.currentTime + 0.4);
    } catch (e) {}
  },

  // Chat message sound (clean notification ping)
  playChat() {
    try {
      const c = getContext();
      const osc = c.createOscillator();
      const gain = c.createGain();

      osc.connect(gain);
      gain.connect(c.destination);

      osc.type = 'sine';
      osc.frequency.setValueAtTime(987.77, c.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1318.51, c.currentTime + 0.08);

      // Boosted base multiplier from 0.07 to 0.5
      gain.gain.setValueAtTime(0.5 * globalSfxVolume, c.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.15);

      osc.start();
      osc.stop(c.currentTime + 0.15);
    } catch (e) {}
  },

  // Play Valorant Match Found sound
  playMatchFound() {
    try {
      const audio = new Audio('/match-found-valorant.mp3');
      audio.volume = globalSfxVolume;
      audio.play().catch(err => console.warn("Audio autoplay blocked or failed:", err));
    } catch (e) {
      console.warn('Failed to play match-found sfx:', e);
    }
  },

  // Play electronic countdown beeps (3, 2, 1, GO!)
  playCountdownBeep(isGo = false) {
    try {
      const c = getContext();
      const osc = c.createOscillator();
      const gain = c.createGain();

      osc.connect(gain);
      gain.connect(c.destination);

      osc.type = 'sine';
      osc.frequency.setValueAtTime(isGo ? 987.77 : 493.88, c.currentTime);

      gain.gain.setValueAtTime((isGo ? 0.8 : 0.65) * globalSfxVolume, c.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + (isGo ? 0.45 : 0.15));

      osc.start();
      osc.stop(c.currentTime + (isGo ? 0.5 : 0.2));
    } catch (e) {}
  }
};
