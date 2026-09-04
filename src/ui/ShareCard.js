/**
 * ShareCard — генерирует PNG-карточку 1080×1350 (4:5, оптимально для сторис/мессенджеров) на canvas.
 * Никаких внешних ассетов: градиент + emoji/арт персонажа + текст. Доступна через Web Share (files) → clipboard(image) → текст.
 */
import { t, tr } from '../config/i18n.js';
import { BALANCE } from '../config/balance.js';

export async function renderShareCard(character, { level = 1, collectionPct = 0, prestige = 0, art = null } = {}) {
  const W = 1080, H = 1350, c = document.createElement('canvas'); c.width = W; c.height = H; const g = c.getContext('2d');
  const col = BALANCE.rarityColors[character.rarity];
  const bg = g.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, '#2a1d5c'); bg.addColorStop(1, '#0f0b1e'); g.fillStyle = bg; g.fillRect(0, 0, W, H);
  // glow
  const rg = g.createRadialGradient(W / 2, 560, 50, W / 2, 560, 520); rg.addColorStop(0, col + 'cc'); rg.addColorStop(1, col + '00'); g.fillStyle = rg; g.fillRect(0, 0, W, H);
  // rays for legendary+
  if (['legendary', 'mythic'].includes(character.rarity)) { g.save(); g.translate(W / 2, 560); g.globalAlpha = 0.18; g.fillStyle = '#fff'; for (let i = 0; i < 16; i++) { g.rotate(Math.PI / 8); g.beginPath(); g.moveTo(0, 0); g.lineTo(-40, -900); g.lineTo(40, -900); g.fill(); } g.restore(); }
  g.textAlign = 'center'; g.fillStyle = '#fff';
  g.font = '900 54px system-ui, sans-serif'; g.fillText('BRAINROT FACTORY', W / 2, 120);
  g.font = '800 44px system-ui, sans-serif'; g.fillStyle = col; g.fillText(t('rarity')[character.rarity].toUpperCase(), W / 2, 200);
  // character
  if (art) { const s = 560; g.drawImage(art, W / 2 - s / 2, 560 - s / 2, s, s); }
  else { g.font = '420px system-ui, "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif'; g.fillStyle = '#fff'; g.fillText(character.emoji, W / 2, 720); }
  // name
  g.fillStyle = '#fff'; g.font = '900 64px system-ui, sans-serif'; wrap(g, tr(character.name), W / 2, 940, 960, 72);
  g.font = '500 36px system-ui, sans-serif'; g.fillStyle = '#c9c0ea'; wrap(g, tr(character.description), W / 2, 1040, 900, 44);
  // footer stats
  g.fillStyle = 'rgba(0,0,0,.35)'; roundRect(g, 60, 1150, W - 120, 120, 30); g.fill();
  g.fillStyle = '#ffcc33'; g.font = '800 40px system-ui, sans-serif';
  g.fillText(`${t('collection')} ${Math.round(collectionPct * 100)}%   ·   ⭐ ${prestige}` + (level > 1 ? `   ·   ★${level}` : ''), W / 2, 1225);
  g.fillStyle = '#8f85b8'; g.font = '600 30px system-ui, sans-serif'; g.fillText(t('shareCta'), W / 2, 1315);
  return new Promise((res) => c.toBlob(res, 'image/png'));
}
function wrap(g, text, x, y, maxW, lh) { const words = text.split(' '); let line = ''; for (const w of words) { const test = line ? line + ' ' + w : w; if (g.measureText(test).width > maxW && line) { g.fillText(line, x, y); y += lh; line = w; } else line = test; } if (line) g.fillText(line, x, y); }
function roundRect(g, x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }

/** Пытается поделиться картинкой; возвращает 'native' | 'clipboard_image' | 'download' | null. Текст — отдельно через platform.share. */
export async function shareImage(blob, filename = 'brainrot.png') {
  const file = new File([blob], filename, { type: 'image/png' });
  try { if (navigator.canShare?.({ files: [file] })) { await navigator.share({ files: [file] }); return 'native'; } } catch (e) { if (e?.name === 'AbortError') return 'cancel'; }
  try { if (window.ClipboardItem && navigator.clipboard?.write) { await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]); return 'clipboard_image'; } } catch {}
  try { const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = filename; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 5000); return 'download'; } catch {}
  return null;
}
