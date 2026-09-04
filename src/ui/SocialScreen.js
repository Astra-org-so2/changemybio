/** SocialScreen — событие + лидерборды. Открывается из quick-панели (кнопка 🏆). */
import { h, clear } from './dom.js';
import { t, tr } from '../config/i18n.js';
import { fmt } from '../core/format.js';
import { TimeManager } from '../core/TimeManager.js';
import { bus } from '../core/EventBus.js';

const BOARDS = [
  { id: 'total_coins', title: { ru: 'Всего монет', en: 'Total coins' }, icon: '🪙' },
  { id: 'prestige', title: { ru: 'Очки перезапуска', en: 'Prestige points' }, icon: '⭐' },
  { id: 'collection', title: { ru: 'Коллекция', en: 'Collection' }, icon: '📒' },
];

export class SocialScreen {
  constructor(ui) { this.ui = ui; this.gm = ui.gm; this.el = h('div', { class: 'screen', id: 'scr-social' }); this.scroll = h('div', { class: 'scroll' }); this.el.append(this.scroll); this.board = 'total_coins'; this.cache = {}; bus.on('event_score', () => { if (this.el.classList.contains('active')) this.renderEvent(); }); }
  render() {
    const root = clear(this.scroll);
    this.evBox = h('div'); root.append(this.evBox); this.renderEvent();
    root.append(h('div', { class: 'h1' }, '🏆 ' + t('leaderboard')));
    root.append(h('div', { class: 'row', style: 'margin-bottom:8px' }, BOARDS.map((b) => h('button', { class: 'btn sm' + (this.board === b.id ? '' : ' ghost'), onClick: () => { this.board = b.id; this.render(); } }, b.icon + ' ' + tr(b.title)))));
    this.lbBox = h('div', { class: 'card' }, h('div', { class: 'muted' }, '…')); root.append(this.lbBox); this.loadBoard();
    const p = this.gm.platform.getPlayer();
    if (!p.authorized) root.append(h('div', { class: 'card' }, h('div', { class: 'muted', style: 'margin-bottom:8px' }, t('authWhy')), h('button', { class: 'btn ghost', onClick: async () => { try { await this.gm.platform.openAuthDialog(); this.gm.analytics.track('auth_completed'); this.gm.submitScores(); } catch {} this.render(); } }, '👤 ' + t('login'))));
  }
  renderEvent() {
    const st = this.gm.events.status(); const box = clear(this.evBox);
    if (!st) { box.append(h('div', { class: 'card' }, h('b', {}, '🌀 ' + t('eventNone')), h('div', { class: 'muted' }, t('eventWhen')))); return; }
    box.append(h('div', { class: 'h1' }, st.ev.emoji + ' ' + tr(st.ev.name), h('span', { class: 'sub' }, '⏳ ' + TimeManager.fmtDuration((st.endsAt - this.gm.now()) / 1000))));
    const card = h('div', { class: 'card' }, h('div', { class: 'muted' }, tr(st.ev.desc)), h('div', { class: 'big', style: 'font-size:28px' }, `${st.ev.emoji} ${fmt(st.score)}`));
    for (const m of st.milestones) card.append(h('div', { class: 'q', style: 'margin-top:6px' }, h('div', { class: 'qi' }, h('b', {}, `${st.ev.emoji} ${m.score}`), h('div', { class: 'muted' }, [m.gems && `💎 ${m.gems}`, m.chest && '🎁', m.character && '🌀 ' + t('exclusive')].filter(Boolean).join(' · ')), h('div', { class: 'bar' }, h('i', { style: `width:${Math.min(100, st.score / m.score * 100)}%` }))),
      m.claimed ? h('span', {}, '✅') : h('button', { class: 'btn sm', disabled: !m.done, onClick: () => { if (this.gm.events.claim(m.i)) { this.ui.sound.reward(); this.renderEvent(); } } }, t('claim'))));
    box.append(card);
  }
  async loadBoard() {
    const id = this.board, key = id + ':' + Math.floor(Date.now() / 60000); // кэш 1 мин (лимит 20/5мин)
    const data = this.cache[key] ??= await this.gm.platform.getLeaderboardSafe(id);
    if (this.board !== id) return; const box = clear(this.lbBox);
    if (!data || !data.entries?.length) { box.append(h('div', { class: 'muted' }, t('lbEmpty'))); return; }
    const me = this.gm.platform.getPlayer().id;
    for (const e of data.entries) box.append(h('div', { class: 'row', style: 'padding:6px 0;border-bottom:1px solid #1a1333' + (e.player.uniqueID === me ? ';color:var(--accent)' : '') }, h('b', { style: 'width:32px' }, '#' + e.rank), h('span', { style: 'flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap' }, e.player.publicName || t('hidden')), h('b', {}, fmt(e.score))));
    if (data.userRank) box.append(h('div', { class: 'muted', style: 'margin-top:6px' }, `${t('yourRank')}: #${data.userRank}`));
  }
}
