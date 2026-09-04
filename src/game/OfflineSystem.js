import { BALANCE } from '../config/balance.js';
import { coinsPerSecond } from './Economy.js';

export class OfflineSystem {
  constructor(gm) { this.gm = gm; }
  /** Считает offline-награду. Ничего не начисляет — только preview. */
  compute(state, now) {
    const away = Math.max(0, (now - (state.lastSeen || now)) / 1000); // отрицательное время → 0
    if (away < BALANCE.offlineMinSec) return null;
    const sec = Math.min(away, BALANCE.offlineCapSec);
    const cps = coinsPerSecond(state, now);
    if (cps <= 0) return null;
    let coins = cps * sec * BALANCE.offlineEfficiency;
    const cap = cps * BALANCE.offlineCapSec * BALANCE.offlineEfficiency * BALANCE.maxOfflineJumpMult;
    coins = Math.min(coins, cap);
    return { coins: Math.floor(coins), seconds: sec, capped: away > BALANCE.offlineCapSec };
  }
  claim(preview, mult = 1) {
    const coins = Math.floor(preview.coins * mult);
    this.gm.addCoins(coins, mult > 1 ? 'offline_x2' : 'offline');
    this.gm.analytics.track('offline_claim', { coins, seconds: Math.floor(preview.seconds), mult });
    this.gm.emitState(); this.gm.save(true);
    return coins;
  }
}
