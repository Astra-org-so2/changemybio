// Smoke: полный boot в jsdom с MockPlatform. Запуск: node tests/smoke.jsdom.mjs
import { JSDOM } from 'jsdom';
import { readFileSync } from 'fs';
const html = readFileSync('public/index.html', 'utf8').replace('<script src="/sdk.js"></script>', '').replace('<script type="module" src="game.js"></script>', '');
const dom = new JSDOM(html, { url: 'http://localhost:8080/', pretendToBeVisual: true, runScripts: 'outside-only' });
const { window } = dom;
const errors = [];
window.addEventListener('error', (e) => errors.push(e.message));
for (const [k, v] of Object.entries({ window, document: window.document, navigator: window.navigator, localStorage: window.localStorage, location: window.location, requestAnimationFrame: window.requestAnimationFrame, HTMLElement: window.HTMLElement, Image: window.Image, devicePixelRatio: 1, confirm: () => true })) Object.defineProperty(globalThis, k, { value: v, configurable: true, writable: true });
window.HTMLCanvasElement.prototype.getContext = () => ({ clearRect() {}, fillRect() {}, save() {}, restore() {}, translate() {}, rotate() {}, globalAlpha: 1 });
window.navigator.clipboard = { writeText: async () => {} };
const origErr = console.error; console.error = (...a) => { errors.push(a.join(' ')); origErr(...a); };

const { GameManager } = await import('../src/core/GameManager.js');
const { MockPlatform } = await import('../src/platform/MockPlatform.js');
const { UI } = await import('../src/ui/UI.js');
const { bus } = await import('../src/core/EventBus.js');
const assert = (c, m) => { if (!c) { errors.push('ASSERT: ' + m); console.log('❌', m); } else console.log('✅', m); };

const t0 = Date.now();
const platform = new MockPlatform(); await platform.init();
let gm = new GameManager(platform, { debug: false }); await gm.init();
let ui = new UI(gm, document.getElementById('app'));
gm.start();
console.log('boot ms:', Date.now() - t0);
assert(document.querySelector('.charBtn'), 'character visible on main screen');
assert(document.querySelector('.hint')?.style.display !== 'none', 'tap hint shown for new player');

// taps
for (let i = 0; i < 12; i++) gm.doTap(100, 100);
assert(gm.state.coins >= 12, 'coins after 12 taps: ' + gm.state.coins.toFixed(1));
assert(document.querySelectorAll('.float').length > 0, 'floating numbers rendered');
// upgrade
assert(gm.upgrades.buy('tap'), 'first upgrade purchasable');
assert(gm.state.flags.firstUpgrade, 'first_upgrade flag');
// simulate ticks
for (let i = 0; i < 50; i++) gm._tick(0.1);
// chest
gm.state.coins += 100; const r = gm.chests.open('basic');
assert(r && r.character, 'chest opened: ' + r?.character?.id + ' ' + r?.rarity);
assert(document.querySelector('.modal .reveal'), 'chest reveal modal shown');
ui.closeModal();
// collection screen
ui.go('collection'); assert(document.querySelectorAll('.cc').length === 100, 'collection shows 100 cards');
ui.screens.collection.tab = 'ach'; ui.screens.collection.render(); assert(document.querySelectorAll('#scr-collection .q').length === 14, 'achievements tab shows 14 rows'); ui.screens.collection.tab = 'chars'; ui.go('home');
ui.go('chest'); assert(document.querySelectorAll('.pity').length === 4, 'pity text for 4 chests'); ui.go('home');
ui.go('quests'); assert(document.querySelectorAll('#scr-quests .q').length === 3, '3 daily quests');
const d = gm.daily.claim(); assert(d && d.day === 1, 'daily day1 claimed'); ui.closeModal(); ui.go('home');
ui.go('shop'); assert(document.querySelectorAll('.prod').length >= 6, 'shop rendered'); ui.go('home');
ui.go('prestige'); ui.go('home');
ui.go('social'); await new Promise((r) => setTimeout(r, 30)); assert(document.querySelectorAll('#scr-social .row').length >= 5, 'leaderboard rows rendered (mock)'); ui.go('home');
// prestige
gm.state.runEarned = 4 * 20e6; assert(gm.prestige.doPrestige(), 'prestige executed'); assert(gm.state.prestige.points === 2 && gm.state.coins === 0, 'prestige points=2, coins reset');
// rewarded (mock auto-resolves after 3s; skip in smoke by monkeypatch)
platform.showRewarded = async () => ({ rewarded: true, shown: true });
const okAd = await gm.monetization.showRewarded('income_x2'); assert(okAd && gm.state.boosts.income_x2 > gm.now(), 'rewarded income_x2 applied');
// offer modal (remove_ads) renders with catalog price and is dismissible
bus.emit('offer', { product: 'remove_ads', reason: 'test' }); await new Promise((r) => setTimeout(r, 30));
assert(document.querySelector('.modal .btn')?.textContent.includes('49'), 'offer modal shows catalog price'); ui.closeModal();
// purchase
const okBuy = await gm.monetization.purchase('remove_ads'); assert(okBuy && gm.state.purchases.removeAds, 'remove_ads purchased & applied');
assert(gm.monetization.ads.canShowInterstitial(gm.monetization.removeAds).reason === 'remove_ads', 'interstitial blocked after remove_ads');
// save → reload → offline
gm.save(true); const gems = gm.state.gems; const chars = Object.keys(gm.state.characters).length;
await new Promise((r) => setTimeout(r, 50));
// эмулируем отсутствие 2 часа
const raw = JSON.parse(localStorage.getItem('brainrot_factory_save_v1')); const st = JSON.parse(raw.d); st.lastSeen -= 2 * 3600 * 1000; st.autoLevel = 5;
// пересчёт checksum через SaveManager._serialize
localStorage.setItem('brainrot_factory_save_v1', gm.saveMgr._serialize(st));
localStorage.setItem('mock_cloud', 'null');
gm._running = false;
gm = new GameManager(platform); await gm.init();
assert(gm.state.gems === gems && Object.keys(gm.state.characters).length === chars, 'state persisted across reload');
assert(gm.offlinePreview && gm.offlinePreview.coins > 0, 'offline preview: ' + JSON.stringify(gm.offlinePreview));
ui = new UI(gm, document.getElementById('app')); ui.showOffline(gm.offlinePreview);
assert(document.querySelector('.modal .btn.ad'), 'offline modal has x2 rewarded button');
// tamper: checksum
localStorage.setItem('brainrot_factory_save_v1', JSON.stringify({ c: 'bad', d: raw.d })); localStorage.setItem('mock_cloud', 'null');
const gm3 = new GameManager(platform); await gm3.init(); assert(gm3.state.stats.taps === 0, 'tampered save rejected → fresh state');

console.log('\nERRORS:', errors.length); errors.forEach((e) => console.log(' -', e));
process.exit(errors.length ? 1 : 0);
