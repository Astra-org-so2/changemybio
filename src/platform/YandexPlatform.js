/**
 * YandexPlatform — адаптер над официальным Yandex Games SDK (window.YaGames).
 * Использует ТОЛЬКО документированные методы (docs: yandex.ru/dev/games/doc):
 *  YaGames.init(), ysdk.getPlayer(), player.getData/setData/isAuthorized/getName/getPhoto/getUniqueID,
 *  ysdk.adv.showRewardedVideo/showFullscreenAdv, ysdk.payments.purchase/getPurchases/getCatalog/consumePurchase,
 *  ysdk.leaderboards.setScore/getEntries/getPlayerEntry, ysdk.getFlags, ysdk.environment,
 *  ysdk.features.LoadingAPI.ready, ysdk.features.GameplayAPI.start/stop, ysdk.clipboard.writeText,
 *  ysdk.isAvailableMethod, ysdk.auth.openAuthDialog
 */
export class YandexPlatform {
  constructor() { this.ysdk = null; this.player = null; this.payments = null; this.name = 'yandex'; }
  get available() { return !!this.ysdk; }

  async init() {
    if (!window.YaGames) throw new Error('YaGames not found');
    this.ysdk = await window.YaGames.init();
    try { this.player = await this.ysdk.getPlayer(); } catch (e) { console.warn('[YSDK] getPlayer failed', e); }
    try { this.payments = await this.ysdk.getPayments(); } catch (e) { this.payments = null; /* покупки не подключены */ }
    return this;
  }

  get lang() { return this.ysdk?.environment?.i18n?.lang || 'ru'; }
  get deviceType() { try { return this.ysdk?.deviceInfo?.type || 'desktop'; } catch { return 'desktop'; } }
  get isMobile() { return this.deviceType === 'mobile' || this.deviceType === 'tablet'; }

  getPlayer() {
    if (!this.player) return { id: null, name: '', photo: '', authorized: false };
    return { id: this.player.getUniqueID(), name: this.player.getName?.() || '', photo: this.player.getPhoto?.('small') || '', authorized: this.player.isAuthorized?.() || false };
  }
  async openAuthDialog() { await this.ysdk.auth.openAuthDialog(); this.player = await this.ysdk.getPlayer(); }

  async loadData(keys) { if (!this.player) return null; return this.player.getData(keys); }
  async saveData(data, flush = false) { if (!this.player) return; return this.player.setData(data, flush); }

  /** resolve({ rewarded: boolean, shown: boolean }) — никогда не reject */
  showRewarded() {
    return new Promise((resolve) => {
      let rewarded = false;
      this.ysdk.adv.showRewardedVideo({ callbacks: {
        onOpen: () => {}, onRewarded: () => { rewarded = true; },
        onClose: (wasShown) => resolve({ rewarded, shown: !!wasShown }),
        onError: (e) => { console.warn('[YSDK] rewarded error', e); resolve({ rewarded: false, shown: false, error: true }); },
      } });
    });
  }
  showInterstitial() {
    return new Promise((resolve) => {
      this.ysdk.adv.showFullscreenAdv({ callbacks: {
        onClose: (wasShown) => resolve({ shown: !!wasShown }),
        onError: (e) => { console.warn('[YSDK] interstitial error', e); resolve({ shown: false, error: true }); },
      } });
    });
  }

  get paymentsAvailable() { return !!this.payments; }
  async getCatalog() { return this.payments ? this.payments.getCatalog() : []; }
  async getPurchases() { return this.payments ? this.payments.getPurchases() : []; }
  async purchase(id, developerPayload) { if (!this.payments) throw new Error('payments unavailable'); return this.payments.purchase({ id, developerPayload }); }
  async consumePurchase(token) { return this.payments.consumePurchase(token); }

  async getFlags(defaultFlags, clientFeatures) { try { return await this.ysdk.getFlags({ defaultFlags, clientFeatures }); } catch { return defaultFlags; } }

  async isAvailable(method) { try { return await this.ysdk.isAvailableMethod(method); } catch { return false; } }
  async setLeaderboardScore(name, score) { if (await this.isAvailable('leaderboards.setScore')) return this.ysdk.leaderboards.setScore(name, Math.floor(score)); }
  async getLeaderboard(name, opts = { quantityTop: 10, includeUser: true, quantityAround: 3 }) { return this.ysdk.leaderboards.getEntries(name, opts); }

  async canShowShortcut() { try { return (await this.ysdk.shortcut.canShowPrompt()).canShow; } catch { return false; } }
  async showShortcut() { try { return (await this.ysdk.shortcut.showPrompt()).outcome === 'accepted'; } catch { return false; } }
  async getLeaderboardSafe(name) { try { return await this.getLeaderboard(name); } catch (e) { return null; } }
  async hideBanner() { try { await this.ysdk.adv.hideBannerAdv(); } catch {} }
  gameReady() { try { this.ysdk.features.LoadingAPI?.ready(); } catch {} }
  gameplayStart() { try { this.ysdk.features.GameplayAPI?.start(); } catch {} }
  gameplayStop() { try { this.ysdk.features.GameplayAPI?.stop(); } catch {} }

  /** Share: SDK не предоставляет share-диалога; используем clipboard API SDK + Web Share как fallback. */
  async share(text) {
    try { if (navigator.share) { await navigator.share({ text }); return 'native'; } } catch {}
    try { await this.ysdk.clipboard.writeText(text); return 'clipboard'; } catch {}
    try { await navigator.clipboard.writeText(text); return 'clipboard'; } catch {}
    return null;
  }
}
