/**
 * AdManager — политика показа рекламы. Внутренний компонент MonetizationManager.
 * Все пороги — из AB (Remote Config), чтобы менять частоту без релиза.
 */
import { AB } from '../config/ab.js';

export class AdManager {
  constructor(platform, now) {
    this.platform = platform; this.now = now;
    this.sessionStart = now();
    this.lastInterstitialAt = 0; this.lastRewardedAt = 0;
    this.interstitialsThisSession = 0;
    this.busy = false;          // реклама на экране
    this.blockUntil = 0;        // «тихие» окна (редкий дроп, анимация)
    this.lastTapAt = 0;         // активный геймплей
  }
  get cfg() { return {
    MIN_INTERSTITIAL_INTERVAL: AB.num('min_interstitial_interval_sec') * 1000,
    MAX_INTERSTITIAL_PER_SESSION: AB.num('max_interstitial_per_session'),
    MIN_SESSION_TIME_BEFORE_AD: AB.num('min_session_time_before_ad_sec') * 1000,
    NO_INTERSTITIAL_AFTER_REWARDED: 60_000,
    NO_INTERSTITIAL_WHILE_TAPPING: 3_000,
  }; }
  noteTap() { this.lastTapAt = this.now(); }
  block(ms) { this.blockUntil = Math.max(this.blockUntil, this.now() + ms); }

  canShowInterstitial(removeAds) {
    const t = this.now(), c = this.cfg;
    if (removeAds || this.busy) return { ok: false, reason: removeAds ? 'remove_ads' : 'busy' };
    if (t < this.blockUntil) return { ok: false, reason: 'blocked' };
    if (t - this.sessionStart < c.MIN_SESSION_TIME_BEFORE_AD) return { ok: false, reason: 'session_too_short' };
    if (t - this.lastInterstitialAt < c.MIN_INTERSTITIAL_INTERVAL) return { ok: false, reason: 'interval' };
    if (this.interstitialsThisSession >= c.MAX_INTERSTITIAL_PER_SESSION) return { ok: false, reason: 'session_cap' };
    if (t - this.lastRewardedAt < c.NO_INTERSTITIAL_AFTER_REWARDED) return { ok: false, reason: 'after_rewarded' };
    if (t - this.lastTapAt < c.NO_INTERSTITIAL_WHILE_TAPPING) return { ok: false, reason: 'tapping' };
    return { ok: true };
  }
  async showInterstitial() {
    this.busy = true; this.platform.gameplayStop();
    try { const r = await this.platform.showInterstitial(); if (r.shown) { this.lastInterstitialAt = this.now(); this.interstitialsThisSession++; } return r; }
    finally { this.busy = false; this.platform.gameplayStart(); }
  }
  async showRewarded() {
    if (this.busy) return { rewarded: false, shown: false, error: true };
    this.busy = true; this.platform.gameplayStop();
    try { const r = await this.platform.showRewarded(); this.lastRewardedAt = this.now(); return r; }
    finally { this.busy = false; this.platform.gameplayStart(); }
  }
}
