import { h, clear } from './dom.js';
import { t, tr } from '../config/i18n.js';
import { fmt } from '../core/format.js';
import { bus } from '../core/EventBus.js';

export class QuestScreen {
  constructor(ui) { this.ui = ui; this.gm = ui.gm; this.el = h('div', { class: 'screen', id: 'scr-quests' }); this.scroll = h('div', { class: 'scroll' }); this.el.append(this.scroll); bus.on('quests', () => { this.updateDot(); if (this.el.classList.contains('active') && performance.now() - (this._rt || 0) > 400) { this._rt = performance.now(); this.render(); } }); }
  updateDot() { this.ui.navDot('quests', this.gm.state.quests.list.some((q) => !q.claimed && q.progress >= q.target) || this.gm.daily.status().canClaim); }
  render() {
    const gm = this.gm, s = gm.state, root = clear(this.scroll);
    // daily
    const d = gm.daily.status();
    root.append(h('div', { class: 'h1' }, t('daily')));
    root.append(h('div', { class: 'card' },
      h('div', { class: 'days' }, d.rewards.map((r) => { const done = r.day < d.day || (!d.canClaim && r.day <= d.day); const cur = d.canClaim && r.day === d.day; return h('div', { class: 'day' + (done ? ' done' : '') + (cur ? ' cur' : '') }, `${t('day')} ${r.day}`, h('b', {}, r.chest ? '🎁' : '💎'), `${r.gems}💎`); })),
      h('button', { class: 'btn', disabled: !d.canClaim, onClick: () => this.claimDaily() }, d.canClaim ? t('dailyClaim') : t('comeTomorrow'))));
    // quests
    gm.quests.ensureToday();
    root.append(h('div', { class: 'h1' }, t('questsTitle')));
    for (const q of s.quests.list) {
      const done = q.progress >= q.target;
      root.append(h('div', { class: 'card q' }, h('div', { class: 'qi' }, h('b', {}, tr(gm.quests.titleOf(q))), h('div', { class: 'muted' }, `${fmt(Math.min(q.progress, q.target))} / ${fmt(q.target)}`), h('div', { class: 'bar' }, h('i', { style: `width:${Math.min(100, q.progress / q.target * 100)}%` }))),
        q.claimed ? h('span', { class: 'muted' }, '✅') : h('button', { class: 'btn sm', disabled: !done, onClick: () => { if (gm.quests.claim(q.id)) { this.ui.sound.reward(); this.render(); } } }, `+${q.gems} 💎`)));
    }
    this.updateDot();
  }
  claimDaily() {
    const r = this.gm.daily.claim(); if (!r) return; this.ui.sound.reward();
    this.ui.modal(h('div', { class: 'box' }, h('h2', {}, `${t('daily')} — ${t('day')} ${r.day}`), h('div', { class: 'big' }, `🪙 ${fmt(r.coins)}`), h('div', { style: 'font-size:22px;font-weight:800' }, `💎 ${r.gems}`), h('button', { class: 'btn', style: 'margin-top:12px', onClick: () => this.ui.closeModal() }, 'OK')));
    this.render();
  }
}
