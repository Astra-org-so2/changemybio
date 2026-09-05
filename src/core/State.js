import { BALANCE } from '../config/balance.js';
export const SAVE_VERSION = 1;

export function createDefaultState(now) {
  return {
    v: SAVE_VERSION,
    createdAt: now,
    lastSeen: now,
    lastSave: 0,
    coins: BALANCE.startCoins,
    gems: BALANCE.startGems,
    totalEarned: 0,          // за всё время
    runEarned: 0,            // за текущий забег (для prestige)
    tapLevel: 0,
    autoLevel: 0,
    luckLevel: 0,
    characters: { [BALANCE.starterCharacterId]: 1 }, // id -> level (1 = получен)
    activeCharacter: BALANCE.starterCharacterId,
    prestige: { count: 0, points: 0 },
    chests: { opened: {}, pity: {}, costIndex: { basic: 0 } }, // per type counters
    daily: { streak: 0, lastClaimDay: null, lastClaimTs: 0, totalClaims: 0 },
    achievements: {},        // id → число полученных ступеней
    quests: { day: null, list: [] },
    stats: { taps: 0, chests: 0, upgrades: 0, prestiges: 0, adsWatched: 0, interstitials: 0, maxCombo: 0, sessions: 0, rarest: null },
    boosts: {},              // id -> expiresAt (ms)
    cooldowns: {},           // id -> availableAt (ms)
    purchases: { removeAds: false, owned: [], consumedTokens: [], starterBought: false },
    settings: { sound: true, lang: null },
    flags: { firstUpgrade: false, firstChest: false, firstRare: false, tutorialDone: false, seenPrestigeHint: false },
    ab: {},
    events: {},
    social: { shortcutDone: false, shortcutAsked: 0 },
    offers: { removeAdsShownSession: 0, starterShownSession: 0, starterUnlocked: false },
  };
}
