import { ACHIEVEMENTS } from '../config/achievements.js';
import { CHARACTER_MAP } from '../config/characters.js';
import { bus } from '../core/EventBus.js';

/**
 * Достижения: ступенчатые, постоянные, автоначисление гемов при выполнении.
 * check() дешёвый (14 чтений state) — вызывается по событиям, а не каждый тик.
 */
export class AchievementSystem {
  constructor(gm) {
    this.gm = gm;
    this.ctx = { ownedOfRarity: (s, r) => Object.keys(s.characters).filter((id) => CHARACTER_MAP[id]?.rarity === r).length };
  }
  /** Прогресс по всем достижениям для UI. */
  list() {
    const s = this.gm.state;
    return ACHIEVEMENTS.map((a) => {
      const done = s.achievements[a.id] || 0, value = a.value(s, this.ctx);
      const next = a.tiers[done] || null;
      return { ...a, done, value, next, complete: !next, total: a.tiers.length, gems: next ? next[1] : 0, target: next ? next[0] : a.tiers[a.tiers.length - 1][0] };
    });
  }
  /** Проверяет все ступени; начисляет награды; возвращает список новых разблокировок. */
  check() {
    const s = this.gm.state, unlocked = [];
    for (const a of ACHIEVEMENTS) {
      let done = s.achievements[a.id] || 0;
      const value = a.value(s, this.ctx);
      while (done < a.tiers.length && value >= a.tiers[done][0]) {
        const [target, gems] = a.tiers[done]; done++;
        s.achievements[a.id] = done;
        this.gm.addGems(gems, 'achievement');
        this.gm.analytics.track('achievement_unlock', { id: a.id, tier: done, target, gems });
        unlocked.push({ a, tier: done, gems });
      }
    }
    if (unlocked.length) { bus.emit('achievements', unlocked); bus.emit('state'); }
    return unlocked;
  }
  unclaimedCount() { return 0; } // награды автоматические; метод оставлен для симметрии с квестами
  progressPct() { const l = this.list(); const d = l.reduce((a, x) => a + x.done, 0), t = l.reduce((a, x) => a + x.total, 0); return t ? d / t : 0; }
}
