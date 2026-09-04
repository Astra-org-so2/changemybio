/**
 * Economy — все формулы дохода в одном месте (чистые функции над state).
 */
import { BALANCE, rarityIndex } from '../config/balance.js';
import { CHARACTER_MAP, CHARACTERS } from '../config/characters.js';
import { AB } from '../config/ab.js';

const B = BALANCE;
const charBonus = (c, lvl) => 1 + (lvl - 1) * B.duplicateLevelBonus;

export function characterMultipliers(state) {
  let income = 1, tap = 1, passive = 0;
  for (const id in state.characters) {
    const c = CHARACTER_MAP[id]; if (!c) continue;
    const k = charBonus(c, state.characters[id]);
    income += (c.baseMultiplier - 1) * k;
    tap += (c.tapMultiplier - 1) * k;
    passive += c.passiveIncome * k;
  }
  return { income, tap, passive };
}

export function collectionProgress(state) {
  const total = CHARACTERS.filter((c) => c.unlockCondition.type !== 'event').length;
  const owned = Object.keys(state.characters).filter((id) => CHARACTER_MAP[id]).length;
  const pct = owned / total;
  let bonus = 0, next = null;
  for (const tier of B.collectionBonus) { if (pct >= tier.pct) bonus = tier.bonus; else if (!next) next = tier; }
  return { total, owned, pct, bonus, next };
}

export const prestigeMultiplier = (state) => 1 + state.prestige.points * B.prestigeMultPerPoint;

export function activeBoostMult(state, now, key = 'income_x2') {
  const exp = state.boosts[key];
  return exp && exp > now ? B.boosts[key].mult || 1 : 1;
}

export function tapMilestoneMult(level) { return Math.pow(B.tapMilestoneMult, Math.floor(level / B.tapMilestoneEvery)); }
export function autoMilestoneMult(level) { return Math.pow(B.autoMilestoneMult, Math.floor(level / B.autoMilestoneEvery)); }

/** coinsPerTap без combo/crit (базовый). */
export function coinsPerTap(state, now) {
  const cm = characterMultipliers(state);
  const coll = 1 + collectionProgress(state).bonus;
  const base = (B.tapBase + state.tapLevel * B.tapPerLevel) * tapMilestoneMult(state.tapLevel);
  // тап также получает 10% от cps — чтобы тап оставался осмысленным на поздних стадиях
  const cpsShare = coinsPerSecond(state, now) * 0.1;
  return (base * cm.tap * cm.income + cpsShare) * prestigeMultiplier(state) * coll * activeBoostMult(state, now) * AB.num('tap_mult');
}

export function coinsPerSecond(state, now) {
  const cm = characterMultipliers(state);
  const coll = 1 + collectionProgress(state).bonus;
  const auto = state.autoLevel > 0 ? B.incomeBase * state.autoLevel * Math.pow(B.incomeGrowth, state.autoLevel) * autoMilestoneMult(state.autoLevel) : 0;
  return (auto + cm.passive) * cm.income * prestigeMultiplier(state) * coll * activeBoostMult(state, now);
}

export const tapUpgradeCost = (lvl) => Math.floor(B.tapUpgradeCostBase * Math.pow(B.tapUpgradeCostGrowth, lvl) * AB.num('upgrade_cost_mult'));
export const autoUpgradeCost = (lvl) => Math.floor(B.autoUpgradeCostBase * Math.pow(B.autoUpgradeCostGrowth, lvl) * AB.num('upgrade_cost_mult'));

export function chestCost(state, type) {
  const c = B.chests[type];
  const idx = state.chests.costIndex[type] || 0;
  return Math.floor(c.baseCost * Math.pow(c.costGrowth, idx) * AB.num('chest_cost_mult'));
}

export function prestigePreview(state) {
  const earned = state.runEarned;
  const can = earned >= B.prestigeThreshold;
  const points = can ? Math.floor(Math.sqrt(earned / B.prestigePointsDivisor)) : 0;
  return { can, points, threshold: B.prestigeThreshold, earned, newMult: 1 + (state.prestige.points + points) * B.prestigeMultPerPoint, curMult: prestigeMultiplier(state) };
}

export function currentZone(state) {
  let z = B.prestigeZones[0];
  for (const zone of B.prestigeZones) if (state.prestige.count >= zone.at) z = zone;
  return z;
}

export function rarest(state) {
  let best = null;
  for (const id in state.characters) { const c = CHARACTER_MAP[id]; if (c && (!best || rarityIndex(c.rarity) > rarityIndex(best.rarity))) best = c; }
  return best;
}
