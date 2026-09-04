import { h, clear } from './dom.js';
import { t, tr } from '../config/i18n.js';
import { PRODUCTS } from '../config/products.js';
import { TimeManager } from '../core/TimeManager.js';

const ICON = { remove_ads: '🚫', starter_pack: '🎒', gems_small: '💎', gems_medium: '💎💎', gems_large: '💰', premium_pack: '👑' };

export class ShopScreen {
  constructor(ui) { this.ui = ui; this.gm = ui.gm; this.el = h('div', { class: 'screen', id: 'scr-shop' }); this.scroll = h('div', { class: 'scroll' }); this.el.append(this.scroll); setInterval(() => { if (this.el.classList.contains('active')) this.render(); }, 1000); }
  render() {
    const gm = this.gm, s = gm.state, m = gm.monetization, root = clear(this.scroll);
    root.append(h('div', { class: 'h1' }, t('shop')));
    // --- rewarded (добровольные сделки) ---
    root.append(h('div', { class: 'h1', style: 'font-size:14px' }, '📺 ' + t('reward')));
    const adBtn = (placement, label, icon) => h('div', { class: 'card prod' }, h('div', { class: 'pi' }, icon), h('div', { class: 'pt' }, h('b', {}, label)),
      h('button', { class: 'btn sm ad', disabled: !m.isRewardedAvailable(placement), onClick: async () => { await m.showRewarded(placement); this.render(); } }, '📺'));
    root.append(adBtn('income_x2', t('boostX2'), '⚡'), adBtn('bonus_pack', t('bonusPack'), '🎁'), adBtn('lucky', t('lucky'), '🍀'));
    // --- IAP ---
    root.append(h('div', { class: 'h1', style: 'font-size:14px;margin-top:10px' }, '💳 ' + t('buy')));
    if (!m.paymentsAvailable) root.append(h('div', { class: 'muted' }, t('soon')));
    for (const p of PRODUCTS) {
      if (p.unlockByOffer && !s.offers.starterUnlocked) continue;
      if (p.once && s.purchases.starterBought) continue;
      const owned = p.type === 'non_consumable' && s.purchases.owned.includes(p.id);
      const price = m.priceOf(p.id);
      const priceEl = price ? h('span', { class: 'row' }, price.icon ? h('img', { src: price.icon, style: 'height:16px' }) : null, price.value + (price.icon ? '' : ' ' + price.code)) : '—';
      root.append(h('div', { class: 'card prod' + (p.featured ? ' featured' : '') }, h('div', { class: 'pi' }, ICON[p.id]), h('div', { class: 'pt' }, h('b', {}, tr(p.title)), h('span', { class: 'muted' }, tr(p.desc))),
        h('button', { class: 'btn sm', disabled: owned || !m.paymentsAvailable || !price, onClick: async () => { await m.purchase(p.id); this.render(); } }, owned ? t('owned') : priceEl)));
    }
    // --- settings ---
    root.append(h('div', { class: 'h1', style: 'font-size:14px;margin-top:10px' }, '⚙️ ' + t('settings')));
    root.append(h('div', { class: 'card' },
      h('div', { class: 'set' }, t('sound'), h('button', { class: 'toggle' + (s.settings.sound ? ' on' : ''), onClick: (e) => { s.settings.sound = !s.settings.sound; this.ui.sound.enabled = s.settings.sound; e.currentTarget.classList.toggle('on'); gm.save(); } })),
      h('div', { class: 'set' }, t('lang'), h('button', { class: 'btn ghost sm', onClick: () => { s.settings.lang = s.settings.lang === 'en' ? 'ru' : 'en'; gm.save(true); location.reload(); } }, s.settings.lang || '(auto)')),
      h('div', { class: 'set small muted' }, `${t('stats')}: ${t('taps')} ${s.stats.taps} · ${t('chestsOpened')} ${s.stats.chests} · ${t('prestiges')} ${s.stats.prestiges} · ${TimeManager.fmtDuration((Date.now() - s.createdAt) / 1000)}`),
    ));
  }
}
