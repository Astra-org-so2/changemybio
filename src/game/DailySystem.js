import { BALANCE } from '../config/balance.js';
import { TimeManager } from '../core/TimeManager.js';
import { coinsPerSecond } from './Economy.js';

export class DailySystem {
  constructor(gm) { this.gm = gm; }
  /** Обновляет streak при заходе; возвращает можно ли забрать. */
  status() {
    const s = this.gm.state, now = this.gm.now(), today = TimeManager.dayKey(now);
    if (s.daily.lastClaimDay === today) return { canClaim: false, day: s.daily.streak, rewards: BALANCE.dailyRewards };
    // пропуск дня → сброс
    if (s.daily.lastClaimDay) {
      const last = s.daily.lastClaimTs || 0;
      if (last && TimeManager.daysBetween(last, now) > 1) s.daily.streak = 0;
    }
    const day = (s.daily.streak % 7) + 1;
    return { canClaim: true, day, rewards: BALANCE.dailyRewards };
  }
  rewardFor(day) {
    const r = BALANCE.dailyRewards[day - 1], s = this.gm.state;
    const cps = coinsPerSecond(s, this.gm.now());
    const coins = Math.max(BALANCE.dailyCoinsMinBase * day, Math.floor(cps * 60 * r.coinsMinutes));
    return { coins, gems: r.gems, chest: r.chest || null };
  }
  claim() {
    const st = this.status(); if (!st.canClaim) return null;
    const s = this.gm.state, now = this.gm.now();
    const reward = this.rewardFor(st.day);
    s.daily.streak = st.day; s.daily.lastClaimDay = TimeManager.dayKey(now); s.daily.lastClaimTs = now;
    this.gm.addCoins(reward.coins, 'daily'); this.gm.addGems(reward.gems, 'daily');
    let chestResult = null;
    if (reward.chest) chestResult = this.gm.chests.open(reward.chest, 'daily');
    this.gm.analytics.track('daily_login', { day: st.day, streak: s.daily.streak });
    this.gm.emitState(); this.gm.save(true);
    return { ...reward, day: st.day, chestResult };
  }
}
