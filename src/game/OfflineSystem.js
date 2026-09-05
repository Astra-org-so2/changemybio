import { BALANCE } from '../config/balance.js';
import { coinsPerSecond, zoneBonus } from './Economy.js';

export class OfflineSystem {
  constructor(gm) { this.gm = gm; }
  /** Считает offline-награду. Ничего не начисляет — только preview. */
  compute(state, now) {
    const away = Math.max(0, (now - (state.lastSeen || now)) / 1000); // отрицательное время → 0
    if (away < BALANCE.offlineMinSec) return null;
    const zb = zoneBonus(state), capSec = zb.offlineCapSec || BALANCE.offlineCapSec, eff = zb.offlineEfficiency || BALANCE.offlineEfficiency;
    const sec = Math.min(away, capSec);
    const cps = coinsPerSecond(state, now);
    if (cps <= 0) return null;
    let coins = cps * sec * eff;
    const cap = cps * capSec * eff * BALANCE.maxOfflineJumpMult;
    coins = Math.min(coins, cap);
    return { coins: Math.floor(coins), seconds: sec, capped: away > capSec, capSec };
  }
  claim(preview, mult = 1) {
    const coins = Math.floor(preview.coins * mult);
    this.gm.addCoins(coins, mult > 1 ? 'offline_x2' : 'offline');
    this.gm.analytics.track('offline_claim', { coins, seconds: Math.floor(preview.seconds), mult });
    this.gm.emitState(); this.gm.save(true);
    return coins;
  }
}
