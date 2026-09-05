import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createDefaultState } from '../src/core/State.js';
import { MonetizationManager } from '../src/platform/MonetizationManager.js';
import { bus } from '../src/core/EventBus.js';
import { AB } from '../src/config/ab.js';

const platform = { name: 'x', paymentsAvailable: true, gameplayStart() {}, gameplayStop() {}, getCatalog: async () => [{ id: 'remove_ads', priceValue: '49', priceCurrencyCode: 'YAN' }, { id: 'starter_pack', priceValue: '29', priceCurrencyCode: 'YAN' }], showInterstitial: async () => ({ shown: true }) };
const mkGm = () => { const s = createDefaultState(0); s.stats.sessions = 5; let now = 10_000_000; return { state: s, now: () => now, tick: (ms) => (now += ms), analytics: { track() {} }, quests: { progress() {} } }; };
const offers = () => { const list = []; const off = bus.on('offer', (o) => list.push(o)); return { list, off }; };
const flush = () => new Promise((r) => setTimeout(r, 900));

test('remove_ads offer after 3rd interstitial, then cooldown by sessions', async () => {
  AB.set({}); const gm = mkGm(); const m = new MonetizationManager(gm, platform); await m.init(); const o = offers();
  m.ads.sessionStart = gm.now() - 1e6; // сессия длинная
  for (let i = 0; i < 3; i++) { gm.tick(200_000); assert.ok(await m.tryInterstitial('t')); }
  await flush(); assert.equal(o.list.length, 1); assert.equal(o.list[0].product, 'remove_ads');
  gm.tick(200_000); await m.tryInterstitial('t'); await flush(); assert.equal(o.list.length, 1, 'no repeat in same session');
  gm.state.stats.sessions += 3; m.ads.interstitialsThisSession = 0; gm.tick(200_000); await m.tryInterstitial('t'); await flush(); assert.equal(o.list.length, 2, 'repeats after cooldown sessions');
  o.off();
});

test('no offer when removeAds owned or payments unavailable', async () => {
  AB.set({}); const gm = mkGm(); gm.state.stats.interstitials = 10; const m = new MonetizationManager(gm, platform); await m.init(); const o = offers();
  gm.state.purchases.removeAds = true; m._maybeRemoveAdsOffer(); await flush(); assert.equal(o.list.length, 0);
  gm.state.purchases.removeAds = false; const m2 = new MonetizationManager(gm, { ...platform, paymentsAvailable: false }); await m2.init(); m2._maybeRemoveAdsOffer(); await flush(); assert.equal(o.list.length, 0);
  o.off();
});

test('starter pack trigger follows AB flag', async () => {
  const gm = mkGm(); const m = new MonetizationManager(gm, platform); await m.init(); const o = offers();
  AB.set({ starter_pack_trigger: 'epic' }); m.onStarterTrigger('prestige'); assert.equal(gm.state.offers.starterUnlocked, false);
  m.onStarterTrigger('epic'); assert.equal(gm.state.offers.starterUnlocked, true); await new Promise((r) => setTimeout(r, 2700)); assert.equal(o.list[0]?.product, 'starter_pack');
  AB.set({ starter_pack_trigger: 'none' }); gm.state.offers.starterUnlocked = false; m.onStarterTrigger('epic'); assert.equal(gm.state.offers.starterUnlocked, false);
  AB.set({}); o.off();
});
