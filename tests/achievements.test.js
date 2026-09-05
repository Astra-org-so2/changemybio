import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createDefaultState } from '../src/core/State.js';
import { AchievementSystem } from '../src/game/AchievementSystem.js';
import { ACHIEVEMENTS } from '../src/config/achievements.js';

const mk = (s) => { const gems = []; const gm = { state: s, analytics: { track() {} }, addGems(n) { s.gems += n; gems.push(n); } }; return { gm, ach: new AchievementSystem(gm), gems }; };

test('achievements: tiers unlock once, reward gems, persist across checks', () => {
  const s = createDefaultState(0); const { ach, gems } = mk(s);
  assert.equal(ach.check().length, 0);
  s.stats.taps = 1500;
  const u = ach.check();
  assert.deepEqual(u.map((x) => x.tier), [1, 2]);
  assert.equal(s.achievements.taps, 2);
  assert.equal(gems.reduce((a, b) => a + b, 0), 15);
  assert.equal(ach.check().length, 0, 'no double reward');
});

test('achievements: rarity-based progress and list() shape', () => {
  const s = createDefaultState(0); const { ach } = mk(s);
  s.characters.l01 = 1; s.characters.e01 = 1; s.characters.e02 = 1;
  ach.check();
  assert.equal(s.achievements.legendary, 1);
  assert.equal(s.achievements.epic, 1);
  const l = ach.list().find((a) => a.id === 'epic');
  assert.equal(l.done, 1); assert.equal(l.value, 2); assert.equal(l.target, 5);
});

test('achievements config: tiers strictly increasing, unique ids, names in 4 langs', () => {
  const ids = new Set();
  for (const a of ACHIEVEMENTS) {
    assert.ok(!ids.has(a.id)); ids.add(a.id);
    for (let i = 1; i < a.tiers.length; i++) assert.ok(a.tiers[i][0] > a.tiers[i - 1][0], a.id);
    for (const l of ['ru', 'en', 'tr', 'es']) assert.ok(a.name[l], `${a.id}.${l}`);
  }
});
