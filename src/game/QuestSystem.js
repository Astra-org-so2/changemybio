import { BALANCE } from '../config/balance.js';
import { TimeManager } from '../core/TimeManager.js';
import { bus } from '../core/EventBus.js';

export class QuestSystem {
  constructor(gm) { this.gm = gm; }
  ensureToday() {
    const s = this.gm.state, day = TimeManager.dayKey(this.gm.now());
    if (s.quests.day === day && s.quests.list.length) return;
    // выбираем N квестов детерминированно по дню (без 'prestige' до первого prestige)
    const pool = BALANCE.questPool.filter((q) => q.type !== 'prestige' || s.prestige.count > 0 || s.runEarned > BALANCE.prestigeThreshold / 2);
    const seed = [...day].reduce((a, c) => a + c.charCodeAt(0), 0);
    const picked = [];
    for (let i = 0; picked.length < BALANCE.questsPerDay && i < pool.length * 2; i++) { const q = pool[(seed + i * 7) % pool.length]; if (!picked.includes(q)) picked.push(q); }
    s.quests = { day, list: picked.map((q) => ({ id: q.id, type: q.type, target: q.target, gems: q.gems, progress: 0, claimed: false })) };
  }
  progress(type, amount, absolute = false) {
    const s = this.gm.state; let changed = false;
    for (const q of s.quests.list) {
      if (q.type !== type || q.claimed || q.progress >= q.target) continue;
      const before = Math.floor(q.progress / q.target * 20);
      q.progress = absolute ? Math.max(q.progress, Math.min(amount, q.target)) : Math.min(q.target, q.progress + amount);
      if (Math.floor(q.progress / q.target * 20) !== before || q.progress >= q.target) changed = true;
      if (q.progress >= q.target) bus.emit('quest_complete', q);
    }
    if (changed) bus.emit('quests');
  }
  claim(id) {
    const q = this.gm.state.quests.list.find((x) => x.id === id);
    if (!q || q.claimed || q.progress < q.target) return false;
    q.claimed = true;
    this.gm.addGems(q.gems, 'quest');
    this.gm.analytics.track('quest_claimed', { quest_id: id, gems: q.gems });
    bus.emit('quests'); bus.emit('state');
    return true;
  }
  titleOf(q) { return BALANCE.questPool.find((x) => x.id === q.id)?.title; }
}
