import { GameManager } from './core/GameManager.js';
import { YandexPlatform } from './platform/YandexPlatform.js';
import { MockPlatform } from './platform/MockPlatform.js';
import { UI } from './ui/UI.js';

const DEBUG = /[?&]debug=1/.test(location.search) || location.hostname === 'localhost' || location.hostname.startsWith('127.');

async function boot() {
  let platform;
  if (window.YaGames) { platform = new YandexPlatform(); try { await platform.init(); } catch (e) { console.warn('[boot] YSDK init failed, mock fallback', e); platform = new MockPlatform(); await platform.init(); } }
  else { platform = new MockPlatform(); await platform.init(); }

  const gm = new GameManager(platform, { debug: DEBUG });
  await gm.init();
  const ui = new UI(gm, document.getElementById('app'));
  gm.start();
  document.getElementById('loader').classList.add('hide');
  platform.gameReady(); // LoadingAPI.ready — игра готова к взаимодействию

  // offline reward — сразу после загрузки, до геймплея (это не реклама, а награда; реклама только по кнопке)
  if (gm.offlinePreview) ui.showOffline(gm.offlinePreview);
  if (DEBUG) { window.__game = gm; window.__ui = ui; console.log('[debug] window.__game доступен'); }
}
boot().catch((e) => { console.error(e); document.getElementById('loader').textContent = 'Error: ' + e.message; });
