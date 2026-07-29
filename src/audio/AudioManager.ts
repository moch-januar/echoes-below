// ── Procedural Audio Manager ───────────────────────────────────────────────
// Generates all game sounds via Web Audio API — no external audio files needed.

let instance: AudioManager | null = null;

export class AudioManager {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private ambienceNodes: Map<string, AudioBufferSourceNode | OscillatorNode> = new Map();
  private initialized = false;

  static getInstance(): AudioManager {
    if (!instance) instance = new AudioManager();
    return instance;
  }

  init() {
    if (this.initialized) return;
    try {
      this.ctx = new AudioContext();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.7;
      this.masterGain.connect(this.ctx.destination);

      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.value = 0.3;
      this.musicGain.connect(this.masterGain);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.value = 0.5;
      this.sfxGain.connect(this.masterGain);

      this.initialized = true;
    } catch {
      console.warn('Audio not available');
    }
  }

  ensureResumed() {
    if (this.ctx?.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // ── Volume ────────────────────────────────────────────────────────────

  setMasterVolume(v: number) { if (this.masterGain) this.masterGain.gain.value = v; }
  setMusicVolume(v: number) { if (this.musicGain) this.musicGain.gain.value = v; }
  setSfxVolume(v: number) { if (this.sfxGain) this.sfxGain.gain.value = v; }

  // ── Procedural Sound Generators ───────────────────────────────────────

  /** Gunshot — short burst of noise band-passed */
  playGunshot() {
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    const bufSize = this.ctx.sampleRate * 0.15;
    const buf = this.ctx.createBuffer(1, bufSize, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) {
      const t = i / this.ctx.sampleRate;
      data[i] = (Math.random() * 2 - 1) * Math.exp(-t * 40) * 0.6;
    }
    const src = this.ctx.createBufferSource();
    src.buffer = buf;

    const bp = this.ctx.createBiquadFilter();
    bp.type = 'lowpass';
    bp.frequency.value = 800;
    bp.Q.value = 1;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.8, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

    src.connect(bp);
    bp.connect(gain);
    gain.connect(this.sfxGain);
    src.start(now);
    src.stop(now + 0.15);
  }

  /** Footstep — low thump */
  playFootstep() {
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(80, now);
    osc.frequency.exponentialRampToValueAtTime(40, now + 0.08);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.1);
  }

  /** Door sound — creak/metallic scrape */
  playDoor() {
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    const bufSize = this.ctx.sampleRate * 0.4;
    const buf = this.ctx.createBuffer(1, bufSize, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) {
      const t = i / this.ctx.sampleRate;
      data[i] = Math.sin(t * 200 + Math.sin(t * 50) * 3) * Math.exp(-t * 5) * 0.3;
    }
    const src = this.ctx.createBufferSource();
    src.buffer = buf;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

    src.connect(gain);
    gain.connect(this.sfxGain);
    src.start(now);
  }

  /** Hit sound — dull impact */
  playHit() {
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(150, now);
    osc.frequency.exponentialRampToValueAtTime(30, now + 0.1);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.15);
  }

