// Direct streaming music URLs for user's custom MP3
export const HAYD_TRACKS = [
  {
    title: 'Where We Started (Your Custom Song) ⚡',
    artist: 'Lost Sky ft. Jex',
    url: '/bgm.mp3', // Plays the local bgm.mp3 file directly!
  }
];

class BGMController {
  constructor() {
    this.audio = new Audio();
    this.audio.loop = true;
    this.audio.volume = Number(localStorage.getItem('bgmVolume') || '35') / 100; // Load local BGM volume
    this.trackIndex = 0;
  }

  setVolume(vol) {
    this.audio.volume = Math.max(0, Math.min(1, vol));
    localStorage.setItem('bgmVolume', Math.round(this.audio.volume * 100).toString());
  }

  loadTrack(index) {
    if (index < 0 || index >= HAYD_TRACKS.length) return;
    this.trackIndex = index;
    const wasPlaying = !this.audio.paused;
    this.audio.src = HAYD_TRACKS[index].url;
    if (wasPlaying) {
      this.audio.play().catch(() => {});
    }
  }

  play() {
    if (!this.audio.src) {
      this.loadTrack(this.trackIndex);
    }
    this.audio.play().catch(() => {});
  }

  pause() {
    this.audio.pause();
  }

  seek(seconds) {
    this.audio.currentTime = seconds;
  }

  getCurrentTime() {
    return this.audio.currentTime;
  }

  isPlaying() {
    return !this.audio.paused;
  }
}

export const bgm = new BGMController();
