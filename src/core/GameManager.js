/**
 * GameManager — оркестратор. Владеет state и системами. Не знает про DOM.
 * UI подписывается на bus: 'state', 'tap', 'chest_result', 'prestige', 'toast', 'boost', 'quests'.
 */
import { bus } from './EventBus.js';
import { TimeManager } from './TimeManager.js';
import { SaveManager } from './SaveManager.js';
import { BALANCE } from '../config/balance.js';
import { AB, AB_DEFAULTS } from '../config/ab.js';
import { setLang } from '../config/i18n.js';
import { CHARACTER_MAP } from '../config/characters.js';
import { TapSystem } from '../game/TapSystem.js';
import { UpgradeSystem } from '../game/UpgradeSystem.js';
import { ChestSystem } from '../game/ChestSystem.js';
import { PrestigeSystem } from '../game/PrestigeSystem.js';
import { CollectionSystem } from '../game/CollectionSystem.js';
import { QuestSystem } from '../game/QuestSystem.js';
import { AchievementSystem } from '../game/AchievementSystem.js';
import { DailySystem } from '../game/DailySystem.js';
import { OfflineSystem } from '../game/OfflineSystem.js';
import { EventSystem } from '../game/EventSystem.js';
import { coinsPerSecond, coinsPerTap } from '../game/Economy.js';
import { MonetizationManager } from '../platform/MonetizationManager.js';
import { LeaderboardManager } from '../platform/LeaderboardManager.js';
import { AnalyticsManager } from '../analytics/AnalyticsManager.js';

const TICK_MS = 100;
const AUTOSAVE_MS = 10_000;

export class GameManager {
  constructor(platform, { debug = false } = {}) {
    this.platform = platform;
    this.analytics = new AnalyticsManager({ debug });
    this.saveMgr = new SaveManager(platform);
    this.state = null;
    this.tap = new TapSystem(this);
    this.upgrades = new UpgradeSystem(this);
    this.chests = new ChestSystem(this);
    this.prestige = new PrestigeSystem(this);
    this.collection = new CollectionSystem(this);
    this.quests = new QuestSystem(this);
    this.achievements = new AchievementSystem(this);
    for (const ev of ['chest_result', 'prestige', 'quests']) bus.on(ev, () => this.achievements.check());
    this.daily = new DailySystem(this);
    this.offline = new OfflineSystem(this);
    this.events = new EventSystem(this);
    this.monetization = new MonetizationManager(this, platform);
    this.leaderboards = new LeaderboardManager(platform);
    this._lastTick = 0; this._lastSave = 0; this._acc = 0; this._running = false;
    this._earnWindow = { t: 0, sum: 0 }; // anti-cheat: скорость начисления
  }
  now() { return TimeManager.now(); }

  async init() {
    this.analytics.track('game_start', { platform: this.platform.name });
    const { state, source } = await this.saveMgr.load();
    this.state = state;
    this.analytics.track('save_loaded', { source, age_days: Math.floor((this.now() - state.createdAt) / 86400000) });
    // язык
    setLang(state.settings.lang || this.platform.lang);
    // remote config / AB
    const flags = await this.platform.getFlags(AB_DEFAULTS, [{ name: 'prestige_count', value: String(state.prestige.count) }]);
    AB.set(flags); state.ab = { title: AB.get('game_title_variant'), onboarding: AB.get('onboarding_variant') };
    await this.monetization.init();
    // offline preview ДО обновления lastSeen
    this.offlinePreview = this.offline.compute(state, this.now());
    state.stats.sessions++;
    this.quests.ensureToday();
    this.analytics.track('session_start', { session: state.stats.sessions, prestige: state.prestige.count, characters: Object.keys(state.characters).length });
    if (state.stats.sessions === 1) this.analytics.track('tutorial_start');
    // восстановление покупок (обязательно, 1.13.1)
    this.monetization.restorePurchases().catch(() => {});
    this._bindLifecycle();
    return this;
  }

