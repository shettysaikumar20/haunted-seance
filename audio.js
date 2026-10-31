/**
 * HorrorAudioEngine — Real-time Web Audio API Procedural Synthesizer
 * Zero external audio files or MP3 dependencies. 100% offline & instantaneous.
 */
class HorrorAudioEngine {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.isMuted = false;
    this.droneGain = null;
    this.heartbeatGain = null;
    this.droneOscs = [];
    this.heartbeatTimer = null;
    this.heartbeatBpm = 60;
    this.isHeartbeatRunning = false;
    this.initialized = false;
  }

  init() {
    if (this.initialized) {
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
      return;
    }

    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) {
      console.warn('Web Audio API not supported in this browser.');
      return;
    }

    this.ctx = new AudioContextClass();
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(0.7, this.ctx.currentTime);
    this.masterGain.connect(this.ctx.destination);

    this.initialized = true;
    console.log('Horror Audio Engine initialized.');
  }

  ensureContext() {
    if (!this.initialized) this.init();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggleMute() {
    if (!this.initialized) this.init();
    this.isMuted = !this.isMuted;
    if (this.masterGain) {
      const now = this.ctx.currentTime;
      this.masterGain.gain.cancelScheduledValues(now);
      this.masterGain.gain.linearRampToValueAtTime(this.isMuted ? 0 : 0.7, now + 0.1);
    }
    return this.isMuted;
  }

  setMasterVolume(val) {
    if (!this.masterGain || this.isMuted) return;
    this.masterGain.gain.setValueAtTime(Math.max(0, Math.min(1, val)), this.ctx.currentTime);
  }

  /* -------------------------------------------------------------
     1. Atmospheric Sub-Bass Dread Drone
     ------------------------------------------------------------- */
  startDreadDrone() {
    this.ensureContext();
    if (this.droneGain) return; // already active

    const now = this.ctx.currentTime;
    this.droneGain = this.ctx.createGain();
    this.droneGain.gain.setValueAtTime(0.001, now);
    this.droneGain.gain.exponentialRampToValueAtTime(0.28, now + 3.0);

    // Filter for muffled, dark resonant rumble
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(140, now);
    filter.Q.setValueAtTime(4, now);

    // 3 Detuned Low Sine/Triangle Oscillators
    const freqs = [55.0, 58.2, 110.0];
    this.droneOscs = freqs.map((freq, i) => {
      const osc = this.ctx.createOscillator();
      osc.type = i === 1 ? 'sawtooth' : 'sine';
      osc.frequency.setValueAtTime(freq, now);

      // Subtle LFO drift
      const lfo = this.ctx.createOscillator();
      const lfoGain = this.ctx.createGain();
      lfo.frequency.setValueAtTime(0.15 + i * 0.08, now);
      lfoGain.gain.setValueAtTime(1.8, now);
      lfo.connect(lfoGain);
      lfoGain.connect(osc.frequency);
      lfo.start();

      osc.connect(filter);
      osc.start();
      return osc;
    });

    filter.connect(this.droneGain);
    this.droneGain.connect(this.masterGain);
  }

  stopDreadDrone() {
    if (!this.droneGain) return;
    const now = this.ctx.currentTime;
    this.droneGain.gain.cancelScheduledValues(now);
    this.droneGain.gain.exponentialRampToValueAtTime(0.0001, now + 2.0);
    setTimeout(() => {
      this.droneOscs.forEach(osc => osc.stop());
      this.droneOscs = [];
      this.droneGain = null;
    }, 2100);
  }

  /* -------------------------------------------------------------
     2. Creeping Heartbeat (Double Thump: Lub-Dub)
     ------------------------------------------------------------- */
  startHeartbeat(bpm = 60) {
    this.ensureContext();
    this.heartbeatBpm = bpm;
    if (this.isHeartbeatRunning) return;
    this.isHeartbeatRunning = true;

    const tick = () => {
      if (!this.isHeartbeatRunning) return;
      this.playHeartbeatThump(true); // 'lub'
      setTimeout(() => {
        if (!this.isHeartbeatRunning) return;
        this.playHeartbeatThump(false); // 'dub'
      }, 180);

      const intervalMs = (60 / this.heartbeatBpm) * 1000;
      this.heartbeatTimer = setTimeout(tick, intervalMs);
    };

    tick();
  }

  stopHeartbeat() {
    this.isHeartbeatRunning = false;
    clearTimeout(this.heartbeatTimer);
  }

  setHeartbeatBpm(bpm) {
    this.heartbeatBpm = Math.max(40, Math.min(160, bpm));
  }

  playHeartbeatThump(isFirst) {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    const startFreq = isFirst ? 72 : 58;
    osc.frequency.setValueAtTime(startFreq, now);
    osc.frequency.exponentialRampToValueAtTime(32, now + 0.14);

    const peakGain = isFirst ? 0.65 : 0.45;
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(peakGain, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.16);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.18);
  }

  /* -------------------------------------------------------------
     3. Whispering Ghost Noise Sweep
     ------------------------------------------------------------- */
  playWhisper(intensity = 0.5) {
    this.ensureContext();
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;
    const duration = 2.4;

    // Generate White Noise Buffer
    const bufferSize = this.ctx.sampleRate * duration;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;

    // Bandpass filter to sweep like eerie wind/whisper formants
    const bandpass = this.ctx.createBiquadFilter();
    bandpass.type = 'bandpass';
    bandpass.frequency.setValueAtTime(450, now);
    bandpass.frequency.exponentialRampToValueAtTime(1400, now + duration * 0.5);
    bandpass.frequency.exponentialRampToValueAtTime(320, now + duration);
    bandpass.Q.setValueAtTime(6.0, now);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.3 * intensity, now + 0.6);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    whiteNoise.connect(bandpass);
    bandpass.connect(gain);
    gain.connect(this.masterGain);

    whiteNoise.start(now);
    whiteNoise.stop(now + duration);
  }

  /* -------------------------------------------------------------
     4. Sudden Jumpscare Shock / Dissonant Stinger
     ------------------------------------------------------------- */
  playStinger() {
    this.ensureContext();
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;

    // High screeching detuned oscillators
    const freqs = [880, 932, 1244, 1318];
    freqs.forEach(f => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(f, now);
      osc.frequency.exponentialRampToValueAtTime(f * 1.5, now + 0.1);
      osc.frequency.exponentialRampToValueAtTime(f * 0.3, now + 1.2);

      gain.gain.setValueAtTime(0.4, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.3);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now);
      osc.stop(now + 1.35);
    });

    // Sub-bass impact slam
    const subOsc = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    subOsc.type = 'triangle';
    subOsc.frequency.setValueAtTime(130, now);
    subOsc.frequency.exponentialRampToValueAtTime(28, now + 0.8);

    subGain.gain.setValueAtTime(0.85, now);
    subGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.9);

    subOsc.connect(subGain);
    subGain.connect(this.masterGain);
    subOsc.start(now);
    subOsc.stop(now + 0.95);

    // Burst of static crunch
    this.playGlitchStatic(0.4, 0.5);
  }

  /* -------------------------------------------------------------
     5. Midnight Death Bell Toll (Chime with rich metallic harmonics)
     ------------------------------------------------------------- */
  playBellToll() {
    this.ensureContext();
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;
    const partials = [
      { f: 180, g: 0.5, d: 3.5 },
      { f: 362, g: 0.35, d: 2.8 },
      { f: 540, g: 0.25, d: 2.2 },
      { f: 812, g: 0.18, d: 1.6 },
    ];

    partials.forEach(p => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(p.f, now);

      gain.gain.setValueAtTime(p.g, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + p.d);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now);
      osc.stop(now + p.d + 0.05);
    });
  }

  /* -------------------------------------------------------------
     6. Radio Static & Glitch Bursts
     ------------------------------------------------------------- */
  playGlitchStatic(duration = 0.25, volume = 0.35) {
    this.ensureContext();
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;

    const bufferSize = Math.floor(this.ctx.sampleRate * duration);
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = (Math.random() * 2 - 1) * (Math.random() > 0.3 ? 1 : 0);
    }

    const source = this.ctx.createBufferSource();
    source.buffer = noiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(1200, now);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    source.start(now);
    source.stop(now + duration);
  }

  /* -------------------------------------------------------------
     7. Eerie Floorboard Creak / Wood Strain
     ------------------------------------------------------------- */
  playCreak() {
    this.ensureContext();
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;
    const duration = 0.8;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.linearRampToValueAtTime(320, now + 0.3);
    osc.frequency.linearRampToValueAtTime(90, now + duration);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(380, now);
    filter.Q.setValueAtTime(12, now);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.25, now + 0.1);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + duration + 0.05);
  }

  /* -------------------------------------------------------------
     8. Haunted Typewriter Key Click
     ------------------------------------------------------------- */
  playTypewriterClick() {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    const pitch = 350 + Math.random() * 220;
    osc.frequency.setValueAtTime(pitch, now);
    osc.frequency.exponentialRampToValueAtTime(80, now + 0.04);

    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.045);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.05);
  }
}

// Global horror audio singleton
window.horrorAudio = new HorrorAudioEngine();
