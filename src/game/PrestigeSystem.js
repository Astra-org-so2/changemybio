import { BALANCE } from '../config/balance.js';
import { bus } from '../core/EventBus.js';
import { prestigePreview } from './Economy.js';

export class PrestigeSystem {
  constructor(gm) { this.gm = gm; }
  preview() { return prestigePreview(this.gm.state); }
  doPrestige() {
    const s = this.gm.state, p = this.preview();
    if (!p.can || p.points <= 0) return false;
    s.prestige.points += p.points;
    s.prestige.count++;
    s.stats.prestiges++;
    s.coins = 0; s.runEarned = 0; s.tapLevel = 0; s.autoLevel = 0;
    s.chests.costIndex.basic = 0;
    if (s.prestige.count === 1) this.gm.analytics.track('first_prestige', { points: p.points });
    this.gm.analytics.track('prestige', { count: s.prestige.count, points_gained: p.points, total_points: s.prestige.points });
    this.gm.quests.progress('prestige', 1);
    bus.emit('prestige', { points: p.points, count: s.prestige.count });
    if (s.prestige.count === 1) this.gm.monetization.onStarterTrigger('prestige');
    bus.emit('state');
    this.gm.save(true);
    return true;
  }
}
