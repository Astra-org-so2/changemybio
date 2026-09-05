import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createDefaultState } from '../src/core/State.js';
import { OfflineSystem } from '../src/game/OfflineSystem.js';
import { ChestSystem } from '../src/game/ChestSystem.js';
import { BALANCE, rarityIndex } from '../src/config/balance.js';
import { AdManager } from '../src/platform/AdManager.js';

const fakeGm = (state) => ({ state, now: () => 1_000_000, analytics: { track() {} }, quests: { progress() {} }, addCoins(n) { state.coins += n; }, addGems(n) { state.gems += n; }, emitState() {}, save() {} });

test('offline: negative time → null, cap 8h, efficiency', () => {
  const s = createDefaultState(0); s.autoLevel = 10; const gm = fakeGm(s); const off = new OfflineSystem(gm);
  s.lastSeen = 2_000_000; assert.equal(off.compute(s, 1_000_000), null);
  s.lastSeen = 1_000_000 - 20 * 3600 * 1000; const r = off.compute(s, 1_000_000);
  assert.equal(r.seconds, BALANCE.offlineCapSec); assert.ok(r.capped);
});

test('chest pity guarantees rare+ within N basic opens', () => {
  const s = createDefaultState(0); s.coins = 1e12; const gm = fakeGm(s); const ch = new ChestSystem(gm);
  let worst = 0, streak = 0;
  for (let i = 0; i < 2000; i++) { s.coins = 1e300; s.chests.costIndex.basic = 0; const r = ch.open("basic"); if (rarityIndex(r.rarity) >= 1) { worst = Math.max(worst, streak); streak = 0; } else streak++; }
  assert.ok(worst < BALANCE.chests.basic.pity, `worst streak ${worst}`);
});

test('AdManager respects session time, interval and caps', () => {
  let t = 0; const ad = new AdManager({}, () => t);
  assert.equal(ad.canShowInterstitial(false).reason, 'session_too_short');
  t = 200_000; assert.equal(ad.canShowInterstitial(false).ok, true);
  ad.lastRewardedAt = t - 10_000; assert.equal(ad.canShowInterstitial(false).reason, 'after_rewarded');
  ad.lastRewardedAt = 0; ad.lastTapAt = t - 1000; assert.equal(ad.canShowInterstitial(false).reason, 'tapping');
  ad.lastTapAt = 0; ad.interstitialsThisSession = 4; assert.equal(ad.canShowInterstitial(false).reason, 'session_cap');
  ad.interstitialsThisSession = 0; assert.equal(ad.canShowInterstitial(true).reason, 'remove_ads');
});