  start() {
    this._running = true; this._lastTick = performance.now();
    const loop = (t) => {
      if (!this._running) return;
      const dt = Math.min(1000, t - this._lastTick); this._lastTick = t; this._acc += dt;
      while (this._acc >= TICK_MS) { this._acc -= TICK_MS; this._tick(TICK_MS / 1000); }
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
    this.platform.gameplayStart();
  }

  _tick(dtSec) {
    const s = this.state, now = this.now();
    const cps = coinsPerSecond(s, now);
    if (cps > 0) this.addCoins(cps * dtSec, 'auto', true);
    this.tap.update();
    // бусты
    let boostChanged = false;
    for (const k in s.boosts) if (s.boosts[k] <= now) { delete s.boosts[k]; boostChanged = true; }
    if (boostChanged) bus.emit('boost');
    bus.emit('tick', { cps, cpt: coinsPerTap(s, now) });
    if (performance.now() - this._lastSave > AUTOSAVE_MS) { this.save(); }
    if ((s.stats.taps & 63) === 0) this.analytics.tickRetention(s);
    if (performance.now() - (this._lastAch || 0) > 5000) { this._lastAch = performance.now(); this.achievements.check(); }
    if (performance.now() - (this._lastLb || 0) > 90_000) { this._lastLb = performance.now(); this.submitScores(); }
  }

  // ---------- валюта ----------
  addCoins(n, source, silent = false) {
    if (!Number.isFinite(n) || n <= 0) return;
    const s = this.state;
    // sanity: не более X/сек по потоку (кроме разовых наград)
    if (source === 'auto' || source === 'tap') {
      const t = this.now(); if (t - this._earnWindow.t > 1000) this._earnWindow = { t, sum: 0 };
      this._earnWindow.sum += n; if (this._earnWindow.sum > BALANCE.maxCoinsPerSecondSanity) return;
    }
    s.coins += n; s.totalEarned += n; s.runEarned += n;
    this.quests.progress('earn', n);
    if (!silent) bus.emit('state');
  }
  addGems(n, source) { if (!Number.isFinite(n) || n <= 0) return; this.state.gems += n; this.analytics.track('gems_gained', { amount: n, source }); }
  spendGems(n) { if (this.state.gems < n) return false; this.state.gems -= n; return true; }
  emitState() { bus.emit('state'); }

  // ---------- действия ----------
  doTap(x, y) { this.monetization.noteTap(); const a = this.tap.tap(x, y); this.events.onTap(); return a; }

  /** Периодическая отправка очков в лидерборды (троттлится в LeaderboardManager). */
  submitScores() {
    const s = this.state;
    this.leaderboards.submit('total_coins', s.totalEarned);
    this.leaderboards.submit('prestige', s.prestige.points);
    this.leaderboards.submit('collection', Object.keys(s.characters).length);
    this.events.submitScore();
  }

  // ---------- rewarded: применение наград ----------
  applyReward(placement, ctx) {
    const s = this.state, now = this.now(), m = AB.num('rewarded_reward_mult');
    switch (placement) {
      case 'offline_x2': if (this.offlinePreview) { this.offline.claim(this.offlinePreview, BALANCE.adRewardMultiplier * m); this.offlinePreview = null; } break;
      case 'income_x2': s.boosts.income_x2 = Math.max(s.boosts.income_x2 || 0, now) + AB.num('income_boost_duration_sec') * 1000; bus.emit('boost'); break;
      case 'lucky': s.boosts.lucky = Math.max(s.boosts.lucky || 0, now) + BALANCE.boosts.lucky.durationSec * 1000; bus.emit('boost'); break;
      case 'bonus_pack': { const c = Math.max(BALANCE.boosts.bonus_pack.minCoins, coinsPerSecond(s, now) * 60 * BALANCE.boosts.bonus_pack.minutesOfIncome) * m; this.addCoins(c, 'bonus_pack'); bus.emit('toast', { text: `+${Math.floor(c)}` }); break; }
      case 'free_chest': this.chests.open('basic', 'rewarded'); break;
      case 'quest_ad': break; // прогресс квеста уже засчитан
    }
    this.emitState(); this.save(true);
  }

  // ---------- IAP: применение ----------
  applyPurchase(prod, p) {
    const s = this.state, g = prod.grant;
    if (prod.type === 'non_consumable' && s.purchases.owned.includes(prod.id)) return;
    if (g.removeAds) s.purchases.removeAds = true;
    if (g.gems) this.addGems(g.gems, 'iap');
    if (g.character && !s.characters[g.character]) s.characters[g.character] = 1;
    if (g.chest) this.chests.open(g.chest, 'iap');
    if (g.boostMinutes) s.boosts.income_x2 = Math.max(s.boosts.income_x2 || 0, this.now()) + g.boostMinutes * 60_000;
    if (prod.type === 'non_consumable') s.purchases.owned.push(prod.id);
    if (prod.id === 'starter_pack') s.purchases.starterBought = true;
    if (g.removeAds) this.platform.hideBanner?.();
    this.emitState(); this.save(true);
  }

  // ---------- жизненный цикл ----------
  save(flush = false) { this._lastSave = performance.now(); this.saveMgr.save(this.state, { flush }); }
  _bindLifecycle() {
    const onHide = () => { this.save(true); this.platform.gameplayStop(); this.analytics.track('session_end', { duration_sec: Math.floor((Date.now() - this.analytics.sessionStart) / 1000), taps: this.state.stats.taps }); };
    document.addEventListener('visibilitychange', () => { if (document.hidden) onHide(); else { this.state.lastSeen = this.now(); this.platform.gameplayStart(); } });
    window.addEventListener('pagehide', onHide);
    window.addEventListener('beforeunload', onHide);
  }

  // ---------- share ----------
  async share(charId) {
    const c = CHARACTER_MAP[charId]; if (!c) return null;
    const { t, tr } = await import('../config/i18n.js');
    const text = t('shareText', { r: t('rarity')[c.rarity], n: tr(c.name) });
    const how = await this.platform.share(text);
    this.analytics.track('share', { character_id: charId, rarity: c.rarity, method: how });
    return how;
  }
}
