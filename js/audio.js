// RUN AND RUN - Audio Engine (Procedural Web Audio API)
// 100% synthesized SFX & adaptive cyberpunk synthwave music

class SoundEngine {
  constructor() {
    this.ctx = null;
    this.isMuted = false;
    this.musicMuted = false;
    this.sfxMuted = false;
    this.masterVolume = 0.8;
    this.musicVolume = 0.5;
    this.sfxVolume = 0.8;

    this.masterGain = null;
    this.musicGain = null;
    this.sfxGain = null;
    this.musicFilter = null;

    // Music sequencer state
    this.isPlayingMusic = false;
    this.tempo = 126; // BPM
    this.currentStep = 0;
    this.stepTimer = null;
    this.isBulletTime = false;
    this.hunterAlertActive = false;
    this.consecutiveCoins = 0;
    this.lastCoinTime = 0;

    // Noise buffer for percussion and swooshes
    this.noiseBuffer = null;
    // Jetpack loop oscillator
    this.jetpackSource = null;
    this.jetpackGain = null;

    // Scale notes in Hz (D minor pentatonic / synthwave Dorian)
    this.notes = {
      D1: 36.71, A1: 55.0, D2: 73.42, F2: 87.31, G2: 98.0, A2: 110.0, C3: 130.81,
      D3: 146.83, E3: 164.81, F3: 174.61, G3: 196.0, A3: 220.0, C4: 261.63,
      D4: 293.66, E4: 329.63, F4: 349.23, G4: 392.0, A4: 440.0, C5: 523.25, D5: 587.33
    };

    // Bassline 16-step patterns
    this.bassPattern = [
      'D2', 'D2', 'D2', 'D2', 'D2', 'D2', 'F2', 'G2',
      'D2', 'D2', 'D2', 'D2', 'C2', 'C2', 'A1', 'C2'
    ];

    // Lead Arp 16-step patterns
    this.leadPattern = [
      'D4', null, 'F4', null, 'A4', null, 'D5', null,
      'C5', null, 'A4', null, 'F4', 'G4', 'A4', null
    ];
  }

