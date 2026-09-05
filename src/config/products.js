/**
 * PRODUCTS — каталог IAP. `id` должен 1:1 совпадать с ID товара в Консоли Яндекс Игр.
 * Цена/валюта/иконка НЕ хардкодятся — берутся из ysdk.payments.getCatalog() (требование 1.13.2).
 * `fallbackPriceYan` — только для локальной разработки/мока.
 */
export const PRODUCTS = [
  { id: 'remove_ads',       type: 'non_consumable', fallbackPriceYan: 49,  grant: { removeAds: true },
    title: { ru: 'Убрать рекламу', en: 'Remove Ads' },
    desc:  { ru: 'Никакой полноэкранной рекламы навсегда. Бонусные видео остаются доступными.', en: 'No interstitial ads forever. Bonus videos stay available.' }, featured: true },
  { id: 'starter_pack',     type: 'consumable', fallbackPriceYan: 29, once: true, grant: { gems: 150, chest: 'rare', boostMinutes: 30 },
    title: { ru: 'Стартовый набор', en: 'Starter Pack' },
    desc:  { ru: '150 гемов + Редкий сундук + 30 мин дохода x2', en: '150 gems + Rare Chest + 30 min x2 income' }, unlockByOffer: true },
  { id: 'gems_small',       type: 'consumable', fallbackPriceYan: 19,  grant: { gems: 100 },
    title: { ru: '100 гемов', en: '100 Gems' }, desc: { ru: 'Горсть гемов', en: 'A handful of gems' } },
  { id: 'gems_medium',      type: 'consumable', fallbackPriceYan: 79,  grant: { gems: 550 },
    title: { ru: '550 гемов', en: '550 Gems' }, desc: { ru: '+10% бонус', en: '+10% bonus' } },
  { id: 'gems_large',       type: 'consumable', fallbackPriceYan: 249, grant: { gems: 2000 },
    title: { ru: '2000 гемов', en: '2000 Gems' }, desc: { ru: '+25% бонус', en: '+25% bonus' } },
  { id: 'premium_pack',     type: 'non_consumable', fallbackPriceYan: 149, grant: { removeAds: true, gems: 500, character: 'e05' },
    title: { ru: 'Премиум набор', en: 'Premium Pack' },
    desc:  { ru: 'Убрать рекламу + 500 гемов + Единорог из Excel', en: 'Remove Ads + 500 gems + Excel Unicorn' } },
];
export const PRODUCT_MAP = Object.fromEntries(PRODUCTS.map((p) => [p.id, p]));
