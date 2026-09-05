import { BALANCE, RARITY, rarityIndex } from '../config/balance.js';
import { byRarity, CHARACTER_MAP } from '../config/characters.js';
import { bus } from '../core/EventBus.js';
import { chestCost } from './Economy.js';

export class ChestSystem {
  constructor(gm) { this.gm = gm; }

  info(type) {
    const cfg = BALANCE.chests[type], s = this.gm.state;
    const pityCount = s.chests.pity[type] || 0;
    return { type, cfg, cost: chestCost(s, type), currency: cfg.currency, pityLeft: cfg.pity - pityCount, pityMinRarity: cfg.pityMinRarity, weights: this.displayWeights(type) };
  }
  displayWeights(type) {
    const w = BALANCE.chests[type].weights, total = Object.values(w).reduce((a, b) => a + b, 0);
    return Object.fromEntries(RARITY.map((r) => [r, w[r] / total]));
  }
  canOpen(type) { const i = this.info(type); return this.gm.state[i.currency] >= i.cost; }

  /** Открытие за валюту */
  open(type, source = 'currency') {
    const s = this.gm.state, i = this.info(type);
    if (source === 'currency') {
      if (s[i.currency] < i.cost) return null;
      s[i.currency] -= i.cost;
      if (i.cfg.costGrowth !== 1) s.chests.costIndex[type] = (s.chests.costIndex[type] || 0) + 1;
    }
    return this._roll(type, source);
  }

  _roll(type, source) {
    const s = this.gm.state, cfg = BALANCE.chests[type];
    const pity = (s.chests.pity[type] || 0) + 1;
    let rarity = this._weighted(cfg.weights);
    let pityHit = false;
    if (pity >= cfg.pity && rarityIndex(rarity) < rarityIndex(cfg.pityMinRarity)) { rarity = cfg.pityMinRarity; pityHit = true; }
    s.chests.pity[type] = rarityIndex(rarity) >= rarityIndex(cfg.pityMinRarity) ? 0 : pity;

    const pool = byRarity(rarity);
    const notOwned = pool.filter((c) => !s.characters[c.id]);
    // лёгкий bias к новым (60%), чтобы коллекция росла, но дубли оставались ценными
    const pickFrom = notOwned.length && Math.random() < 0.6 ? notOwned : pool;
    const ch = pickFrom[Math.floor(Math.random() * pickFrom.length)];

    let isNew = false, gems = 0, level = 1;
    if (!s.characters[ch.id]) { s.characters[ch.id] = 1; isNew = true; }
    else if (s.characters[ch.id] < BALANCE.maxCharacterLevel) { s.characters[ch.id]++; level = s.characters[ch.id]; gems = BALANCE.duplicateGems[rarity]; }
    else { gems = BALANCE.duplicateGems[rarity] * 3; level = s.characters[ch.id]; }
    if (gems) this.gm.addGems(gems, 'duplicate');

    s.chests.opened[type] = (s.chests.opened[type] || 0) + 1;
    s.stats.chests++;
    if (!s.flags.firstChest) { s.flags.firstChest = true; this.gm.analytics.track('first_chest', { type }); }
    if (isNew && rarityIndex(rarity) >= 1 && !s.flags.firstRare) { s.flags.firstRare = true; this.gm.analytics.track('first_rare_character', { character_id: ch.id, rarity }); }
    if (isNew && Object.keys(s.characters).length === 2) this.gm.analytics.track('first_character', { character_id: ch.id });
    const prevRarest = s.stats.rarest ? rarityIndex(CHARACTER_MAP[s.stats.rarest]?.rarity || 'common') : -1;
    if (rarityIndex(rarity) > prevRarest) s.stats.rarest = ch.id;

    this.gm.quests.progress('chests', 1);
    this.gm.events?.onChest();
    this.gm.analytics.track('character_obtained', { character_id: ch.id, rarity, source: `${type}_chest_${source}`, is_new: isNew, pity: pityHit });
    this.gm.analytics.track('chest_open', { type, source, rarity, pity: pityHit });
    if (isNew && rarityIndex(rarity) >= 2 && !s.flags.firstEpic) { s.flags.firstEpic = true; this.gm.monetization?.onStarterTrigger('epic'); }
    const result = { character: ch, rarity, isNew, gems, level, pityHit, type };
    bus.emit('chest_result', result);
    bus.emit('state');
    return result;
  }

  _weighted(w) {
    const total = Object.values(w).reduce((a, b) => a + b, 0);
    let r = Math.random() * total;
    for (const k of RARITY) { r -= w[k] || 0; if (r <= 0) return k; }
    return 'common';
  }
}
