import { test } from 'node:test';
import assert from 'node:assert/strict';
import { BALANCE } from '../src/config/balance.js';
import { CHARACTERS } from '../src/config/characters.js';
import { createDefaultState } from '../src/core/State.js';
import { coinsPerTap, coinsPerSecond, tapUpgradeCost, autoUpgradeCost, prestigePreview, collectionProgress, chestCost } from '../src/game/Economy.js';

test('characters: counts per rarity', () => {
  const n = (r) => CHARACTERS.filter((c) => c.rarity === r && c.unlockCondition.type !== 'event').length;
  assert.equal(n('common'), 30); assert.equal(n('rare'), 15); assert.equal(n('epic'), 10); assert.equal(n('legendary'), 5); assert.equal(n('mythic'), 3);
  assert.equal(new Set(CHARACTERS.map((c) => c.id)).size, CHARACTERS.length, 'unique ids');
});

test('start: first tap >= 1 coin, first upgrade affordable in <= 10 taps', () => {
  const s = createDefaultState(0);
  const cpt = coinsPerTap(s, 0); assert.ok(cpt >= 1);
  assert.ok(tapUpgradeCost(0) / cpt <= 10, `first upgrade needs ${tapUpgradeCost(0) / cpt} taps`);
});

test('progression: no dead zones in first 30 levels (cost/cps ratio bounded)', () => {
  const s = createDefaultState(0);
  for (let i = 0; i < 30; i++) {
    s.tapLevel = i; s.autoLevel = i;
    const income = coinsPerSecond(s, 0) + coinsPerTap(s, 0) * 3; // 3 таппа/сек
    const nextCost = Math.min(tapUpgradeCost(i), autoUpgradeCost(i));
    const secs = nextCost / income;
    assert.ok(secs < 90, `level ${i}: ${secs.toFixed(0)}s to next upgrade — too slow`);
  }
});

test('prestige: threshold and points formula', () => {
  const s = createDefaultState(0);
  s.runEarned = BALANCE.prestigeThreshold - 1; assert.equal(prestigePreview(s).can, false);
  s.runEarned = BALANCE.prestigeThreshold * 4; const p = prestigePreview(s); assert.equal(p.can, true); assert.equal(p.points, 2);
});

test('collection bonus tiers', () => {
  const s = createDefaultState(0);
  assert.equal(collectionProgress(s).bonus, 0);
  CHARACTERS.slice(0, 32).forEach((c) => (s.characters[c.id] = 1)); assert.equal(collectionProgress(s).bonus, 0.25);
  CHARACTERS.forEach((c) => (s.characters[c.id] = 1)); assert.equal(collectionProgress(s).bonus, 1.0);
});

test('chest cost grows and chest weights sum to 100', () => {
  const s = createDefaultState(0);
  const c0 = chestCost(s, 'basic'); s.chests.costIndex.basic = 3; assert.ok(chestCost(s, 'basic') > c0);
  for (const k in BALANCE.chests) { const sum = Object.values(BALANCE.chests[k].weights).reduce((a, b) => a + b, 0); assert.ok(Math.abs(sum - 100) < 0.01, k); }
});

test('time to first chest (100 coins) under 60s of active play', () => {
  const s = createDefaultState(0); let coins = 0, tsec = 0;
  while (coins < 100 && tsec < 120) { coins += coinsPerTap(s, 0) * 3 + coinsPerSecond(s, 0); tsec++; const c = tapUpgradeCost(s.tapLevel); if (coins >= c + 20 && s.tapLevel < 3) { coins -= c; s.tapLevel++; } }
  assert.ok(tsec <= 60, `first chest at ${tsec}s`);
});
