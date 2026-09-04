// Dev server: раздаёт public/ + собирает src на лету (esbuild watch). /sdk.js → пустышка (мок-платформа).
import { context } from 'esbuild';
import http from 'http'; import { readFileSync, existsSync } from 'fs'; import { extname, join } from 'path';
const PORT = process.env.PORT || 8080;
const ctx = await context({ entryPoints: ['src/main.js'], bundle: true, format: 'iife', target: ['es2018'], outfile: 'public/game.js', sourcemap: 'inline' });
await ctx.watch();
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.json': 'application/json', '.svg': 'image/svg+xml' };
http.createServer((req, res) => {
  let p = req.url.split('?')[0]; if (p === '/') p = '/index.html';
  if (p === '/sdk.js') { res.writeHead(200, { 'Content-Type': 'text/javascript' }); return res.end('// local dev: no YaGames → MockPlatform'); }
  const f = join('public', p); const f2 = join('.', p);
  const file = existsSync(f) ? f : existsSync(f2) ? f2 : null;
  if (!file) { res.writeHead(404); return res.end('404'); }
  res.writeHead(200, { 'Content-Type': MIME[extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store' }); res.end(readFileSync(file));
}).listen(PORT, '0.0.0.0', () => console.log(`dev http://0.0.0.0:${PORT}`));
