// Direct streaming music URLs for Hayd's tracks and user's custom MP3
export const HAYD_TRACKS = [
  {
    title: 'Where We Started (Your Custom Song) ⚡',
    artist: 'Lost Sky ft. Jex',
    url: '/bgm.mp3', // Plays the local bgm.mp3 file directly!
  },
  {
    title: 'Head In The Clouds',
    artist: 'Hayd',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
  },
  {
    title: 'Closure',
    artist: 'Hayd',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
  },
  {
    title: 'How Long, How Low?',
    artist: 'Hayd, Chance Peña',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
  },
  {
    title: 'What Did I Do?',
    artist: 'Hayd',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3',
  },
  {
    title: 'All of the Stars',
    artist: 'Hayd',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3',
  },
  {
    title: 'Changes',
    artist: 'Hayd',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3',
  },
  {
    title: 'When You Were Mine',
    artist: 'Hayd',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3',
  },
  {
    title: 'Lost',
    artist: 'Hayd',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3',
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
