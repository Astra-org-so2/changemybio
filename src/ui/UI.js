import { h, clear, $ } from './dom.js';
import { t } from '../config/i18n.js';
import { fmt } from '../core/format.js';
import { bus } from '../core/EventBus.js';
import { TimeManager } from '../core/TimeManager.js';
import { BALANCE } from '../config/balance.js';
import { Sound } from './Sound.js';
import { MainScreen } from './MainScreen.js';
import { CollectionScreen } from './CollectionScreen.js';
import { ChestScreen } from './ChestScreen.js';
import { ShopScreen } from './ShopScreen.js';
import { QuestScreen } from './QuestScreen.js';
import { PrestigeScreen } from './PrestigeScreen.js';
import { SocialScreen } from './SocialScreen.js';
import { AB } from '../config/ab.js';

export class UI {
  constructor(gm, root) {
    this.gm = gm; this.root = root; this.sound = new Sound(); this.sound.enabled = gm.state.settings.sound;
    this.fxLevel = 1; this.current = 'home'; this._modal = null; this._lastScreenLeave = 0;
    this.build();
  }
  build() {
    this.coinsEl = h('div', { class: 'cur' }, '🪙 ', h('span', {}, '0'));
    this.gemsEl = h('div', { class: 'cur gems' }, '💎 ', h('span', {}, '0'));
    const top = h('div', { class: 'top' }, this.coinsEl, this.gemsEl);
    this.screens = { home: new MainScreen(this), collection: new CollectionScreen(this), chest: new ChestScreen(this), shop: new ShopScreen(this), quests: new QuestScreen(this), prestige: new PrestigeScreen(this), social: new SocialScreen(this) };
    const scr = h('div', { class: 'screens' }, Object.values(this.screens).map((s) => s.el));
    this.navBtns = {};
    const nb = (id, icon, label) => (this.navBtns[id] = h('button', { onClick: () => this.go(id) }, h('span', {}, icon), label));
    const nav = h('div', { class: 'nav' }, nb('home', '🏠', t('home')), nb('quests', '📋', t('quests')), nb('prestige', '⭐', t('prestige')));
    this.frame = h('div', { class: 'frame' }, top, scr, nav);
    clear(this.root).append(this.frame);
    bus.on('toast', (p) => this.toast(p.text || t(p.key)));
    bus.on('offer', (o) => this.showOffer(o));
    this.go('home'); this.renderTop(); this.screens.quests.updateDot();
    // Перфоманс-адаптация: если FPS проседает — уменьшаем партиклы
    this._fpsWatch(); this._scheduleShortcut();
  }
  /** Ярлык на рабочий стол — один раз за сессию, не раньше N сек, не чаще раза в 3 сессии, никогда поверх модалки. */
  _scheduleShortcut() {
    const after = AB.num('shortcut_prompt_after_sec') * 1000, s = this.gm.state;
    if (!after || s.social.shortcutDone || s.stats.sessions - s.social.shortcutAsked < 3) return;
    setTimeout(async () => {
      if (this._modal || !(await this.gm.platform.canShowShortcut())) return;
      s.social.shortcutAsked = s.stats.sessions; const gems = AB.num('shortcut_reward_gems');
      this.gm.analytics.track('shortcut_offered');
      this.modal(h('div', { class: 'box' }, h('h2', {}, t('shortcutTitle')), h('div', { class: 'muted' }, t('shortcutText', { n: gems })), h('div', { class: 'stack' },
        h('button', { class: 'btn', onClick: async () => { this.closeModal(); const ok = await this.gm.platform.showShortcut(); this.gm.analytics.track('shortcut_result', { accepted: ok }); if (ok) { s.social.shortcutDone = true; this.gm.addGems(gems, 'shortcut'); this.sound.reward(); this.renderTop(); this.gm.save(true); } } }, '➕'),
        h('button', { class: 'btn ghost', onClick: () => this.closeModal() }, '✕'))), { closable: true });
    }, after);
  }
  go(id) {
    // interstitial-хук: выход с «тяжёлых» экранов (collection/shop) = логическая пауза
    if (this.current !== id && (this.current === 'collection' || this.current === 'shop') && id === 'home') this.gm.monetization.tryInterstitial('screen_' + this.current);
    for (const k in this.screens) this.screens[k].el.classList.toggle('active', k === id);
    for (const k in this.navBtns) this.navBtns[k].classList.toggle('active', k === id || (id !== 'home' && !this.navBtns[id] && k === 'home'));
    this.current = id; this.screens[id].render?.();
    this.gm.analytics.track('screen_view', { screen: id });
  }
  navDot(id, on) { const b = this.navBtns[id]; if (!b) return; b.querySelector('.dot')?.remove(); if (on) b.append(h('i', { class: 'dot' })); }
  renderTop() { const s = this.gm.state; this.coinsEl.lastChild.textContent = fmt(s.coins); this.gemsEl.lastChild.textContent = fmt(s.gems); }
  toast(text) { const el = h('div', { class: 'toast' }, text); document.body.append(el); setTimeout(() => el.remove(), 2000); }
  modal(box, { closable = false } = {}) {
    this.closeModal();
    const m = h('div', { class: 'modal' }, box); if (closable) m.addEventListener('click', (e) => { if (e.target === m) this.closeModal(); });
    document.body.append(m); this._modal = m;
  }
  closeModal() { if (!this._modal) return; this._modal.remove(); this._modal = null; bus.emit('modal_closed'); }
  async share(charId) { const how = await this.gm.share(charId); if (how === 'clipboard') this.toast(t('copied')); }
  confetti(level) { const p = this.screens.home.particles, r = this.frame.getBoundingClientRect(); const colors = ['#ffcc33', '#ff5fa2', '#4ade80', '#3b82f6', '#a855f7']; for (let i = 0; i < 4 + level * 3; i++) setTimeout(() => p.burst(Math.random() * r.width, Math.random() * r.height * 0.5, 12, colors[i % colors.length], 1.4), i * 60); }

