import { test } from 'node:test';
import assert from 'node:assert/strict';
import { verifySignature, extractPurchases } from '../server/verify.js';
// Публичный пример из документации Яндекс Игр (ключ t0p$ecret)
const SIG = 'hQ8adIRJWD29Nep+0P36Z6edI5uzj6F3tddz6Dqgclk=.eyJhbGdvcml0aG0iOiJITUFDLVNIQTI1NiIsImlzc3VlZEF0IjoxNTcxMjMzMzcxLCJyZXF1ZXN0UGF5bG9hZCI6InF3ZSIsImRhdGEiOnsidG9rZW4iOiJkODVhZTBiMS05MTY2LTRmYmItYmIzOC02ZDJhNGNhNDQxNmQiLCJzdGF0dXMiOiJ3YWl0aW5nIiwiZXJyb3JDb2RlIjoiIiwiZXJyb3JEZXNjcmlwdGlvbiI6IiIsInVybCI6Imh0dHBzOi8veWFuZGV4LnJ1L2dhbWVzL3Nkay9wYXltZW50cy90cnVzdC1mYWtlLmh0bWwiLCJwcm9kdWN0Ijp7ImlkIjoibm9hZHMiLCJ0aXRsZSI6ItCR0LXQtyDRgNC10LrQu9Cw0LzRiyIsImRlc2NyaXB0aW9uIjoi0J7RgtC60LvRjtGH0LjRgtGMINGA0LXQutC70LDQvNGDINCyINC40LPRgNC1IiwicHJpY2UiOnsiY29kZSI6IlJVUiIsInZhbHVlIjoiNDkifSwiaW1hZ2VQcmVmaXgiOiJodHRwczovL2F2YXRhcnMubWRzLnlhbmRleC5uZXQvZ2V0LWdhbWVzLzE4OTI5OTUvMmEwMDAwMDE2ZDFjMTcxN2JkN2EwMTQ5Y2NhZGM4NjA3OGExLyJ9fX0=';

test('doc example signature verifies with doc key; wrong key/tamper rejected', () => {
  const v = verifySignature(SIG, 't0p$ecret'); assert.ok(v.ok, v.reason);
  const [p] = extractPurchases(v.payload); assert.equal(p.productId, 'noads'); assert.equal(p.token, 'd85ae0b1-9166-4fbb-bb38-6d2a4ca4416d');
  assert.equal(verifySignature(SIG, 'wrong').ok, false);
  const [s, d] = SIG.split('.'); const tampered = s + '.' + Buffer.from(Buffer.from(d, 'base64').toString().replace('"49"', '"1"')).toString('base64');
  assert.equal(verifySignature(tampered, 't0p$ecret').ok, false);
  assert.equal(verifySignature('garbage', 't0p$ecret').reason, 'format');
});

test('double spend: same token granted once', async () => {
  process.env.YANDEX_PAYMENTS_SECRET = 't0p$ecret'; process.env.PORT = '0';
  const { handle } = await import('../server/index.js');
  const r1 = handle(SIG); assert.equal(r1.status, 200); assert.equal(r1.body.rejected[0]?.reason, 'unknown_product', 'noads is not in our catalog → rejected, not granted');
  // подпишем свой payload с нашим product id
  const crypto = await import('node:crypto');
  const json = JSON.stringify({ algorithm: 'HMAC-SHA256', issuedAt: 1, data: { token: 'tok-1', status: 'waiting', product: { id: 'gems_small' } } });
  const sig = crypto.createHmac('sha256', 't0p$ecret').update(json).digest('base64') + '.' + Buffer.from(json).toString('base64');
  const a = handle(sig); assert.equal(a.body.granted.length, 1); assert.equal(a.body.granted[0].grant.gems, 100);
  const b = handle(sig); assert.equal(b.body.granted.length, 0); assert.equal(b.body.rejected[0].reason, 'already_processed');
});
