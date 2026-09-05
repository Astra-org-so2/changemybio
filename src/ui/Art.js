/**
 * Art — ленивая загрузка арта персонажа по `asset` с фолбэком на emoji.
 * Кэш результатов: 'ok' | 'missing'. Один HEAD/GET на ассет за сессию. Ничего не блокирует загрузку игры.
 */
const cache = new Map();
export function charVisual(c, cls = '') {
  const wrap = document.createElement('span'); wrap.className = 'cv ' + cls; wrap.textContent = c.emoji;
  if (!c.asset || cache.get(c.asset) === 'missing' || typeof Image === 'undefined') return wrap;
  const img = new Image(); img.decoding = 'async'; img.loading = 'lazy'; img.alt = '';
  img.onload = () => { cache.set(c.asset, 'ok'); wrap.textContent = ''; wrap.append(img); };
  img.onerror = () => cache.set(c.asset, 'missing');
  img.src = c.asset;
  return wrap;
}
