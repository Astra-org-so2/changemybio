/**
 * BALANCE_CONFIG — единственное место для тюнинга экономики.
 * Ничего из этого не должно быть захардкожено в системах.
 * Все значения можно перекрыть через AB_CONFIG / Remote Config (см. ab.js).
 */
export const BALANCE = {
  // ---------- TAP ----------
  tapBase: 1,               // базовый доход с тапа на 0 уровне
  tapPerLevel: 1,           // +к базе за каждый уровень силы тапа
  tapMilestoneEvery: 25,    // каждые N уровней — множитель
  tapMilestoneMult: 2,      // ×2 каждые 25 уровней (ощутимые «скачки»)
  tapUpgradeCostBase: 10,
  tapUpgradeCostGrowth: 1.13,

  // ---------- AUTO INCOME ----------
  incomeBase: 0.4,          // coins/sec на 1 уровне авто
  incomeGrowth: 1.04,       // экспонента по уровню
  autoUpgradeCostBase: 25,
  autoUpgradeCostGrowth: 1.14,
  autoMilestoneEvery: 25,
  autoMilestoneMult: 2,

  // ---------- LUCK (третий апгрейд-трек: шанс крита) — открывается после 1-го prestige ----------
  luckUnlockPrestige: 1,
  luckPerLevel: 0.005,          // +0.5% шанса крита за уровень
  luckMaxLevel: 30,             // cap: 5% + 15% = 20%
  luckUpgradeCostBase: 500,
  luckUpgradeCostGrowth: 1.35,

  // ---------- COMBO ----------
  comboWindowMs: 900,       // окно между тапами для роста комбо
  comboDecayMs: 1200,       // через сколько без тапов комбо начинает падать
  comboTiers: [             // taps -> multiplier (не обязателен для прогресса)
    { taps: 10, mult: 1.2, label: 'x1.2' },
    { taps: 25, mult: 1.5, label: 'x1.5' },
    { taps: 50, mult: 2.0, label: 'x2' },
    { taps: 100, mult: 3.0, label: 'x3' },
  ],

  // ---------- CRITICAL ----------
  critChance: 0.05,
  critMult: 5,
  superCritChance: 0.005,
  superCritMult: 25,

  // ---------- CHESTS ----------
  chests: {
    basic:     { currency: 'coins', baseCost: 100, costGrowth: 1.6, pity: 10, pityMinRarity: 'rare',
                 weights: { common: 80, rare: 17, epic: 2.5, legendary: 0.45, mythic: 0.05 } },
    rare:      { currency: 'gems', baseCost: 50, costGrowth: 1, pity: 15, pityMinRarity: 'epic',
                 weights: { common: 40, rare: 45, epic: 12, legendary: 2.5, mythic: 0.5 } },
    epic:      { currency: 'gems', baseCost: 150, costGrowth: 1, pity: 20, pityMinRarity: 'legendary',
                 weights: { common: 0, rare: 55, epic: 35, legendary: 8.5, mythic: 1.5 } },
    legendary: { currency: 'gems', baseCost: 400, costGrowth: 1, pity: 25, pityMinRarity: 'mythic',
                 weights: { common: 0, rare: 0, epic: 60, legendary: 34, mythic: 6 } },
  },
  duplicateGems: { common: 1, rare: 3, epic: 10, legendary: 30, mythic: 100 },
  duplicateLevelBonus: 0.25, // +25% к бонусу персонажа за каждый уровень (дубль)
  maxCharacterLevel: 10,

  // ---------- RARITY ----------
  rarityOrder: ['common', 'rare', 'epic', 'legendary', 'mythic'],
  rarityColors: { common: '#9aa5b1', rare: '#3b82f6', epic: '#a855f7', legendary: '#f59e0b', mythic: '#ef4444' },

  // ---------- COLLECTION BONUS ----------
  collectionBonus: [ // % коллекции -> +income
    { pct: 0.25, bonus: 0.10 },
    { pct: 0.50, bonus: 0.25 },
    { pct: 0.75, bonus: 0.50 },
    { pct: 1.00, bonus: 1.00 },
  ],

  // ---------- PRESTIGE ----------
  prestigeThreshold: 20_000_000,  // totalEarned за забег (~25-35 мин активной игры, см. tools/sim.mjs)
  prestigePointsDivisor: 20_000_000,
  prestigeMultPerPoint: 0.25,     // +25% за 1 PP (постоянно)
  prestigeZones: [                 // зона по числу prestige
    // name: RU; nameEn используется для всех не-RU локалей
    { at: 0, name: 'Гараж',            nameEn: 'Garage',        emoji: '🏚️', bonus: {} },
    { at: 1, name: 'Подвал Мемов',     nameEn: 'Meme Basement', emoji: '🕳️', bonus: { offlineEfficiency: 0.7 } },
    { at: 3, name: 'Фабрика',          nameEn: 'Factory',       emoji: '🏭', bonus: { offlineEfficiency: 0.8, autoMult: 1.25 } },
    { at: 6, name: 'Мем-Лаборатория',  nameEn: 'Meme Lab',      emoji: '🧪', bonus: { offlineEfficiency: 0.9, autoMult: 1.5, critMult: 1.5 } },
    { at: 10, name: 'Космос Брейнрота', nameEn: 'Brainrot Space', emoji: '🚀', bonus: { offlineEfficiency: 1.0, autoMult: 2, critMult: 2, offlineCapSec: 12 * 3600 } },
  ],

  // ---------- OFFLINE ----------
  offlineCapSec: 8 * 3600,
  offlineEfficiency: 0.6,     // offline даёт 60% от cps
  offlineMinSec: 60,          // меньше минуты — не показываем
  adRewardMultiplier: 2,      // x2 за rewarded

  // ---------- REWARDED PLACEMENTS ----------
  boosts: {
    income_x2:   { durationSec: 60, mult: 2 },
    lucky:       { durationSec: 60, critChanceMult: 3 },
    bonus_pack:  { minutesOfIncome: 10, minCoins: 200 },
    free_chest:  { cooldownSec: 600 },
  },

  // ---------- DAILY ----------
  dailyRewards: [
    { day: 1, coinsMinutes: 5,  gems: 5 },
    { day: 2, coinsMinutes: 10, gems: 10 },
    { day: 3, coinsMinutes: 15, gems: 15, chest: 'basic' },
    { day: 4, coinsMinutes: 20, gems: 25 },
    { day: 5, coinsMinutes: 30, gems: 40, chest: 'rare' },
    { day: 6, coinsMinutes: 45, gems: 60 },
    { day: 7, coinsMinutes: 60, gems: 100, chest: 'epic' },
  ],
  dailyCoinsMinBase: 100, // минимум коинов за день (coinsMinutes * cps, но не меньше base*day)

  // ---------- QUESTS (3 в день) ----------
  questPool: [
    { id: 'taps',    type: 'taps',    target: 500,   gems: 10, title: { ru: 'Сделай 500 тапов', en: 'Make 500 taps' } },
    { id: 'chests',  type: 'chests',  target: 3,     gems: 15, title: { ru: 'Открой 3 сундука', en: 'Open 3 chests' } },
    { id: 'earn',    type: 'earn',    target: 10000, gems: 10, title: { ru: 'Заработай 10 000 монет', en: 'Earn 10,000 coins' } },
    { id: 'upgrade', type: 'upgrades', target: 10,   gems: 10, title: { ru: 'Купи 10 улучшений', en: 'Buy 10 upgrades' } },
    { id: 'combo',   type: 'combo',   target: 50,    gems: 15, title: { ru: 'Набери комбо x2', en: 'Reach combo x2' } },
    { id: 'prestige',type: 'prestige',target: 1,     gems: 30, title: { ru: 'Сделай Перезапуск', en: 'Do a Prestige' } },
    { id: 'ad',      type: 'ad',      target: 1,     gems: 10, title: { ru: 'Посмотри бонусное видео (по желанию)', en: 'Watch a bonus video (optional)' }, optional: true },
  ],
  questsPerDay: 3,

  // ---------- START ----------
  startCoins: 0,
  startGems: 0,
  starterCharacterId: 'c01', // выдаётся сразу — игрок видит персонажа с первой секунды

  // ---------- ANTI-CHEAT ----------
  maxOfflineJumpMult: 1.5,   // offline не может дать > cap*eff*cps*1.5
  maxCoinsPerSecondSanity: 1e15,
};

export const RARITY = BALANCE.rarityOrder;
export const rarityIndex = (r) => RARITY.indexOf(r);
