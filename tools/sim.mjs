// Симуляция активного игрока: 3 тапа/сек, жадно покупает самое дешёвое улучшение, открывает basic chest когда хватает.
import { createDefaultState } from '../src/core/State.js';
import { coinsPerTap, coinsPerSecond, tapUpgradeCost, autoUpgradeCost, chestCost, prestigePreview } from '../src/game/Economy.js';
import { ChestSystem } from '../src/game/ChestSystem.js';
import { BALANCE } from '../src/config/balance.js';
const s = createDefaultState(0); const gm = { state: s, now: () => 0, analytics: { track() {} }, quests: { progress() {} }, addCoins(n) { s.coins += n; }, addGems(n) { s.gems += n; } };
const ch = new ChestSystem(gm);
const log = []; let firstChest = null, chests = 0, firstRare = null, prestigeAt = null;
const TPS = 3;
for (let sec = 1; sec <= 3600; sec++) {
  const gain = coinsPerTap(s, 0) * TPS + coinsPerSecond(s, 0); s.coins += gain; s.runEarned += gain;
  // buy cheapest upgrade with better value; keep buying while affordable
  for (let k = 0; k < 5; k++) { const ct = tapUpgradeCost(s.tapLevel), ca = autoUpgradeCost(s.autoLevel); if (s.coins >= ct && ct <= ca * 1.2) { s.coins -= ct; s.tapLevel++; } else if (s.coins >= ca) { s.coins -= ca; s.autoLevel++; } else break; }
  const cc = chestCost(s, 'basic'); if (s.coins >= cc * 1.5) { s.coins -= cc; s.chests.costIndex.basic++; const r = ch._roll('basic', 'sim'); chests++; if (!firstChest) firstChest = sec; if (!firstRare && r.rarity !== 'common') firstRare = sec; }
  if (!prestigeAt && prestigePreview(s).can) prestigeAt = sec;
  if ([30, 60, 120, 180, 300, 600, 900, 1200, 1800, 2700, 3600].includes(sec)) log.push({ t: sec + 's', coins: Math.round(s.coins), cpt: coinsPerTap(s, 0).toFixed(1), cps: coinsPerSecond(s, 0).toFixed(1), tapL: s.tapLevel, autoL: s.autoLevel, chests, chars: Object.keys(s.characters).length, run: Math.round(s.runEarned) });
}
console.table(log);
console.log({ firstChest, firstRare, prestigeAt, prestigePts: prestigePreview(s).points });
