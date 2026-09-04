/**
 * Проверка подписи покупок Яндекс Игр (server-side, Phase 6).
 * Формат signature: "<base64 HMAC-SHA256>.<base64 JSON>". Ключ — Консоль → Покупки → Настройки.
 * Чистая функция без I/O — легко тестируется и переносится в любой рантайм.
 */
import crypto from 'node:crypto';

export function verifySignature(signature, secret) {
  if (typeof signature !== 'string' || !signature.includes('.')) return { ok: false, reason: 'format' };
  const [sign, data] = signature.split('.');
  const json = Buffer.from(data, 'base64').toString('utf8');
  const expected = crypto.createHmac('sha256', secret).update(json).digest('base64');
  const a = Buffer.from(sign), b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return { ok: false, reason: 'signature' };
  let payload; try { payload = JSON.parse(json); } catch { return { ok: false, reason: 'json' }; }
  if (payload.algorithm !== 'HMAC-SHA256') return { ok: false, reason: 'algorithm' };
  return { ok: true, payload };
}

/** Нормализует данные: purchase() → один объект; getPurchases() → массив в data. */
export function extractPurchases(payload) {
  const d = payload.data;
  const list = Array.isArray(d) ? d : [d];
  return list.filter(Boolean).map((p) => ({ token: p.token ?? p.purchaseToken, productId: p.product?.id ?? p.productID, developerPayload: p.developerPayload || '', status: p.status }));
}
