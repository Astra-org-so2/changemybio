/** Простой синхронный EventBus — единственный канал game → ui. */
class EventBus {
  constructor() { this.map = new Map(); }
  on(evt, fn) {
    if (!this.map.has(evt)) this.map.set(evt, new Set());
    this.map.get(evt).add(fn);
    return () => this.off(evt, fn);
  }
  once(evt, fn) { const off = this.on(evt, (p) => { off(); fn(p); }); return off; }
  off(evt, fn) { this.map.get(evt)?.delete(fn); }
  emit(evt, payload) {
    const set = this.map.get(evt);
    if (!set) return;
    for (const fn of [...set]) { try { fn(payload); } catch (e) { console.error('[EventBus]', evt, e); } }
  }
}
export const bus = new EventBus();
