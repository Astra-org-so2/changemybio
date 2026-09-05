import { h, clear } from './dom.js';
import { t, tr } from '../config/i18n.js';
import { fmt } from '../core/format.js';
import { bus } from '../core/EventBus.js';
import { CHARACTER_MAP } from '../config/characters.js';
import { BALANCE, rarityIndex } from '../config/balance.js';
import { coinsPerSecond, coinsPerTap, currentZone, prestigePreview, zoneName } from '../game/Economy.js';
import { getLang } from '../config/i18n.js';
import { Particles } from './Particles.js';
import { TimeManager } from '../core/TimeManager.js';
import { charVisual } from './Art.js';
import { critChance } from '../game/Economy.js';

export class MainScreen {
  constructor(ui) { this.ui = ui; this.gm = ui.gm; this.el = h('div', { class: 'screen active', id: 'scr-home' }); this.build(); }

  build() {
    const gm = this.gm;
    this.zoneEl = h('div', { class: 'zone' });
    this.charBtn = h('button', { class: 'charBtn', 'aria-label': 'tap' });
    this.charName = h('div', { class: 'charName' });
    this.incomeEl = h('div', { class: 'income' });
    this.comboEl = h('div', { class: 'combo' });
    this.boostsEl = h('div', { class: 'boosts' });
    this.hintEl = h('div', { class: 'hint', style: 'display:none' });
    this.canvas = h('canvas', { id: 'fx' });
    this.stage = h('div', { class: 'stage' }, this.canvas, this.boostsEl, this.comboEl, this.hintEl, this.charBtn, this.charName, h('div', { class: 'tapLabel' }, t('tap')), this.incomeEl);

    // tap handling — pointerdown для минимальной задержки, мультитач ок
    const onDown = (e) => { e.preventDefault(); const r = this.stage.getBoundingClientRect(); this.onTap(e.clientX - r.left, e.clientY - r.top); };
    this.charBtn.addEventListener('pointerdown', onDown);
    this.charBtn.addEventListener('contextmenu', (e) => e.preventDefault());

    this.upgTap = h('button', { class: 'upg', onClick: () => this.buy('tap') });
    this.upgAuto = h('button', { class: 'upg', onClick: () => this.buy('auto') });
    this.upgLuck = h('button', { class: 'upg', onClick: () => this.buy('luck') });
    this.upgrades = h('div', { class: 'upgrades' }, this.upgTap, this.upgAuto, this.upgLuck);

    this.qaChest = h('button', { class: 'qa', onClick: () => this.ui.go('chest') }, h('span', {}, '🎁'), t('chest'));
    this.qaColl = h('button', { class: 'qa', onClick: () => this.ui.go('collection') }, h('span', {}, '📒'), t('collection'));
    this.qaShop = h('button', { class: 'qa', onClick: () => this.ui.go('shop') }, h('span', {}, '🛒'), t('shop'));
    this.qaSocial = h('button', { class: 'qa', onClick: () => this.ui.go('social') }, h('span', {}, '🏆'), t('social'));
    this.quick = h('div', { class: 'quick' }, this.qaColl, this.qaChest, this.qaShop, this.qaSocial);

    this.el.append(this.zoneEl, this.stage, this.upgrades, this.quick);
    this.particles = new Particles(this.canvas);
    bus.on('tap', (p) => this.onTapFx(p));
    bus.on('state', () => this.render());
    bus.on('tick', () => this.renderIncome());
    bus.on('boost', () => this.renderBoosts());
    bus.on('combo_end', () => { this.comboEl.textContent = ''; });
    this.render(); this.setTimers();
  }

  onTap(x, y) {
    this.gm.doTap(x, y);
    this.charBtn.classList.add('pressed'); clearTimeout(this._pt); this._pt = setTimeout(() => this.charBtn.classList.remove('pressed'), 70);
  }

  onTapFx({ x, y, amount, critType, combo, comboTier }) {
    const s = this.gm.state;
    const f = h('div', { class: 'float' + (critType === 'super' ? ' super' : critType ? ' crit' : '') }, (critType === 'super' ? t('superCrit') + ' ' : critType ? t('crit') + ' ' : '') + '+' + fmt(amount));
    f.style.left = x + (Math.random() * 30 - 15) + 'px'; f.style.top = y - 20 + 'px';
    this.stage.append(f); setTimeout(() => f.remove(), critType === 'super' ? 1200 : 800);
    const color = critType === 'super' ? '#ff5fa2' : critType ? '#ffcc33' : '#ffe08a';
    if (this.ui.fxLevel > 0) this.particles.burst(x, y, critType === 'super' ? 30 : critType ? 14 : 5, color, critType ? 1.6 : 1);
    if (critType) { this.stage.classList.remove('shake'); void this.stage.offsetWidth; this.stage.classList.add('shake'); }
    this.ui.sound[critType === 'super' ? 'superCrit' : critType ? 'crit' : 'tap'](combo);
    if (comboTier) { this.comboEl.textContent = `${t('combo')} ${comboTier.label}`; this.comboEl.style.transform = 'scale(1.2)'; setTimeout(() => (this.comboEl.style.transform = ''), 80); }
    else if (combo > 3) this.comboEl.textContent = `${combo}…`;
    // onboarding hints
    if (!s.flags.firstUpgrade && s.stats.taps >= 3) this.showHint(t('upgradeHint'), 'upg');
    this.renderCoins();
  }

