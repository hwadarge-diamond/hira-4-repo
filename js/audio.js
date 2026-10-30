// RUN AND RUN: NETAJI IN EUROPE - Procedural Web Audio Engine
// Upbeat European street carnival meets lively desi dhol rhythm & cartoon SFX
class SoundEngine {
  constructor() {
    this.ctx = null;
    this.isMuted = false;
    this.musicMuted = false;
    this.sfxMuted = false;
    this.masterVolume = 0.8;
    this.musicVolume = 0.55;
    this.sfxVolume = 0.8;

    this.masterGain = null;
    this.musicGain = null;
    this.sfxGain = null;
    this.musicFilter = null;

    this.isPlayingMusic = false;
    this.tempo = 132;
    this.currentStep = 0;
    this.stepTimer = null;
    this.isBulletTime = false;
    this.crowdAlertActive = false;
    this.consecutiveCoins = 0;
    this.lastCoinTime = 0;

    this.noiseBuffer = null;
    this.jetpackSource = null;
    this.jetpackGain = null;

    // Upbeat Major / Bhangra Pentatonic scale in Hz
    this.notes = {
      D2: 73.42, G2: 98.0, A2: 110.0, B2: 123.47,
      D3: 146.83, E3: 164.81, Fs3: 185.0, G3: 196.0, A3: 220.0, B3: 246.94,
      D4: 293.66, E4: 329.63, Fs4: 369.99, G4: 392.0, A4: 440.0, B4: 493.88,
      D5: 587.33, E5: 659.25, Fs5: 739.99
    };

    // Bouncy street bassline (ump-pa-ump-pa European polka / dhol bounce)
    this.bassPattern = [
      'D2', null, 'A2', null, 'D2', null, 'G2', null,
      'D2', null, 'A2', null, 'B2', null, 'A2', null
    ];

    // Cheerful street accordion / brass lead melody
    this.leadPattern = [
      'D4', 'Fs4', 'A4', 'D5', 'A4', 'Fs4', 'G4', 'B4',
      'A4', 'Fs4', 'E4', 'Fs4', 'D4', null, 'D4', null
    ];
  }

