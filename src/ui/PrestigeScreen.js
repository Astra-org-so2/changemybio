import { h, clear } from './dom.js';
import { t } from '../config/i18n.js';
import { fmt } from '../core/format.js';
import { BALANCE } from '../config/balance.js';
import { currentZone } from '../game/Economy.js';

export class PrestigeScreen {
  constructor(ui) { this.ui = ui; this.gm = ui.gm; this.el = h('div', { class: 'screen', id: 'scr-prestige' }); this.scroll = h('div', { class: 'scroll' }); this.el.append(this.scroll); setInterval(() => { if (this.el.classList.contains('active')) this.render(); }, 500); }
  render() {
    const gm = this.gm, s = gm.state, p = gm.prestige.preview(), z = currentZone(s), root = clear(this.scroll);
    const nextZone = BALANCE.prestigeZones.find((x) => x.at > s.prestige.count);
    root.append(h('div', { class: 'h1' }, '⭐ ' + t('prestigeTitle')));
    root.append(h('div', { class: 'card', style: 'text-align:center' },
      h('div', { class: 'muted' }, t('prestigeGet')),
      h('div', { class: 'big' }, `+${p.points} ⭐`),
      h('div', {}, `${t('mult')}: x${p.curMult.toFixed(1)} → `, h('b', { style: 'color:var(--green)' }, `x${p.newMult.toFixed(1)}`)),
      h('div', { class: 'bar', style: 'margin:12px 0 4px' }, h('i', { style: `width:${Math.min(100, p.earned / p.threshold * 100)}%` })),
      h('div', { class: 'muted' }, `${t('prestigeNeed')}: ${fmt(p.earned)} / ${fmt(p.threshold)}`),
      h('div', { class: 'stack' },
        h('div', { class: 'small', style: 'color:var(--green)' }, '✅ ' + t('prestigeKeep')),
        h('div', { class: 'small', style: 'color:var(--accent2)' }, '🔄 ' + t('prestigeLose')),
        h('button', { class: 'btn', disabled: !p.can || p.points <= 0, onClick: () => this.confirm(p) }, t('prestigeDo')))));
    root.append(h('div', { class: 'card' }, h('b', {}, `${z.emoji} ${t('zone')}: ${z.name}`), nextZone ? h('div', { class: 'muted' }, `→ ${nextZone.emoji} ${nextZone.name} (${nextZone.at} ⭐)`) : null,
      h('div', { class: 'muted', style: 'margin-top:6px' }, `${t('prestiges')}: ${s.prestige.count} · ⭐ ${s.prestige.points}`)));
  }
  confirm(p) {
    this.ui.modal(h('div', { class: 'box' }, h('h2', {}, t('prestigeTitle') + '?'), h('div', { class: 'big' }, `+${p.points} ⭐`), h('div', { class: 'muted' }, t('prestigeLose')),
      h('div', { class: 'stack' }, h('button', { class: 'btn', onClick: () => this.doIt() }, t('prestigeDo')), h('button', { class: 'btn ghost', onClick: () => this.ui.closeModal() }, '✕'))));
  }
  async doIt() {
    this.ui.closeModal();
    if (!this.gm.prestige.doPrestige()) return;
    this.ui.sound.prestige(); this.ui.confetti(3);
    this.ui.go('home');
    // interstitial — логическая пауза ПОСЛЕ анимации prestige
    setTimeout(() => this.gm.monetization.tryInterstitial('prestige'), 1500);
  }
}