  buy(kind) { if (this.gm.upgrades.buy(kind)) { this.ui.sound.buy(); if (!this.gm.state.flags.firstChest && this.gm.state.stats.upgrades >= 2) this.showHint(t('chestHint'), 'chest'); } }

  showHint(text, where) {
    if (this.gm.state.ab.onboarding === 'none') return;
    this.hintEl.textContent = text; this.hintEl.style.display = '';
    this.hintEl.style.top = where === 'upg' ? 'auto' : where === 'chest' ? 'auto' : '40%'; this.hintEl.style.bottom = where === 'upg' || where === 'chest' ? '4px' : 'auto';
    this.qaChest.classList.toggle('pulse', where === 'chest');
    clearTimeout(this._ht); this._ht = setTimeout(() => this.hideHint(), 6000);
  }
  hideHint() { this.hintEl.style.display = 'none'; this.qaChest.classList.remove('pulse'); }

  renderCoins() { this.ui.renderTop(); }
  renderIncome() {
    const s = this.gm.state, now = this.gm.now();
    if (this._incT && performance.now() - this._incT < 250) return; this._incT = performance.now();
    clear(this.incomeEl).append(h('span', {}, '👆 ', h('b', {}, fmt(coinsPerTap(s, now))), t('perTap')), h('span', {}, '⚙️ ', h('b', {}, fmt(coinsPerSecond(s, now))), t('perSec')));
    this.renderUpgrades();
    this.ui.renderTop();
    // prestige hint dot
    const p = prestigePreview(s); this.ui.navDot('prestige', p.can && p.points > 0);
    if (p.can && !s.flags.seenPrestigeHint) { s.flags.seenPrestigeHint = true; this.ui.toast('⭐ ' + t('prestige') + '!'); }
  }
  renderUpgrades() {
    const s = this.gm.state, u = this.gm.upgrades;
    const fill = (el, kind, label, level, val) => {
      const cost = u.cost(kind), can = s.coins >= cost;
      el.classList.toggle('can', can);
      clear(el).append(h('div', { class: 't' }, h('span', {}, label), h('span', { class: 'muted' }, `${t('lvl')}${level}`)), h('div', { class: 'v' }, val), h('div', { class: 'c' }, `🪙 ${fmt(cost)}`));
    };
    fill(this.upgTap, 'tap', '👆 ' + t('power'), s.tapLevel, t('upgrade'));
    fill(this.upgAuto, 'auto', '⚙️ ' + t('auto'), s.autoLevel, t('upgrade'));
    const luckOn = u.luckAvailable(); this.upgrades.classList.toggle('three', luckOn); this.upgLuck.style.display = luckOn ? '' : 'none';
    if (luckOn) { const maxed = s.luckLevel >= BALANCE.luckMaxLevel; fill(this.upgLuck, 'luck', '🍀 ' + t('luck'), s.luckLevel, `${t('crit')} ${(critChance(s) * 100).toFixed(1)}%`); if (maxed) { this.upgLuck.classList.remove('can'); this.upgLuck.querySelector('.c').textContent = 'MAX'; } }
  }
  renderBoosts() {
    const s = this.gm.state, now = this.gm.now(); clear(this.boostsEl);
    for (const k in s.boosts) { const left = Math.ceil((s.boosts[k] - now) / 1000); if (left > 0) this.boostsEl.append(h('div', { class: 'boostPill' }, (k === 'income_x2' ? '⚡x2 ' : '🍀 ') + TimeManager.fmtDuration(left))); }
  }
  render() {
    const ev = this.gm.events.status(); this.qaSocial.querySelector('.badge')?.remove(); if (ev) this.qaSocial.append(h('i', { class: 'badge' }, ev.ev.emoji));
    const s = this.gm.state, c = CHARACTER_MAP[s.activeCharacter] || CHARACTER_MAP[BALANCE.starterCharacterId], z = currentZone(s);
    this.charBtn.className = 'charBtn ' + c.rarity; clear(this.charBtn).append(charVisual(c));
    this.charName.textContent = tr(c.name) + (s.characters[c.id] > 1 ? ` ★${s.characters[c.id]}` : '');
    this.zoneEl.textContent = `${z.emoji} ${t('zone')}: ${zoneName(z, getLang())}` + (s.prestige.count ? ` · ⭐${s.prestige.points} (x${(1 + s.prestige.points * BALANCE.prestigeMultPerPoint).toFixed(1)})` : '');
    this.renderUpgrades(); this.renderBoosts(); this.ui.renderTop();
    // chest badge: можно открыть?
    const can = this.gm.chests.canOpen('basic') || this.gm.monetization.isRewardedAvailable('free_chest') && s.flags.firstChest;
    this.qaChest.querySelector('.badge')?.remove(); if (this.gm.chests.canOpen('basic')) this.qaChest.append(h('i', { class: 'badge' }, '!'));
    if (s.stats.taps === 0 && s.stats.sessions === 1) this.showHint(t('tapHint'), 'char');
    if (rarityIndex(c.rarity) >= 3) this.charBtn.classList.add(c.rarity);
    void can;
  }
  setTimers() { setInterval(() => this.renderBoosts(), 1000); }
}
