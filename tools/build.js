import { build } from 'esbuild';
import { cpSync, mkdirSync, rmSync, existsSync, statSync } from 'fs';
rmSync('dist', { recursive: true, force: true }); mkdirSync('dist', { recursive: true });
await build({ entryPoints: ['src/main.js'], bundle: true, minify: true, format: 'iife', target: ['es2018'], outfile: 'dist/game.js', sourcemap: false, legalComments: 'none' });
cpSync('public', 'dist', { recursive: true, filter: (src) => !src.endsWith('public/game.js') });
if (existsSync('assets/characters')) cpSync('assets/characters', 'dist/assets/characters', { recursive: true }); // store/ — только для Консоли, не в игру
console.log('built dist/game.js', (statSync('dist/game.js').size / 1024).toFixed(1), 'KB');
