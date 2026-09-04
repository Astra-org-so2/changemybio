/** MockPlatform — локальная разработка без SDK. Эмулирует задержки и результаты. */
import { PRODUCTS } from '../config/products.js';
export class MockPlatform {
  constructor() { this.name = 'mock'; this._purchases = []; this.available = true; }
  async init() { await new Promise((r) => setTimeout(r, 50)); return this; }
  get lang() { return (navigator.language || 'ru').startsWith('ru') ? 'ru' : 'en'; }
  get isMobile() { return /Mobi|Android/i.test(navigator.userAgent); }
  getPlayer() { return { id: 'mock', name: 'Tester', photo: '', authorized: false }; }
  async openAuthDialog() {}
  async loadData() { try { return JSON.parse(localStorage.getItem('mock_cloud') || 'null'); } catch { return null; } }
  async saveData(d) { localStorage.setItem('mock_cloud', JSON.stringify(d)); }
  _overlay(label, ms) {
    return new Promise((resolve) => {
      const el = document.createElement('div');
      el.style.cssText = 'position:fixed;inset:0;background:#111;color:#fff;display:flex;flex-direction:column;align-items:center;justify-content:center;z-index:9999;font:20px system-ui;gap:12px';
      el.innerHTML = `<div>[MOCK AD] ${label}</div><div id="mockad-t">${ms / 1000}s</div><button id="mockad-skip" style="padding:12px 24px;font-size:16px">Close (no reward)</button>`;
      document.body.appendChild(el);
      let left = ms / 1000; const iv = setInterval(() => { left--; el.querySelector('#mockad-t').textContent = left + 's'; if (left <= 0) { clearInterval(iv); el.remove(); resolve(true); } }, 1000);
      el.querySelector('#mockad-skip').onclick = () => { clearInterval(iv); el.remove(); resolve(false); };
    });
  }
  async showRewarded() { const ok = await this._overlay('Rewarded video', 3000); return { rewarded: ok, shown: true }; }
  async showInterstitial() { await this._overlay('Interstitial', 2000); return { shown: true }; }
  get paymentsAvailable() { return true; }
  async getCatalog() { return PRODUCTS.map((p) => ({ id: p.id, title: p.title.ru, description: p.desc.ru, price: `${p.fallbackPriceYan} YAN`, priceValue: String(p.fallbackPriceYan), priceCurrencyCode: 'YAN', imageURI: '', getPriceCurrencyImage: () => '' })); }
  async getPurchases() { return this._purchases; }
  async purchase(id) { if (!confirm(`[MOCK] Buy ${id}?`)) throw new Error('cancelled'); const p = { productID: id, purchaseToken: 'tok_' + Date.now(), developerPayload: '' }; this._purchases.push(p); return p; }
  async consumePurchase(token) { this._purchases = this._purchases.filter((p) => p.purchaseToken !== token); }
  async getFlags(defaults) { return defaults; }
  async isAvailable() { return false; }
  async setLeaderboardScore() {}
  async getLeaderboard() { return null; }
  async canShowShortcut() { return true; } async showShortcut() { return confirm('[MOCK] Add shortcut?'); }
  async getLeaderboardSafe(name) { return { userRank: 42, entries: [1,2,3,4,5].map((i) => ({ rank: i, score: Math.round(1e6 / i), player: { publicName: 'Player ' + i, uniqueID: 'u' + i, getAvatarSrc: () => '' } })) }; }
  gameReady() { console.log('[mock] gameReady'); } gameplayStart() {} gameplayStop() {}
  async share(text) { try { await navigator.clipboard.writeText(text); return 'clipboard'; } catch { console.log('[share]', text); return 'clipboard'; } }
}
