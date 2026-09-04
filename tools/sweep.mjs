import { createDefaultState } from '../src/core/State.js';
import { coinsPerTap, coinsPerSecond, tapUpgradeCost, autoUpgradeCost, chestCost, prestigePreview } from '../src/game/Economy.js';
import { ChestSystem } from '../src/game/ChestSystem.js';
import { BALANCE } from '../src/config/balance.js';
// seeded rng
let seed = 42; Math.random = () => { seed = (seed * 1664525 + 1013904223) % 4294967296; return seed / 4294967296; };
export function run(params = {}, TPS = 3, verbose = false) {
  Object.assign(BALANCE, params); seed = 42;
  const s = createDefaultState(0); const gm = { state: s, now: () => 0, analytics: { track() {} }, quests: { progress() {} }, addCoins(n) { s.coins += n; }, addGems(n) { s.gems += n; } };
  const ch = new ChestSystem(gm); const log = []; let firstChest = null, chests = 0, prestigeAt = null, lastUpg = 0, maxGap = 0;
  for (let sec = 1; sec <= 3600; sec++) {
    const gain = coinsPerTap(s, 0) * TPS + coinsPerSecond(s, 0); s.coins += gain; s.runEarned += gain;
    for (let k = 0; k < 5; k++) { const ct = tapUpgradeCost(s.tapLevel), ca = autoUpgradeCost(s.autoLevel); if (s.coins >= ct && ct <= ca) { s.coins -= ct; s.tapLevel++; maxGap = Math.max(maxGap, sec - lastUpg); lastUpg = sec; } else if (s.coins >= ca) { s.coins -= ca; s.autoLevel++; maxGap = Math.max(maxGap, sec - lastUpg); lastUpg = sec; } else break; }
    const cc = chestCost(s, 'basic'); if (s.coins >= cc * 1.3) { s.coins -= cc; s.chests.costIndex.basic++; ch._roll('basic', 'sim'); chests++; if (!firstChest) firstChest = sec; }
    if (!prestigeAt && prestigePreview(s).can) prestigeAt = sec;
    if ([30, 60, 120, 300, 600, 1200, 1800, 3600].includes(sec)) log.push({ t: sec, cpt: +coinsPerTap(s, 0).toFixed(0), cps: +coinsPerSecond(s, 0).toFixed(0), tapL: s.tapLevel, autoL: s.autoLevel, chests, chars: Object.keys(s.characters).length, run: Math.round(s.runEarned) });
  }
  if (verbose) console.table(log);
  return { firstChest, prestigeAt, maxGap, chests, chars: Object.keys(s.characters).length, run1h: Math.round(s.runEarned), pts: prestigePreview(s).points, cps1h: Math.round(coinsPerSecond(s, 0)) };
}
if (process.argv[2] === 'v') console.log(run({}, 3, true));
