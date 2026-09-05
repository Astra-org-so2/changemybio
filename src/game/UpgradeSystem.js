import { bus } from '../core/EventBus.js';
import { tapUpgradeCost, autoUpgradeCost, luckUpgradeCost } from './Economy.js';
import { BALANCE } from '../config/balance.js';

export class UpgradeSystem {
  constructor(gm) { this.gm = gm; }
  cost(kind) { const s = this.gm.state; return kind === 'tap' ? tapUpgradeCost(s.tapLevel) : kind === 'luck' ? luckUpgradeCost(s.luckLevel) : autoUpgradeCost(s.autoLevel); }
  luckAvailable() { const s = this.gm.state; return s.prestige.count >= BALANCE.luckUnlockPrestige; }
  canBuy(kind) { if (kind === 'luck' && (!this.luckAvailable() || this.gm.state.luckLevel >= BALANCE.luckMaxLevel)) return false; return this.gm.state.coins >= this.cost(kind); }
  buy(kind) {
    const s = this.gm.state, c = this.cost(kind);
    if (!this.canBuy(kind)) return false;
    s.coins -= c;
    if (kind === 'tap') s.tapLevel++; else if (kind === 'luck') s.luckLevel++; else s.autoLevel++;
    s.stats.upgrades++;
    if (!s.flags.firstUpgrade) { s.flags.firstUpgrade = true; this.gm.analytics.track('first_upgrade', { kind }); }
    this.gm.quests.progress('upgrades', 1);
    this.gm.analytics.track('upgrade', { kind, level: kind === 'tap' ? s.tapLevel : kind === 'luck' ? s.luckLevel : s.autoLevel, cost: c });
    bus.emit('upgrade', { kind });
    bus.emit('state');
    return true;
  }
}
