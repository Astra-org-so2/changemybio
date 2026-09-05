/**
 * MonetizationManager — ЕДИНСТВЕННАЯ точка входа к рекламе и покупкам.
 * GameManager вызывает: showRewarded('offline_x2'), tryInterstitial('prestige'), purchase('remove_ads').
 */
import { AdManager } from './AdManager.js';
import { PaymentManager } from './PaymentManager.js';
import { BALANCE } from '../config/balance.js';
import { AB } from '../config/ab.js';
import { bus } from '../core/EventBus.js';

export const REWARDED_PLACEMENTS = ['offline_x2', 'income_x2', 'free_chest', 'bonus_pack', 'lucky', 'quest_ad'];

export class MonetizationManager {
  constructor(gm, platform) {
    this.gm = gm; this.platform = platform;
    this.ads = new AdManager(platform, () => gm.now());
    this.pay = new PaymentManager(platform);
  }
  async init() { await this.pay.init(); }
  get removeAds() { return !!this.gm.state.purchases.removeAds; }

  // ---------- REWARDED ----------
  cooldownLeft(placement) { const at = this.gm.state.cooldowns[placement] || 0; return Math.max(0, at - this.gm.now()); }
  isRewardedAvailable(placement) { return !this.ads.busy && this.cooldownLeft(placement) === 0; }

  /** Возвращает true если награда выдана. Награду применяет GameManager.applyReward. */
  async showRewarded(placement, ctx = {}) {
    const a = this.gm.analytics;
    if (!this.isRewardedAvailable(placement)) return false;
    a.track('ad_reward_started', { placement });
    const r = await this.ads.showRewarded();
    if (r.rewarded) {
      a.track('ad_reward_completed', { placement });
      this.gm.state.stats.adsWatched++;
      this.gm.quests.progress('ad', 1);
      if (placement === 'free_chest') this.gm.state.cooldowns[placement] = this.gm.now() + AB.num('free_chest_cooldown_sec') * 1000;
      this.gm.applyReward(placement, ctx);
      this.ads.block(15_000); // нет interstitial сразу после rewarded (доп. к 60с правилу)
      return true;
    }
    a.track(r.error ? 'ad_reward_error' : 'ad_reward_skipped', { placement });
    if (r.error) bus.emit('toast', { key: 'adFail' });
    return false;
  }

  // ---------- INTERSTITIAL ----------
  async tryInterstitial(trigger) {
    const check = this.ads.canShowInterstitial(this.removeAds);
    this.gm.analytics.track('interstitial_check', { trigger, ok: check.ok, reason: check.reason });
    if (!check.ok) return false;
    const r = await this.ads.showInterstitial();
    if (r.shown) {
      this.gm.analytics.track('interstitial_shown', { trigger, count: this.ads.interstitialsThisSession });
      this.gm.state.stats.interstitials = (this.gm.state.stats.interstitials || 0) + 1;
      this._maybeRemoveAdsOffer();
    }
    return r.shown;
  }
  blockAds(ms) { this.ads.block(ms); }

  // ---------- OFFERS (мягкие, закрываемые, с cooldown по сессиям) ----------
  _maybeRemoveAdsOffer() {
    const s = this.gm.state, n = AB.num('remove_ads_offer_after_int');
    if (!n || this.removeAds || !this.paymentsAvailable || !this.priceOf('remove_ads')) return;
    if (s.stats.interstitials < n) return;
    if (s.stats.sessions - s.offers.removeAdsShownSession < AB.num('remove_ads_offer_cooldown_sessions')) return;
    s.offers.removeAdsShownSession = s.stats.sessions;
    setTimeout(() => bus.emit('offer', { product: 'remove_ads', reason: 'after_interstitial' }), 800);
  }
  /** Вызывается из GameManager при событиях-триггерах: 'prestige' | 'epic'. */
  onStarterTrigger(kind) {
    const s = this.gm.state, mode = AB.get('starter_pack_trigger');
    if (mode === 'none' || mode !== kind || s.purchases.starterBought) return;
    s.offers.starterUnlocked = true;
    if (!this.paymentsAvailable || !this.priceOf('starter_pack')) return;
    if (s.stats.sessions - s.offers.starterShownSession < AB.num('starter_pack_offer_cooldown_sessions')) return;
    s.offers.starterShownSession = s.stats.sessions;
    setTimeout(() => bus.emit('offer', { product: 'starter_pack', reason: kind }), 2500); // после анимации/конфетти
  }
  noteTap() { this.ads.noteTap(); }

  // ---------- IAP ----------
  get paymentsAvailable() { return this.platform.paymentsAvailable; }
  priceOf(id) { return this.pay.priceOf(id); }
  async restorePurchases() { await this.pay.restore((prod, p) => this.gm.applyPurchase(prod, p), this.gm.state); }
  async purchase(id) {
    const a = this.gm.analytics; a.track('purchase_started', { product_id: id });
    try {
      const price = this.priceOf(id);
      await this.pay.buy(id, (prod, p) => this.gm.applyPurchase(prod, p), this.gm.state);
      a.track('purchase_completed', { product_id: id, price: price?.value, currency: price?.code });
      bus.emit('toast', { key: 'purchaseOk' }); return true;
    } catch (e) {
      a.track('purchase_failed', { product_id: id, error: String(e?.message || e).slice(0, 80) });
      bus.emit('toast', { key: 'purchaseFail' }); return false;
    }
  }
}
