/**
 * Web Audio API Ambient & Bell Synthesizer + MP3 Sync Helper
 * Đảm bảo âm thanh thiền định, tiếng suối rừng và tiếng chuông Chánh niệm
 * luôn hoạt động trong trẻo trên mọi trình duyệt kể cả khi chưa upload MP3 ngoài,
 * đồng thời hỗ trợ phát và đồng bộ vị trí file MP3 do Admin tải lên.
 */
class SanctuarySoundEngine {
  private ctx: AudioContext | null = null;
  private streamGain: GainNode | null = null;
  private padGain: GainNode | null = null;
  private isSynthRunning = false;
  private masterVolume = 0.65;
  private isMuted = false;
  private padInterval: number | null = null;

  private ensureContext(): AudioContext {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  /**
   * Tiếng chuông đồng xoay / chuông gia trì ngân dài thanh tịnh (Tibetan Singing Bowl)
   */
  public playMindfulnessBell(intensity = 0.45) {
    if (this.isMuted) return;
    try {
      const ctx = this.ensureContext();
      const now = ctx.currentTime;

      const freqs = [432, 864, 1296.5];
      freqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);

        const peak = (intensity * this.masterVolume) / (idx === 0 ? 1 : idx * 2.4);
        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.exponentialRampToValueAtTime(Math.max(0.001, peak), now + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + (idx === 0 ? 6.5 : 3.8));

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 6.8);
      });
    } catch {
      // Ignore if browser blocked audio before gesture
    }
  }

  /**
   * Khởi tạo âm thanh suối chảy nhẹ & âm hưởng thiền định 432Hz
   */
  public startForestAmbience(mode: 'TIENG_SUOI' | 'NHAC_THIEN' | 'TIENG_MUA' | 'TIENG_CHUONG' | 'TUNG_KINH' = 'TIENG_SUOI') {
    if (this.isMuted) return;
    try {
      const ctx = this.ensureContext();
      this.stopForestAmbience();
      this.isSynthRunning = true;

      // 1. Gentle Forest Stream (Filtered Pink/Brown Noise)
      const bufferSize = ctx.sampleRate * 3;
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      let lastOut = 0.0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        output[i] = (lastOut + 0.02 * white) / 1.02;
        lastOut = output[i];
        output[i] *= 0.35;
      }

      const whiteNoise = ctx.createBufferSource();
      whiteNoise.buffer = noiseBuffer;
      whiteNoise.loop = true;

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = mode === 'TIENG_MUA' ? 950 : 520;
      filter.Q.value = 0.7;

      this.streamGain = ctx.createGain();
      this.streamGain.gain.value = this.masterVolume * 0.16;

      whiteNoise.connect(filter);
      filter.connect(this.streamGain);
      this.streamGain.connect(ctx.destination);
      whiteNoise.start();

      // 2. Warm Harmonic Zen Chords (432Hz Root)
      const playWarmChord = () => {
        if (!this.isSynthRunning || this.isMuted || !this.ctx) return;
        const now = this.ctx.currentTime;
        const scale = [216, 288, 324, 432, 540];
        const note = scale[Math.floor(Math.random() * scale.length)];

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(note, now);

        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.linearRampToValueAtTime(this.masterVolume * 0.06, now + 2.5);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 9.0);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 9.2);
      };

      playWarmChord();
      this.padInterval = window.setInterval(playWarmChord, 6500);
    } catch {
      // Ignore audio init errors before user interaction
    }
  }

  public stopForestAmbience() {
    this.isSynthRunning = false;
    if (this.padInterval) {
      clearInterval(this.padInterval);
      this.padInterval = null;
    }
    if (this.streamGain && this.ctx) {
      try {
        this.streamGain.gain.setTargetAtTime(0.0001, this.ctx.currentTime, 0.2);
        setTimeout(() => {
          this.streamGain?.disconnect();
          this.streamGain = null;
        }, 300);
      } catch {
        this.streamGain = null;
      }
    }
  }

  public setVolume(vol: number) {
    this.masterVolume = Math.max(0, Math.min(1, vol));
    if (this.streamGain && this.ctx) {
      this.streamGain.gain.setValueAtTime(
        this.isMuted ? 0 : this.masterVolume * 0.16,
        this.ctx.currentTime
      );
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (muted) {
      this.stopForestAmbience();
    }
  }
}

export const soundEngine = new SanctuarySoundEngine();