  /** Offline modal — показывается до первого тапа, если есть что забирать */
  showOffline(preview) {
    const gm = this.gm; if (!preview || preview.coins <= 0) return;
    const canAd = gm.monetization.isRewardedAvailable('offline_x2');
    this.modal(h('div', { class: 'box' }, h('h2', {}, t('away')), h('div', { class: 'muted' }, `${t('awayFor')} ${TimeManager.fmtDuration(preview.seconds)}${preview.capped ? ' (max 8h)' : ''}`), h('div', { class: 'big' }, `🪙 ${fmt(preview.coins)}`),
      h('div', { class: 'stack' },
        canAd ? h('button', { class: 'btn ad', onClick: async () => { this.closeModal(); const ok = await gm.monetization.showRewarded('offline_x2'); if (!ok && gm.offlinePreview) { gm.offline.claim(gm.offlinePreview); gm.offlinePreview = null; } this.sound.reward(); this.renderTop(); } }, `${t('claimX2')} (${fmt(preview.coins * BALANCE.adRewardMultiplier)})`) : null,
        h('button', { class: 'btn' + (canAd ? ' ghost' : ''), onClick: () => { this.closeModal(); gm.offline.claim(preview); gm.offlinePreview = null; this.sound.reward(); this.renderTop(); } }, t('claim')))));
    gm.analytics.track('ad_reward_available', { placement: 'offline_x2', coins: preview.coins });
  }
  /** Оффер IAP — одна закрываемая модалка, никогда поверх другой, с реальной ценой из каталога. */
  async showOffer({ product, reason }) {
    if (this._modal) { bus.once('modal_closed', () => setTimeout(() => this.showOffer({ product, reason }), 500)); return; }
    const { PRODUCT_MAP } = await import('../config/products.js'); const { tr } = await import('../config/i18n.js');
    const p = PRODUCT_MAP[product], price = this.gm.monetization.priceOf(product); if (!p || !price) return;
    this.gm.analytics.track('offer_shown', { product_id: product, reason });
    const ICON = { remove_ads: '🚫', starter_pack: '🎒' };
    this.modal(h('div', { class: 'box' }, h('div', { class: 'reveal', style: 'font-size:70px' }, ICON[product]), h('h2', {}, tr(p.title)), h('div', { class: 'muted' }, tr(p.desc)),
      product === 'remove_ads' ? h('div', { class: 'small', style: 'margin-top:6px;color:var(--green)' }, t('offerAdsNote')) : null,
      h('div', { class: 'stack' },
        h('button', { class: 'btn', onClick: async () => { this.closeModal(); this.gm.analytics.track('offer_accepted', { product_id: product, reason }); await this.gm.monetization.purchase(product); } }, `${t('buy')} · ${price.value} ${price.icon ? '' : price.code}`),
        h('button', { class: 'btn ghost', onClick: () => { this.gm.analytics.track('offer_dismissed', { product_id: product, reason }); this.closeModal(); } }, t('later')))), { closable: true });
  }
  _fpsWatch() {
    let frames = 0, last = performance.now();
    const loop = (t) => { frames++; if (t - last > 2000) { const fps = frames / ((t - last) / 1000); frames = 0; last = t; if (fps < 40 && this.fxLevel > 0) { this.fxLevel = 0; this.gm.analytics.track('fx_downgrade', { fps: Math.round(fps) }); } } requestAnimationFrame(loop); };
    requestAnimationFrame(loop);
  }
}