  /** Pickup sound — short chime */
  playPickup() {
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, now);
    osc.frequency.setValueAtTime(660, now + 0.05);
    osc.frequency.setValueAtTime(880, now + 0.1);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.3);
  }

  /** Enemy vocalization — low growl */
  playEnemyGrowl() {
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    const bufSize = this.ctx.sampleRate * 0.8;
    const buf = this.ctx.createBuffer(1, bufSize, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) {
      const t = i / this.ctx.sampleRate;
      const noise = (Math.random() * 2 - 1) * 0.3;
      const tone = Math.sin(t * 80 + Math.sin(t * 15) * 5) * 0.4;
      data[i] = (noise + tone) * Math.exp(-t * 2) * 0.5;
    }
    const src = this.ctx.createBufferSource();
    src.buffer = buf;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);

    src.connect(gain);
    gain.connect(this.sfxGain);
    src.start(now);
  }

  /** Reload sound */
  playReload() {
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    // Click 1
    const click = (t: number) => {
      const bufSize = this.ctx!.sampleRate * 0.05;
      const buf = this.ctx!.createBuffer(1, bufSize, this.ctx!.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < bufSize; i++) {
        data[i] = Math.sin(i / bufSize * Math.PI * 4) * Math.exp(-i / bufSize * 10) * 0.5;
      }
      const src = this.ctx!.createBufferSource();
      src.buffer = buf;
      const gain = this.ctx!.createGain();
      gain.gain.setValueAtTime(0.3, now + t);
      gain.gain.exponentialRampToValueAtTime(0.001, now + t + 0.05);
      src.connect(gain);
      gain.connect(this.sfxGain!);
      src.start(now + t);
    };
    click(0);
    click(0.3);
    click(1.0);
  }

  /** Safe room ambience — quiet hum */
  playSafeHum() {
    this.startAmbience('safe', (ctx, gain) => {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = 55;
      const osc2 = ctx.createOscillator();
      osc2.type = 'sine';
      osc2.frequency.value = 57;

      const lfo = ctx.createOscillator();
      lfo.type = 'sine';
      lfo.frequency.value = 0.3;
      const lfoGain = ctx.createGain();
      lfoGain.gain.value = 2;
      lfo.connect(lfoGain);
      lfoGain.connect(osc.frequency);
      lfoGain.connect(osc2.frequency);

      const gain2 = ctx.createGain();
      gain2.gain.value = 0.05;
      osc.connect(gain2);
      osc2.connect(gain2);
      gain2.connect(gain);

      osc.start();
      osc2.start();
      lfo.start();
      return [osc, osc2, lfo];
    });
  }

  /** Ambient hum */
  playAmbientHum() {
    this.startAmbience('hum', (ctx, gain) => {
      const bufSize = ctx.sampleRate * 2;
      const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < bufSize; i++) {
        const t = i / ctx.sampleRate;
        data[i] = (Math.random() * 2 - 1) * 0.02 * Math.sin(t * 60) * 0.5;
      }
      const src = ctx.createBufferSource();
      src.buffer = buf;
      src.loop = true;
      src.connect(gain);
      return [src];
    });
  }

  /** Alarm beep */
  playAlarm() {
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    for (let i = 0; i < 4; i++) {
      const t = now + i * 1.5;
      const osc = this.ctx.createOscillator();
      osc.type = 'square';
      osc.frequency.value = 440;
      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.1, t);
      gain.gain.setValueAtTime(0.1, t + 0.4);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(t);
      osc.stop(t + 0.5);
    }
  }

  /** Start/stop ambience sounds */
  private startAmbience(id: string, create: (ctx: AudioContext, gain: GainNode) => AudioNode[]) {
    if (!this.ctx || !this.musicGain) return;
    this.stopAmbience(id);

    const gain = this.ctx.createGain();
    gain.gain.value = 1;
    gain.connect(this.musicGain);

    const nodes = create(this.ctx, gain);
    for (const node of nodes) {
      this.ambienceNodes.set(id + '_' + nodes.indexOf(node), node as any);
    }
  }

  stopAmbience(id: string) {
    for (const [key, node] of this.ambienceNodes) {
      if (key.startsWith(id)) {
        try {
          node.stop();
        } catch {}
        try {
          node.disconnect();
        } catch {}
        this.ambienceNodes.delete(key);
      }
    }
  }

  stopAll() {
    for (const [, node] of this.ambienceNodes) {
      try { node.stop(); } catch {}
      try { node.disconnect(); } catch {}
    }
    this.ambienceNodes.clear();
  }

  destroy() {
    this.stopAll();
    if (this.ctx) {
      this.ctx.close();
      this.ctx = null;
    }
    this.initialized = false;
    instance = null;
  }
}
