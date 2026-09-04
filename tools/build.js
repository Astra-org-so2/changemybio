import { build } from 'esbuild';
import { cpSync, mkdirSync, rmSync, existsSync, statSync } from 'fs';
rmSync('dist', { recursive: true, force: true }); mkdirSync('dist', { recursive: true });
await build({ entryPoints: ['src/main.js'], bundle: true, minify: true, format: 'iife', target: ['es2018'], outfile: 'dist/game.js', sourcemap: false, legalComments: 'none' });
cpSync('public', 'dist', { recursive: true, filter: (src) => !src.endsWith('public/game.js') });
if (existsSync('assets')) cpSync('assets', 'dist/assets', { recursive: true });
console.log('built dist/game.js', (statSync('dist/game.js').size / 1024).toFixed(1), 'KB');
