import { h, clear } from './dom.js';
import { t, tr } from '../config/i18n.js';
import { fmt, pct } from '../core/format.js';
import { BALANCE } from '../config/balance.js';
import { charVisual } from './Art.js';

export class CollectionScreen {
  constructor(ui) { this.ui = ui; this.gm = ui.gm; this.el = h('div', { class: 'screen', id: 'scr-collection' }); this.scroll = h('div', { class: 'scroll' }); this.el.append(this.scroll); }
  render() {
    const gm = this.gm, s = gm.state, p = gm.collection.progress();
    const root = clear(this.scroll);
    root.append(h('div', { class: 'h1' }, t('collection'), h('span', { class: 'sub' }, `${p.owned}/${p.total} (${pct(p.pct)})`)));
    root.append(h('div', { class: 'card' },
      h('div', { class: 'row', style: 'justify-content:space-between' }, h('b', {}, t('collBonus')), h('b', { style: 'color:var(--green)' }, `+${Math.round(p.bonus * 100)}% ${t('income')}`)),
      h('div', { class: 'bar', style: 'margin:8px 0' }, h('i', { style: `width:${p.pct * 100}%` })),
      h('div', { class: 'muted' }, BALANCE.collectionBonus.map((b) => `${b.pct * 100}% → +${b.bonus * 100}%`).join('  ·  ')),
    ));
    for (const r of BALANCE.rarityOrder) {
      const list = gm.collection.list().filter((c) => c.rarity === r);
      if (!list.length) continue;
      const owned = list.filter((c) => c.owned).length;
      root.append(h('div', { class: 'h1', style: 'margin-top:12px' }, h('span', { class: 'rar r-' + r, style: 'font-size:13px' }, t('rarity')[r]), h('span', { class: 'sub' }, `${owned}/${list.length}`)));
      root.append(h('div', { class: 'grid' }, list.map((c) => h('button', { class: `cc b-${r} ${c.owned ? '' : 'unknown'} ${s.activeCharacter === c.id ? 'active' : ''}`, onClick: () => this.detail(c) }, charVisual(c, 'e'), c.owned && c.level > 1 ? h('span', { class: 'lv' }, `★${c.level}`) : null))));
    }
  }
  detail(c) {
    const s = this.gm.state, lvlK = 1 + (Math.max(1, c.level) - 1) * BALANCE.duplicateLevelBonus;
    const box = h('div', { class: 'box ' + (c.owned ? 'glow-' + c.rarity : '') },
      h('div', { class: 'rar r-' + c.rarity }, t('rarity')[c.rarity]),
      h('div', { class: 'reveal', style: c.owned ? '' : 'filter:brightness(0) opacity(.5)' }, c.emoji),
      h('h2', {}, c.owned ? tr(c.name) : t('unknown')),
      h('div', { class: 'muted', style: 'margin-bottom:8px' }, c.owned ? tr(c.description) : ''),
      c.owned ? h('div', { class: 'small' }, `${t('mult')}: +${Math.round((c.baseMultiplier - 1) * 100 * lvlK)}% · 👆 +${Math.round((c.tapMultiplier - 1) * 100 * lvlK)}% · ⚙️ +${fmt(c.passiveIncome * lvlK)}${t('perSec')}` + (c.level > 1 ? ` · ★${c.level}` : '')) : h('div', { class: 'small muted' }, '🎁'),
      h('div', { class: 'stack' },
        c.owned && s.activeCharacter !== c.id ? h('button', { class: 'btn', onClick: () => { this.gm.collection.setActive(c.id); this.ui.closeModal(); this.render(); } }, '✅') : null,
        c.owned ? h('button', { class: 'btn ghost', onClick: () => this.ui.share(c.id) }, '📤 ' + t('share')) : null,
        h('button', { class: 'btn ghost', onClick: () => this.ui.closeModal() }, '✕')),
    );
    this.ui.modal(box);
  }
}
