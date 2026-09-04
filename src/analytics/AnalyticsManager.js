/**
 * AnalyticsManager — буферизирует события; sink подключаемый.
 * MVP sink: console (dev) + window.ym если Яндекс.Метрика подключена (Phase 2, по решению команды).
 * Каждое событие: { name, ts, session_id, params }.
 */
export class AnalyticsManager {
  constructor({ debug = false } = {}) {
    this.debug = debug; this.sessionId = Math.random().toString(36).slice(2, 10); this.queue = []; this.sinks = [];
    this.sessionStart = Date.now(); this.retentionMarks = new Set();
  }
  addSink(fn) { this.sinks.push(fn); }
  track(name, params = {}) {
    const evt = { name, ts: Date.now(), session_id: this.sessionId, ...params };
    this.queue.push(evt); if (this.queue.length > 500) this.queue.shift();
    if (this.debug) console.log('%c[analytics]', 'color:#8b5cf6', name, params);
    for (const s of this.sinks) { try { s(name, params); } catch {} }
  }
  /** retention milestones: время в сессии 1/3/5/10/20 мин */
  tickRetention(state) {
    const min = Math.floor((Date.now() - this.sessionStart) / 60000);
    for (const m of [1, 3, 5, 10, 20]) if (min >= m && !this.retentionMarks.has(m)) { this.retentionMarks.add(m); this.track('session_minute', { minute: m, taps: state.stats.taps, coins: Math.floor(state.coins) }); }
    const days = Math.floor((Date.now() - state.createdAt) / 86400000);
    for (const d of [1, 3, 7, 14, 30]) { const key = 'ret_d' + d; if (days >= d && !state.flags[key]) { state.flags[key] = true; this.track('retention_milestone', { day: d }); } }
  }
}
