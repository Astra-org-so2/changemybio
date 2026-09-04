import { EVENTS, EVENT_MAP } from '../config/events.js';
import { AB } from '../config/ab.js';
import { bus } from '../core/EventBus.js';

export class EventSystem {
  constructor(gm) { this.gm = gm; }
  /** Текущее активное событие (или null) + время до конца. */
  active(now = this.gm.now()) {
    const override = AB.get('event_override');
    for (const ev of EVENTS) {
      if (override === 'none') return null;
      const w = override === ev.id ? { start: now - 1, end: now + 48 * 3600e3 } : this._window(ev, now);
      if (w && now >= w.start && now < w.end) return { ev, endsAt: w.end, startsAt: w.start };
    }
    return null;
  }
  _window(ev, now) {
    const s = ev.schedule; if (s.type !== 'weekly') return null;
    const d = new Date(now); const dow = d.getUTCDay();
    // ближайший старт в прошлом
    let start = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), s.startHour) - ((dow - s.startDow + 7) % 7) * 86400e3;
    if (start > now) start -= 7 * 86400e3;
    return { start, end: start + s.durationHours * 3600e3 };
  }
  _progress(id, startsAt) {
    const s = this.gm.state; s.events ??= {};
    let p = s.events[id];
    if (!p || p.startsAt !== startsAt) p = s.events[id] = { startsAt, score: 0, claimed: [] }; // новый запуск события — новый прогресс
    return p;
  }
  onTap() { const a = this.active(); if (!a) return; if (Math.random() < a.ev.currencyTapChance) this.add(a, a.ev.currencyPerTap); }
  onChest() { const a = this.active(); if (!a) return; this.add(a, a.ev.currencyPerChest); }
  add(a, n) { const p = this._progress(a.ev.id, a.startsAt); p.score += n; bus.emit('event_score', { score: p.score }); }
  status() {
    const a = this.active(); if (!a) return null;
    const p = this._progress(a.ev.id, a.startsAt);
    return { ...a, score: p.score, claimed: p.claimed, milestones: a.ev.milestones.map((m, i) => ({ ...m, i, done: p.score >= m.score, claimed: p.claimed.includes(i) })) };
  }
  claim(i) {
    const st = this.status(); if (!st) return false; const m = st.milestones[i]; if (!m || !m.done || m.claimed) return false;
    const p = this._progress(st.ev.id, st.startsAt); p.claimed.push(i);
    if (m.gems) this.gm.addGems(m.gems, 'event');
    if (m.chest) this.gm.chests.open(m.chest, 'event');
    if (m.character && !this.gm.state.characters[m.character]) { this.gm.state.characters[m.character] = 1; this.gm.analytics.track('character_obtained', { character_id: m.character, rarity: 'legendary', source: 'event' }); }
    this.gm.analytics.track('event_milestone_claimed', { event_id: st.ev.id, milestone: i });
    this.gm.emitState(); this.gm.save(true); return true;
  }
  submitScore() { const st = this.status(); if (st && st.score > 0) this.gm.leaderboards.submit(st.ev.leaderboard, st.score); }
}
