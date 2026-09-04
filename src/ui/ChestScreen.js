import { h, clear } from './dom.js';
import { t, tr } from '../config/i18n.js';
import { fmt, pct } from '../core/format.js';
import { BALANCE, RARITY, rarityIndex } from '../config/balance.js';
import { TimeManager } from '../core/TimeManager.js';
import { bus } from '../core/EventBus.js';
import { charVisual } from './Art.js';

const ICON = { basic: '📦', rare: '🎁', epic: '💎', legendary: '👑' };
const NAME = { basic: { ru: 'Обычный сундук', en: 'Basic Chest' }, rare: { ru: 'Редкий сундук', en: 'Rare Chest' }, epic: { ru: 'Эпический сундук', en: 'Epic Chest' }, legendary: { ru: 'Легендарный сундук', en: 'Legendary Chest' } };

export class ChestScreen {
  constructor(ui) {
    this.ui = ui; this.gm = ui.gm; this.el = h('div', { class: 'screen', id: 'scr-chest' }); this.scroll = h('div', { class: 'scroll' }); this.el.append(this.scroll);
    bus.on('chest_result', (r) => this.showResult(r));
    bus.on('state', () => { if (this.el.classList.contains('active')) this.render(); });
    setInterval(() => { if (this.el.classList.contains('active')) this.renderFree(); }, 1000);
  }
  render() {
    const gm = this.gm, s = gm.state, root = clear(this.scroll);
    root.append(h('div', { class: 'h1' }, t('chest'), h('span', { class: 'sub' }, `💎 ${fmt(s.gems)}`)));
    this.freeCard = h('div', { class: 'card' }); root.append(this.freeCard); this.renderFree();
    for (const type in BALANCE.chests) {
      const i = gm.chests.info(type), can = gm.chests.canOpen(type);
      root.append(h('div', { class: 'card chest' },
        h('div', { class: 'ico' }, ICON[type]),
        h('div', { class: 'info' },
          h('b', {}, tr(NAME[type])),
          h('div', { class: 'odds' }, RARITY.filter((r) => i.weights[r] > 0).map((r) => h('span', { class: 'r-' + r }, `${t('rarity')[r]} ${pct(i.weights[r])}`))),
          h('div', { class: 'pity' }, t('pityIn', { r: t('rarity')[i.pityMinRarity], n: i.pityLeft }))),
        h('button', { class: 'btn sm', disabled: !can, onClick: () => this.open(type) }, `${i.currency === 'coins' ? '🪙' : '💎'} ${fmt(i.cost)}`)));
    }
    root.append(h('div', { class: 'muted', style: 'text-align:center;margin-top:8px' }, t('dup')));
  }
  renderFree() {
    if (!this.freeCard) return; const m = this.gm.monetization, left = m.cooldownLeft('free_chest');
    clear(this.freeCard).append(h('div', { class: 'chest' }, h('div', { class: 'ico' }, '📺'), h('div', { class: 'info' }, h('b', {}, tr(NAME.basic)), h('div', { class: 'muted' }, t('openFree'))),
      h('button', { class: 'btn sm ad', disabled: left > 0, onClick: async () => { await m.showRewarded('free_chest'); this.render(); } }, left > 0 ? t('cooldown', { t: TimeManager.fmtDuration(left / 1000) }) : t('openFree'))));
  }
  open(type) { const r = this.gm.chests.open(type); if (r) this.render(); }
  showResult(r) {
    const ri = rarityIndex(r.rarity), s = this.gm.state;
    this.ui.sound.chest(ri);
    this.gm.monetization.blockAds(ri >= 2 ? 20_000 : 5_000); // никакой рекламы поверх редкого дропа
    const box = h('div', { class: 'box glow-' + r.rarity },
      h('div', { class: 'rar r-' + r.rarity }, t('rarity')[r.rarity] + (r.pityHit ? ' · ' + t('pity') : '')),
      h('div', { class: 'reveal' }, charVisual(r.character)),
      h('h2', {}, tr(r.character.name)),
      r.isNew ? h('span', { class: 'newTag' }, t('newChar')) : h('div', { class: 'muted' }, `${t('dup')} ★${r.level}` + (r.gems ? ` · +${r.gems} 💎` : '')),
      h('div', { class: 'muted', style: 'margin-top:6px' }, tr(r.character.description)),
      h('div', { class: 'stack' },
        ri >= 2 ? h('button', { class: 'btn ghost', onClick: () => this.ui.share(r.character.id) }, '📤 ' + t('share')) : null,
        h('button', { class: 'btn', onClick: () => { this.ui.closeModal(); if (r.isNew && ri >= 2) { s.activeCharacter = r.character.id; this.gm.emitState(); } } }, 'OK')));
    this.ui.modal(box, { closable: true });
    if (this.ui.fxLevel > 0) this.ui.confetti(ri);
    this.gm.collection.checkMilestones();
  }
}
