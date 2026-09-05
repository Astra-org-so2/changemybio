/** Лёгкие canvas-партиклы. Пул фиксированного размера, нет аллокаций в кадре. */
export class Particles {
  constructor(canvas) {
    this.c = canvas; this.ctx = canvas.getContext('2d'); this.pool = []; this.max = 220;
    for (let i = 0; i < this.max; i++) this.pool.push({ alive: false });
    this.resize(); window.addEventListener('resize', () => this.resize()); this._raf = null;
  }
  resize() { const r = this.c.parentElement.getBoundingClientRect(); this.dpr = Math.min(2, devicePixelRatio || 1); this.c.width = r.width * this.dpr; this.c.height = r.height * this.dpr; this.c.style.width = r.width + 'px'; this.c.style.height = r.height + 'px'; }
  burst(x, y, n = 8, color = '#ffcc33', power = 1) {
    let spawned = 0;
    for (const p of this.pool) {
      if (p.alive) continue;
      const a = Math.random() * Math.PI * 2, v = (2 + Math.random() * 4) * power;
      p.alive = true; p.x = x; p.y = y; p.vx = Math.cos(a) * v; p.vy = Math.sin(a) * v - 3; p.life = 1; p.decay = 0.03 + Math.random() * 0.03; p.size = (3 + Math.random() * 4) * power; p.color = color; p.spin = Math.random() * 6;
      if (++spawned >= n) break;
    }
    this.start();
  }
  start() { if (!this._raf) this._raf = requestAnimationFrame(() => this.step()); }
  step() {
    const { ctx, dpr } = this; ctx.clearRect(0, 0, this.c.width, this.c.height); let any = false;
    for (const p of this.pool) {
      if (!p.alive) continue; any = true;
      p.x += p.vx; p.y += p.vy; p.vy += 0.25; p.life -= p.decay; p.spin += 0.2;
      if (p.life <= 0) { p.alive = false; continue; }
      ctx.globalAlpha = Math.max(0, p.life); ctx.fillStyle = p.color;
      ctx.save(); ctx.translate(p.x * dpr, p.y * dpr); ctx.rotate(p.spin); ctx.fillRect(-p.size * dpr / 2, -p.size * dpr / 2, p.size * dpr, p.size * dpr); ctx.restore();
    }
    ctx.globalAlpha = 1;
    this._raf = any ? requestAnimationFrame(() => this.step()) : null;
  }
}
