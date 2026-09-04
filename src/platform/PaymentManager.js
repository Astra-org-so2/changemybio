/**
 * PaymentManager — покупки через ysdk.payments. Идемпотентная обработка по purchaseToken.
 * Клиентская обработка (signed:false) для MVP; Phase 6 — серверная валидация signature.
 */
import { PRODUCT_MAP } from '../config/products.js';

export class PaymentManager {
  constructor(platform) { this.platform = platform; this.catalog = []; }
  async init() {
    if (!this.platform.paymentsAvailable) return;
    try { this.catalog = await this.platform.getCatalog(); } catch (e) { console.warn('[Pay] catalog', e); }
  }
  priceOf(id) { const p = this.catalog.find((x) => x.id === id); return p ? { price: p.price, value: p.priceValue, code: p.priceCurrencyCode, icon: p.getPriceCurrencyImage?.('small') || '' } : null; }

  /** Восстановление/обработка незавершённых покупок (обязательно для модерации 1.13.1). */
  async restore(applyGrant, state) {
    if (!this.platform.paymentsAvailable) return;
    let list = [];
    try { list = await this.platform.getPurchases(); } catch { return; }
    for (const p of list) {
      const prod = PRODUCT_MAP[p.productID]; if (!prod) continue;
      if (prod.type === 'non_consumable') { if (!state.purchases.owned.includes(prod.id)) { applyGrant(prod, p); } }
      else if (!state.purchases.consumedTokens.includes(p.purchaseToken)) { await this._consume(prod, p, applyGrant, state); }
    }
  }
  async buy(id, applyGrant, state) {
    const prod = PRODUCT_MAP[id]; if (!prod) throw new Error('unknown product');
    const p = await this.platform.purchase(id, JSON.stringify({ ts: Date.now() }));
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
