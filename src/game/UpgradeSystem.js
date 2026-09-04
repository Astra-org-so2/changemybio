import { bus } from '../core/EventBus.js';
import { tapUpgradeCost, autoUpgradeCost } from './Economy.js';

export class UpgradeSystem {
  constructor(gm) { this.gm = gm; }
  cost(kind) { const s = this.gm.state; return kind === 'tap' ? tapUpgradeCost(s.tapLevel) : autoUpgradeCost(s.autoLevel); }
  canBuy(kind) { return this.gm.state.coins >= this.cost(kind); }
  buy(kind) {
    const s = this.gm.state, c = this.cost(kind);
    if (s.coins < c) return false;
    s.coins -= c;
    if (kind === 'tap') s.tapLevel++; else s.autoLevel++;
    s.stats.upgrades++;
    if (!s.flags.firstUpgrade) { s.flags.firstUpgrade = true; this.gm.analytics.track('first_upgrade', { kind }); }
    this.gm.quests.progress('upgrades', 1);
    this.gm.analytics.track('upgrade', { kind, level: kind === 'tap' ? s.tapLevel : s.autoLevel, cost: c });
    bus.emit('upgrade', { kind });
    bus.emit('state');
    return true;
  }
}
