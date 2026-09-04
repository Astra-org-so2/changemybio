/** Процедурные звуки через WebAudio — ноль ассетов, ноль загрузки. */
export class Sound {
  constructor() { this.ctx = null; this.enabled = true; this._lastTap = 0; }
  _ensure() { if (!this.ctx) { try { this.ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch { this.enabled = false; } } if (this.ctx?.state === 'suspended') this.ctx.resume(); }
  _beep(freq, dur = 0.06, type = 'square', gain = 0.05, slide = 0) {
    if (!this.enabled) return; this._ensure(); if (!this.ctx) return;
    const t = this.ctx.currentTime, o = this.ctx.createOscillator(), g = this.ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t); if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(40, freq + slide), t + dur);
    g.gain.setValueAtTime(gain, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(this.ctx.destination); o.start(t); o.stop(t + dur + 0.02);
  }
  tap(combo = 0) { const n = performance.now(); if (n - this._lastTap < 30) return; this._lastTap = n; this._beep(400 + Math.min(combo, 50) * 8, 0.05, 'square', 0.03); }
  crit() { this._beep(600, 0.12, 'sawtooth', 0.06, 600); }
  superCrit() { this._beep(300, 0.3, 'sawtooth', 0.08, 1200); setTimeout(() => this._beep(900, 0.2, 'square', 0.06), 120); }
  buy() { this._beep(523, 0.08, 'triangle', 0.06); setTimeout(() => this._beep(784, 0.1, 'triangle', 0.06), 70); }
  chest(rarityIdx) { for (let i = 0; i <= rarityIdx + 1; i++) setTimeout(() => this._beep(440 * Math.pow(1.25, i), 0.15, 'triangle', 0.07), i * 90); }
  reward() { [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => this._beep(f, 0.12, 'triangle', 0.06), i * 80)); }
  prestige() { [262, 330, 392, 523, 659, 784].forEach((f, i) => setTimeout(() => this._beep(f, 0.25, 'sawtooth', 0.05), i * 110)); }
}
