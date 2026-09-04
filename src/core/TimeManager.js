/**
 * TimeManager — единственный источник времени.
 * Защита от манипуляций системными часами: время не может идти назад,
 * а «прыжки вперёд» ограничены offlineCap в SaveManager/OfflineSystem.
 */
export const TimeManager = {
  _lastNow: 0,
  now() {
    let n = Date.now();
    if (n < this._lastNow) n = this._lastNow; // часы откатили назад — не даём отрицательное время
    this._lastNow = n;
    return n;
  },
  perf() { return performance.now(); },
  dayKey(ts = this.now()) { const d = new Date(ts); return `${d.getUTCFullYear()}-${d.getUTCMonth() + 1}-${d.getUTCDate()}`; },
  daysBetween(a, b) { return Math.floor((this._utcMidnight(b) - this._utcMidnight(a)) / 86400000); },
  _utcMidnight(ts) { const d = new Date(ts); return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()); },
  fmtDuration(sec) {
    sec = Math.max(0, Math.floor(sec));
    const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), s = sec % 60;
    if (h) return `${h}ч ${m}м`;
    if (m) return `${m}м ${s}с`;
    return `${s}с`;
  },
};