  init() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
      return;
    }

    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();

      // Master output
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.masterVolume, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      // Music bus with dynamic lowpass filter for bullet time & ducking
      this.musicFilter = this.ctx.createBiquadFilter();
      this.musicFilter.type = 'lowpass';
      this.musicFilter.frequency.setValueAtTime(14000, this.ctx.currentTime);
      this.musicFilter.Q.setValueAtTime(1.5, this.ctx.currentTime);

      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.setValueAtTime(this.musicVolume, this.ctx.currentTime);
      this.musicFilter.connect(this.musicGain);
      this.musicGain.connect(this.masterGain);

      // SFX bus
      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.setValueAtTime(this.sfxVolume, this.ctx.currentTime);
      this.sfxGain.connect(this.masterGain);

      // Generate 2 seconds of high quality white noise
      const bufferSize = this.ctx.sampleRate * 2;
      this.noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = this.noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }
    } catch (e) {
      console.warn('Web Audio API not supported or blocked:', e);
    }
  }

  // Master & volume controls
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

  toggleMute() {
    this.isMuted = !this.isMuted;
    this.setMasterVolume(this.masterVolume);
    return this.isMuted;
  }

  toggleMusic() {
    this.musicMuted = !this.musicMuted;
    this.setMusicVolume(this.musicVolume);
    return this.musicMuted;
  }

  toggleSfx() {
    this.sfxMuted = !this.sfxMuted;
    this.setSfxVolume(this.sfxVolume);
    return this.sfxMuted;
  }

  // Synthesized Cyberpunk Music Sequencer
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
      // Warp sound: drop cutoff down to 500Hz with high resonance
      this.musicFilter.frequency.cancelScheduledValues(now);
      this.musicFilter.frequency.exponentialRampToValueAtTime(450, now + 0.15);
      this.musicFilter.Q.exponentialRampToValueAtTime(4.0, now + 0.15);
    } else {
      this.musicFilter.frequency.cancelScheduledValues(now);
      this.musicFilter.frequency.exponentialRampToValueAtTime(14000, now + 0.3);
      this.musicFilter.Q.exponentialRampToValueAtTime(1.5, now + 0.3);
    }
  }

  setGameSpeed(speedMultiplier) {
    // Dynamically increase tempo slightly as game speed rises (up to 148 BPM)
    const targetBpm = Math.min(148, 126 + (speedMultiplier - 1) * 12);
    this.tempo = targetBpm;
  }

  setHunterAlert(active) {
    this.hunterAlertActive = active;
  }

  scheduleNextStep() {
    if (!this.isPlayingMusic || !this.ctx) return;

    const effectiveTempo = this.isBulletTime ? this.tempo * 0.45 : this.tempo;
    const stepDuration = (60 / effectiveTempo) / 4; // 16th note in seconds

    const now = this.ctx.currentTime;
    this.playMusicStep(this.currentStep, now);

    this.currentStep = (this.currentStep + 1) % 16;
    const ms = stepDuration * 1000;
    this.stepTimer = setTimeout(() => this.scheduleNextStep(), ms);
  }

  playMusicStep(step, time) {
    if (this.musicMuted || !this.ctx) return;

    // 1. Kick on steps 0, 4, 8, 12 (4-on-the-floor synthwave pulse)
    if (step % 4 === 0) {
      this.playSynthKick(time);
    }

    // 2. Snare / Clap on steps 4, 12
    if (step === 4 || step === 12) {
      this.playSynthSnare(time);
    }

    // 3. Crisp Hi-Hats: closed hat every odd step, open hat on step 2, 6, 10, 14
    if (step % 2 === 1) {
      this.playSynthHiHat(time, false);
    } else if (step % 4 === 2) {
      this.playSynthHiHat(time, true);
    }

    // 4. Bassline: 16th note rolling synth bass
    const bassNote = this.bassPattern[step];
    if (bassNote && this.notes[bassNote]) {
      this.playSynthBass(time, this.notes[bassNote]);
    }

    // 5. Cyber Synth Arp Lead
    const leadNote = this.leadPattern[step];
    if (leadNote && this.notes[leadNote]) {
      this.playSynthLead(time, this.notes[leadNote]);
    }

    // 6. Hunter Danger Sub Pulse on beat 0
    if (this.hunterAlertActive && step === 0) {
      this.playHunterAlarm(time);
    }
  }

  playSynthKick(time) {
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(140, time);
      osc.frequency.exponentialRampToValueAtTime(32, time + 0.12);

      gain.gain.setValueAtTime(0.7, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.14);

      osc.connect(gain);
      gain.connect(this.musicFilter);

      osc.start(time);
      osc.stop(time + 0.15);
    } catch (e) {}
  }

  playSynthSnare(time) {
    try {
      if (!this.noiseBuffer) return;
      // White noise burst with bandpass
      const noise = this.ctx.createBufferSource();
      noise.buffer = this.noiseBuffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.setValueAtTime(800, time);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.35, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.15);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.musicFilter);

      // Body tone
      const osc = this.ctx.createOscillator();
      const oscGain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(180, time);
      osc.frequency.exponentialRampToValueAtTime(60, time + 0.08);

      oscGain.gain.setValueAtTime(0.3, time);
      oscGain.gain.exponentialRampToValueAtTime(0.001, time + 0.08);

      osc.connect(oscGain);
      oscGain.connect(this.musicFilter);

      noise.start(time);
      noise.stop(time + 0.16);
      osc.start(time);
      osc.stop(time + 0.09);
    } catch (e) {}
  }

  playSynthHiHat(time, isOpen) {
    try {
      if (!this.noiseBuffer) return;
      const noise = this.ctx.createBufferSource();
      noise.buffer = this.noiseBuffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.setValueAtTime(7500, time);

      const gain = this.ctx.createGain();
      const dur = isOpen ? 0.08 : 0.035;
      gain.gain.setValueAtTime(isOpen ? 0.18 : 0.12, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + dur);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.musicFilter);

      noise.start(time);
      noise.stop(time + dur + 0.01);
    } catch (e) {}
  }

  playSynthBass(time, freq) {
    try {
      const osc = this.ctx.createOscillator();
      const filter = this.ctx.createBiquadFilter();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, time);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(freq * 6, time);
      filter.frequency.exponentialRampToValueAtTime(freq * 1.8, time + 0.11);
      filter.Q.setValueAtTime(3.0, time);

      gain.gain.setValueAtTime(0.32, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.11);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.musicFilter);

      osc.start(time);
      osc.stop(time + 0.12);
    } catch (e) {}
  }

  playSynthLead(time, freq) {
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, time);

      // Soft envelope
      gain.gain.setValueAtTime(0.12, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.18);

      osc.connect(gain);
      gain.connect(this.musicFilter);

      osc.start(time);
      osc.stop(time + 0.2);
    } catch (e) {}
  }

  playHunterAlarm(time) {
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(80, time);
      osc.frequency.linearRampToValueAtTime(140, time + 0.15);
      osc.frequency.linearRampToValueAtTime(80, time + 0.3);

      gain.gain.setValueAtTime(0.2, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.32);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(time);
      osc.stop(time + 0.35);
    } catch (e) {}
  }

  // PROCEDURAL SOUND EFFECTS (SFX)

  // Jump SFX: snappy upward cyber chirp
  playJump() {
    this.init();
    if (this.sfxMuted || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.exponentialRampToValueAtTime(680, now + 0.14);

      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(now);
      osc.stop(now + 0.17);
    } catch (e) {}
  }

  // Slide SFX: ground friction neon whoosh
  playSlide() {
    this.init();
    if (this.sfxMuted || !this.ctx || !this.noiseBuffer) return;
    try {
      const now = this.ctx.currentTime;
      const noise = this.ctx.createBufferSource();
      noise.buffer = this.noiseBuffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(2400, now);
      filter.frequency.exponentialRampToValueAtTime(600, now + 0.22);
      filter.Q.setValueAtTime(2.0, now);

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

  // Lane switch SFX: cyber side-dash swoosh
  playLaneSwitch() {
    this.init();
    if (this.sfxMuted || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.exponentialRampToValueAtTime(560, now + 0.05);
      osc.frequency.exponentialRampToValueAtTime(240, now + 0.1);

      gain.gain.setValueAtTime(0.22, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.11);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(now);
      osc.stop(now + 0.12);
    } catch (e) {}
  }

  // Form shift: high-tech transformer morph tone
  playFormShift(form) {
    this.init();
    if (this.sfxMuted || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const baseFreq = form === 'DRONE' ? 880 : form === 'ORB' ? 440 : 660;

      for (let i = 0; i < 2; i++) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = i === 0 ? 'sawtooth' : 'sine';
        osc.frequency.setValueAtTime(baseFreq * (i + 1), now);
        osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.5, now + 0.08);
        osc.frequency.exponentialRampToValueAtTime(baseFreq * (i === 0 ? 0.8 : 1.2), now + 0.18);

        gain.gain.setValueAtTime(0.18 / (i + 1), now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

        osc.connect(gain);
        gain.connect(this.sfxGain);

        osc.start(now);
        osc.stop(now + 0.21);
      }
    } catch (e) {}
  }

  // Gravity Flip: massive grav-inversion sweep & sub thump
  playGravityFlip() {
    this.init();
    if (this.sfxMuted || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      // Sub sweep
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(80, now);
      osc.frequency.exponentialRampToValueAtTime(240, now + 0.12);
      osc.frequency.exponentialRampToValueAtTime(45, now + 0.32);

      gain.gain.setValueAtTime(0.45, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now);
      osc.stop(now + 0.36);

      // Shimmer sweep
      const shim = this.ctx.createOscillator();
      const shimGain = this.ctx.createGain();
      shim.type = 'triangle';
      shim.frequency.setValueAtTime(600, now);
      shim.frequency.exponentialRampToValueAtTime(1400, now + 0.25);

      shimGain.gain.setValueAtTime(0.18, now);
      shimGain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

      shim.connect(shimGain);
      shimGain.connect(this.sfxGain);
      shim.start(now);
      shim.stop(now + 0.3);
    } catch (e) {}
  }

  // Coin pickup: harmonic chime with pitch scaling for streaks
  playCoin() {
    this.init();
    if (this.sfxMuted || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      if (now - this.lastCoinTime < 0.6) {
        this.consecutiveCoins = Math.min(12, this.consecutiveCoins + 1);
      } else {
        this.consecutiveCoins = 0;
      }
      this.lastCoinTime = now;

      // Pentatonic pitch steps
      const scale = [523.25, 587.33, 659.25, 783.99, 880.0, 1046.5, 1174.66, 1318.51];
      const pitch = scale[this.consecutiveCoins % scale.length];

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(pitch, now);
      osc.frequency.exponentialRampToValueAtTime(pitch * 1.5, now + 0.08);

      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(now);
      osc.stop(now + 0.15);
    } catch (e) {}
  }

  // Powerup pickup: triumphant ascending dual-tone
  playPowerup() {
    this.init();
    if (this.sfxMuted || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const notes = [440, 554.37, 659.25, 880];
      notes.forEach((freq, idx) => {
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

  // Near miss: high-speed bullet whiz + swoosh
  playNearMiss() {
    this.init();
    if (this.sfxMuted || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      // High-pitched whistle
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1400, now);
      osc.frequency.exponentialRampToValueAtTime(320, now + 0.16);

      gain.gain.setValueAtTime(0.28, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(now);
      osc.stop(now + 0.19);
    } catch (e) {}
  }

  // Shield break: plasma barrier shatter
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
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.sfxGain);

      noise.start(now);
      noise.stop(now + 0.36);
    } catch (e) {}
  }

  // Obstacle impact: heavy sub hit & crunch
  playImpact() {
    this.init();
    if (this.sfxMuted || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(110, now);
      osc.frequency.exponentialRampToValueAtTime(25, now + 0.3);

      gain.gain.setValueAtTime(0.5, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(now);
      osc.stop(now + 0.36);
    } catch (e) {}
  }

  // Jetpack thruster loop
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
      filter.frequency.setValueAtTime(1800, now);

      this.jetpackGain = this.ctx.createGain();
      this.jetpackGain.gain.setValueAtTime(0.22, now);

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

  // Game over sound: downward descending power-down
  playGameOver() {
    this.init();
    if (this.sfxMuted || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.exponentialRampToValueAtTime(40, now + 0.7);

      gain.gain.setValueAtTime(0.4, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.75);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(now);
      osc.stop(now + 0.8);
    } catch (e) {}
  }

  // UI Sounds
  playUIClick() {
    this.init();
    if (this.sfxMuted || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.exponentialRampToValueAtTime(1320, now + 0.04);

      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(now);
      osc.stop(now + 0.06);
    } catch (e) {}
  }

  playUIHover() {
    this.init();
    if (this.sfxMuted || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, now);

      gain.gain.setValueAtTime(0.05, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(now);
      osc.stop(now + 0.04);
    } catch (e) {}
  }
}

export const audio = new SoundEngine();
