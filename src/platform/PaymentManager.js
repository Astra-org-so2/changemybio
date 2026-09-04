/**
 * PaymentManager — покупки через ysdk.payments. Идемпотентная обработка по purchaseToken.
 * Клиентская обработка (signed:false) для MVP; Phase 6 — серверная валидация signature.
 */
import { PRODUCT_MAP } from '../config/products.js';
import { AB } from '../config/ab.js';

export class PaymentManager {
  constructor(platform) { this.platform = platform; this.catalog = []; }
  get serverUrl() { return AB.get('payments_server_url') || ''; }
  async init() {
    if (!this.platform.paymentsAvailable) return;
    if (this.serverUrl && this.platform.enableSignedPayments) await this.platform.enableSignedPayments();
    try { this.catalog = await this.platform.getCatalog(); } catch (e) { console.warn('[Pay] catalog', e); }
  }
  priceOf(id) { const p = this.catalog.find((x) => x.id === id); return p ? { price: p.price, value: p.priceValue, code: p.priceCurrencyCode, icon: p.getPriceCurrencyImage?.('small') || '' } : null; }

  /** Восстановление/обработка незавершённых покупок (обязательно для модерации 1.13.1). */
  /** Серверный режим: отправляем signature, сервер проверяет HMAC и double-spend, возвращает granted[]. */
  async _viaServer(path, signature) {
    const r = await fetch(this.serverUrl.replace(/\/$/, '') + path, { method: 'POST', headers: { 'Content-Type': 'text/plain' }, body: signature });
    if (!r.ok) throw new Error('server ' + r.status);
    return r.json();
  }
  async _applyServerResult(res, applyGrant, state) {
    for (const g of res.granted || []) {
      const prod = PRODUCT_MAP[g.productId]; if (!prod) continue;
      const p = { productID: g.productId, purchaseToken: g.token };
      if (prod.type === 'non_consumable') { if (!state.purchases.owned.includes(prod.id)) applyGrant(prod, p); }
      else await this._consume(prod, p, applyGrant, state);
    }
  }
  async restore(applyGrant, state) {
    if (!this.platform.paymentsAvailable) return;
    let list = [];
    try { list = await this.platform.getPurchases(); } catch { return; }
    if (this.serverUrl && list && list.signature) { try { await this._applyServerResult(await this._viaServer('/purchases', list.signature), applyGrant, state); } catch (e) { console.warn('[Pay] server restore failed', e); } return; }
    for (const p of list) {
      const prod = PRODUCT_MAP[p.productID]; if (!prod) continue;
      if (prod.type === 'non_consumable') { if (!state.purchases.owned.includes(prod.id)) { applyGrant(prod, p); } }
      else if (!state.purchases.consumedTokens.includes(p.purchaseToken)) { await this._consume(prod, p, applyGrant, state); }
    }
  }
  async buy(id, applyGrant, state) {
    const prod = PRODUCT_MAP[id]; if (!prod) throw new Error('unknown product');
    const p = await this.platform.purchase(id, JSON.stringify({ ts: Date.now() }));
    if (this.serverUrl && p.signature) { await this._applyServerResult(await this._viaServer('/purchase', p.signature), applyGrant, state); return p; }
    if (prod.type === 'non_consumable') applyGrant(prod, p);
    else await this._consume(prod, p, applyGrant, state);
    return p;
  }
  async _consume(prod, p, applyGrant, state) {
    if (state.purchases.consumedTokens.includes(p.purchaseToken)) return; // повторная обработка
    applyGrant(prod, p); // 1) начислить и сохранить
    state.purchases.consumedTokens.push(p.purchaseToken);
    if (state.purchases.consumedTokens.length > 200) state.purchases.consumedTokens.splice(0, 100);
    try { await this.platform.consumePurchase(p.purchaseToken); } // 2) потребить
    catch (e) { console.warn('[Pay] consume failed, will retry on next start', e); state.purchases.consumedTokens = state.purchases.consumedTokens.filter((t) => t !== p.purchaseToken); throw e; }
  }
}
