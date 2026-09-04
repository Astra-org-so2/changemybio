import { BALANCE } from '../config/balance.js';
import { bus } from '../core/EventBus.js';
import { coinsPerTap, critChance, zoneBonus } from './Economy.js';

export class TapSystem {
  constructor(gm) { this.gm = gm; this.combo = 0; this.lastTapAt = 0; }

  get comboMult() {
    let m = 1;
    for (const t of BALANCE.comboTiers) if (this.combo >= t.taps) m = t.mult;
    return m;
  }
  get comboTier() { let tier = null; for (const t of BALANCE.comboTiers) if (this.combo >= t.taps) tier = t; return tier; }

  tap(x, y) {
    const s = this.gm.state, now = this.gm.now();
    // combo
    if (now - this.lastTapAt <= BALANCE.comboWindowMs) this.combo++; else this.combo = 1;
    this.lastTapAt = now;
    if (this.combo > s.stats.maxCombo) s.stats.maxCombo = this.combo;

    // crit
    const luck = s.boosts.lucky > now ? BALANCE.boosts.lucky.critChanceMult : 1;
    const r = Math.random();
    let critType = null, critMult = 1;
    if (r < BALANCE.superCritChance * luck) { critType = 'super'; critMult = BALANCE.superCritMult; }
    else if (r < critChance(s) * luck) { critType = 'crit'; critMult = BALANCE.critMult; }
    if (critType) critMult *= zoneBonus(s).critMult || 1;

    const amount = coinsPerTap(s, now) * this.comboMult * critMult;
    this.gm.addCoins(amount, 'tap');
    s.stats.taps++;
    if (s.stats.taps === 1) this.gm.analytics.track('first_tap');
    this.gm.quests.progress('taps', 1);
    if (this.comboTier) this.gm.quests.progress('combo', this.combo, true);
    bus.emit('tap', { x, y, amount, critType, combo: this.combo, comboTier: this.comboTier });
    return amount;
  }

  update() {
    if (this.combo > 0 && this.gm.now() - this.lastTapAt > BALANCE.comboDecayMs) {
      this.combo = Math.max(0, this.combo - 2); // плавное падение
      if (this.combo === 0) bus.emit('combo_end');
    }
  }
}
