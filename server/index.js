/**
 * Эталонный сервер обработки покупок (Node 18+, без зависимостей).
 * POST /purchase   body: text/plain signature (из payments.purchase({signed:true}))
 * POST /purchases  body: text/plain signature (из payments.getPurchases())
 * Ответ: { granted: [{ token, productId, grant }], rejected: [...] }
 *
 * Хранилище токенов — in-memory Map. В продакшене: таблица used_tokens(token PRIMARY KEY, player_id, product_id, ts).
 * Начисление в продакшене: серверная запись в вашу БД профиля ИЛИ ответ клиенту, который вызывает player.setData + consumePurchase.
 */
import http from 'node:http';
import { verifySignature, extractPurchases } from './verify.js';
import { PRODUCTS } from '../src/config/products.js';

const SECRET = process.env.YANDEX_PAYMENTS_SECRET; // НИКОГДА не коммитить
const PORT = process.env.PORT || 3000;
const GRANTS = Object.fromEntries(PRODUCTS.map((p) => [p.id, p.grant]));
const usedTokens = new Map();

export function handle(signature) {
  const v = verifySignature(signature, SECRET);
  if (!v.ok) return { status: 403, body: { error: v.reason } };
  const granted = [], rejected = [];
  for (const p of extractPurchases(v.payload)) {
    if (!p.token || !GRANTS[p.productId]) { rejected.push({ ...p, reason: 'unknown_product' }); continue; }
    if (usedTokens.has(p.token)) { rejected.push({ ...p, reason: 'already_processed' }); continue; } // double-spend
    usedTokens.set(p.token, Date.now());
    granted.push({ token: p.token, productId: p.productId, grant: GRANTS[p.productId] });
  }
  return { status: 200, body: { granted, rejected } };
}

export function start() {
  if (!SECRET) throw new Error('Set YANDEX_PAYMENTS_SECRET');
  return http.createServer((req, res) => {
    const cors = { 'Access-Control-Allow-Origin': process.env.ALLOW_ORIGIN || '*', 'Access-Control-Allow-Methods': 'POST,OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' };
    if (req.method === 'OPTIONS') { res.writeHead(204, cors); return res.end(); }
    if (req.method !== 'POST' || !['/purchase', '/purchases'].includes(req.url)) { res.writeHead(404, cors); return res.end(); }
    let body = ''; req.on('data', (c) => { body += c; if (body.length > 64_000) req.destroy(); });
    req.on('end', () => { const r = handle(body.trim()); res.writeHead(r.status, { ...cors, 'Content-Type': 'application/json' }); res.end(JSON.stringify(r.body)); });
  }).listen(PORT, () => console.log('payments server on', PORT));
}