  init() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') this.ctx.resume();
      return;
    }

    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.masterVolume, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      this.musicFilter = this.ctx.createBiquadFilter();
      this.musicFilter.type = 'lowpass';
      this.musicFilter.frequency.setValueAtTime(14000, this.ctx.currentTime);
      this.musicFilter.Q.setValueAtTime(1.2, this.ctx.currentTime);

      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.setValueAtTime(this.musicVolume, this.ctx.currentTime);
      this.musicFilter.connect(this.musicGain);
      this.musicGain.connect(this.masterGain);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.setValueAtTime(this.sfxVolume, this.ctx.currentTime);
      this.sfxGain.connect(this.masterGain);

      const bufferSize = this.ctx.sampleRate * 2;
      this.noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = this.noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }
    } catch (e) {}
  }

  setMasterVolume(val) {
    this.masterVolume = Math.max(0, Math.min(1, val));
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.masterVolume, this.ctx.currentTime);
    }
  }

  setMusicVolume(val) {
    this.musicVolume = Math.max(0, Math.min(1, val));
    if (this.musicGain && this.ctx) {
      this.musicGain.gain.setValueAtTime(this.musicMuted ? 0 : this.musicVolume, this.ctx.currentTime);
    }
  }

  setSfxVolume(val) {
    this.sfxVolume = Math.max(0, Math.min(1, val));
    if (this.sfxGain && this.ctx) {
      this.sfxGain.gain.setValueAtTime(this.sfxMuted ? 0 : this.sfxVolume, this.ctx.currentTime);
    }
  }

  startMusic() {
    this.init();
    if (!this.ctx || this.isPlayingMusic) return;
    this.isPlayingMusic = true;
    this.currentStep = 0;
    this.scheduleNextStep();
  }

  stopMusic() {
    this.isPlayingMusic = false;
    if (this.stepTimer) {
      clearTimeout(this.stepTimer);
      this.stepTimer = null;
    }
  }

  setBulletTime(active) {
    this.isBulletTime = active;
    if (!this.ctx || !this.musicFilter) return;
    const now = this.ctx.currentTime;
    if (active) {
      this.musicFilter.frequency.cancelScheduledValues(now);
      this.musicFilter.frequency.exponentialRampToValueAtTime(500, now + 0.15);
      this.musicFilter.Q.exponentialRampToValueAtTime(3.5, now + 0.15);
    } else {
      this.musicFilter.frequency.cancelScheduledValues(now);
      this.musicFilter.frequency.exponentialRampToValueAtTime(14000, now + 0.3);
      this.musicFilter.Q.exponentialRampToValueAtTime(1.2, now + 0.3);
    }
  }

  setGameSpeed(speedMultiplier) {
    const targetBpm = Math.min(154, 132 + (speedMultiplier - 1) * 14);
    this.tempo = targetBpm;
  }

  setHunterAlert(active) {
    this.crowdAlertActive = active;
  }

  scheduleNextStep() {
    if (!this.isPlayingMusic || !this.ctx) return;
    const effectiveTempo = this.isBulletTime ? this.tempo * 0.45 : this.tempo;
    const stepDuration = (60 / effectiveTempo) / 4;

    const now = this.ctx.currentTime;
    this.playMusicStep(this.currentStep, now);

    this.currentStep = (this.currentStep + 1) % 16;
    const ms = stepDuration * 1000;
    this.stepTimer = setTimeout(() => this.scheduleNextStep(), ms);
  }

  playMusicStep(step, time) {
    if (this.musicMuted || !this.ctx) return;

    // Dhol bass thump on beats
    if (step % 4 === 0) {
      this.playDholThump(time);
    } else if (step % 4 === 2) {
      this.playSnappyClap(time);
    }

    // Hi-hat / tambourine jingle
    if (step % 2 === 1) {
      this.playTambourine(time);
    }

    // Bouncy accordion bass
    const bassNote = this.bassPattern[step];
    if (bassNote && this.notes[bassNote]) {
      this.playAccordionBass(time, this.notes[bassNote]);
    }

    // Street accordion lead
    const leadNote = this.leadPattern[step];
    if (leadNote && this.notes[leadNote]) {
      this.playAccordionLead(time, this.notes[leadNote]);
    }

    // Crowd whistle on danger alert
    if (this.crowdAlertActive && step === 0) {
      this.playCrowdWhistle(time);
    }
  }

  playDholThump(time) {
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(160, time);
      osc.frequency.exponentialRampToValueAtTime(45, time + 0.14);

      gain.gain.setValueAtTime(0.65, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.16);

      osc.connect(gain);
      gain.connect(this.musicFilter);
      osc.start(time);
      osc.stop(time + 0.17);
    } catch (e) {}
  }

  playSnappyClap(time) {
    try {
      if (!this.noiseBuffer) return;
      const noise = this.ctx.createBufferSource();
      noise.buffer = this.noiseBuffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1400, time);
      filter.Q.setValueAtTime(2.0, time);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.3, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.12);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.musicFilter);
      noise.start(time);
      noise.stop(time + 0.13);
    } catch (e) {}
  }

  playTambourine(time) {
    try {
      if (!this.noiseBuffer) return;
      const noise = this.ctx.createBufferSource();
      noise.buffer = this.noiseBuffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.setValueAtTime(6500, time);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.12, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.04);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.musicFilter);
      noise.start(time);
      noise.stop(time + 0.05);
    } catch (e) {}
  }

  playAccordionBass(time, freq) {
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, time);

      gain.gain.setValueAtTime(0.32, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.15);

      osc.connect(gain);
      gain.connect(this.musicFilter);
      osc.start(time);
      osc.stop(time + 0.16);
    } catch (e) {}
  }

  playAccordionLead(time, freq) {
    try {
      // Dual detuned oscillator for lively European accordion reed vibrato
      [0, 4].forEach(detune => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, time);
        osc.detune.setValueAtTime(detune, time);

        gain.gain.setValueAtTime(0.09, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.18);

        osc.connect(gain);
        gain.connect(this.musicFilter);
        osc.start(time);
        osc.stop(time + 0.2);
      });
    } catch (e) {}
  }

  playCrowdWhistle(time) {
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(900, time);
      osc.frequency.linearRampToValueAtTime(1400, time + 0.12);
      osc.frequency.linearRampToValueAtTime(800, time + 0.25);

      gain.gain.setValueAtTime(0.18, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.28);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(time);
      osc.stop(time + 0.3);
    } catch (e) {}
  }

  // SFX
  playJump() {
    this.init();
    if (this.sfxMuted || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(260, now);
      osc.frequency.exponentialRampToValueAtTime(750, now + 0.14);

      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now);
      osc.stop(now + 0.17);
    } catch (e) {}
  }

  playSlide() {
    this.init();
    if (this.sfxMuted || !this.ctx || !this.noiseBuffer) return;
    try {
      const now = this.ctx.currentTime;
      const noise = this.ctx.createBufferSource();
      noise.buffer = this.noiseBuffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1800, now);
      filter.frequency.exponentialRampToValueAtTime(500, now + 0.22);
      filter.Q.setValueAtTime(1.5, now);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.28, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.sfxGain);
      noise.start(now);
      noise.stop(now + 0.26);
    } catch (e) {}
  }

  playLaneSwitch() {
    this.init();
    if (this.sfxMuted || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(340, now);
      osc.frequency.exponentialRampToValueAtTime(580, now + 0.05);
      osc.frequency.exponentialRampToValueAtTime(260, now + 0.1);

      gain.gain.setValueAtTime(0.22, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.11);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now);
      osc.stop(now + 0.12);
    } catch (e) {}
  }

  playFormShift(form) {
    this.init();
    if (this.sfxMuted || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const freq = form === 'DRONE' ? 880 : form === 'ORB' ? 440 : 660;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.5, now + 0.1);

      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now);
      osc.stop(now + 0.19);
    } catch (e) {}
  }

  playGravityFlip() {
    this.init();
    if (this.sfxMuted || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(100, now);
      osc.frequency.exponentialRampToValueAtTime(280, now + 0.14);
      osc.frequency.exponentialRampToValueAtTime(50, now + 0.3);

      gain.gain.setValueAtTime(0.45, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.32);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now);
      osc.stop(now + 0.34);
    } catch (e) {}
  }

  playCoin() {
    this.init();
    if (this.sfxMuted || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      if (now - this.lastCoinTime < 0.6) {
        this.consecutiveCoins = Math.min(10, this.consecutiveCoins + 1);
      } else {
        this.consecutiveCoins = 0;
      }
      this.lastCoinTime = now;

      const scale = [523.25, 587.33, 659.25, 783.99, 880.0, 1046.5];
      const pitch = scale[this.consecutiveCoins % scale.length];

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(pitch, now);
      osc.frequency.exponentialRampToValueAtTime(pitch * 1.4, now + 0.08);

      gain.gain.setValueAtTime(0.24, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now);
      osc.stop(now + 0.15);
    } catch (e) {}
  }

  playPowerup() {
    this.init();
    if (this.sfxMuted || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      [440, 554.37, 659.25, 880].forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const startTime = now + idx * 0.05;

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, startTime);
        gain.gain.setValueAtTime(0.2, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.15);

        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(startTime);
        osc.stop(startTime + 0.16);
      });
    } catch (e) {}
  }

  playNearMiss() {
    this.init();
    if (this.sfxMuted || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1300, now);
      osc.frequency.exponentialRampToValueAtTime(350, now + 0.16);

      gain.gain.setValueAtTime(0.28, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now);
      osc.stop(now + 0.19);
    } catch (e) {}
  }

  playShieldCrack() {
    this.init();
    if (this.sfxMuted || !this.ctx || !this.noiseBuffer) return;
    try {
      const now = this.ctx.currentTime;
      const noise = this.ctx.createBufferSource();
      noise.buffer = this.noiseBuffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.setValueAtTime(1200, now);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.4, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.32);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.sfxGain);
      noise.start(now);
      noise.stop(now + 0.33);
    } catch (e) {}
  }

  playImpact() {
    this.init();
    if (this.sfxMuted || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(120, now);
      osc.frequency.exponentialRampToValueAtTime(30, now + 0.3);

      gain.gain.setValueAtTime(0.5, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now);
      osc.stop(now + 0.36);
    } catch (e) {}
  }

  startJetpackLoop() {
    this.init();
    if (this.sfxMuted || !this.ctx || this.jetpackSource || !this.noiseBuffer) return;
    try {
      const now = this.ctx.currentTime;
      this.jetpackSource = this.ctx.createBufferSource();
      this.jetpackSource.buffer = this.noiseBuffer;
      this.jetpackSource.loop = true;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1600, now);

      this.jetpackGain = this.ctx.createGain();
      this.jetpackGain.gain.setValueAtTime(0.2, now);

      this.jetpackSource.connect(filter);
      filter.connect(this.jetpackGain);
      this.jetpackGain.connect(this.sfxGain);
      this.jetpackSource.start(now);
    } catch (e) {}
  }

  stopJetpackLoop() {
    if (this.jetpackGain && this.ctx) {
      try {
        const now = this.ctx.currentTime;
        this.jetpackGain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
        setTimeout(() => {
          if (this.jetpackSource) {
            try { this.jetpackSource.stop(); } catch (e) {}
            this.jetpackSource = null;
            this.jetpackGain = null;
          }
        }, 160);
      } catch (e) {
        this.jetpackSource = null;
      }
    }
  }

  playGameOver() {
    this.init();
    if (this.sfxMuted || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.exponentialRampToValueAtTime(50, now + 0.7);

      gain.gain.setValueAtTime(0.4, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.75);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now);
      osc.stop(now + 0.8);
    } catch (e) {}
  }

  playUIClick() {
    this.init();
    if (this.sfxMuted || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.exponentialRampToValueAtTime(1200, now + 0.04);

      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now);
      osc.stop(now + 0.06);
    } catch (e) {}
  }
}

export const audio = new SoundEngine();
