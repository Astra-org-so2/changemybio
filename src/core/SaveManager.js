import { createDefaultState, SAVE_VERSION } from './State.js';
import { TimeManager } from './TimeManager.js';
import { BALANCE } from '../config/balance.js';

const LS_KEY = 'brainrot_factory_save_v1';
const CLOUD_KEY = 'save';
const CLOUD_MIN_INTERVAL = 15_000; // не чаще раза в 15с (лимит SDK 100/5мин)

/** Лёгкая контрольная сумма — защита от случайной правки, не криптография. */
function checksum(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
  return (h >>> 0).toString(16);
}

export class SaveManager {
  constructor(platform) {
    this.platform = platform;
    this.lastCloudAt = 0;
    this.cloudDirty = false;
  }

  /** Приоритет: cloud (если новее) → local → default */
  async load() {
    const now = TimeManager.now();
    const local = this._readLocal();
    let cloud = null;
    try {
      const data = await this.platform.loadData([CLOUD_KEY]);
      if (data && data[CLOUD_KEY]) cloud = this._parse(data[CLOUD_KEY]);
    } catch (e) { console.warn('[Save] cloud load failed', e); }

    let state = null, source = 'default';
    if (cloud && local) { state = (cloud.lastSave || 0) >= (local.lastSave || 0) ? cloud : local; source = state === cloud ? 'cloud' : 'local'; }
    else if (cloud) { state = cloud; source = 'cloud'; }
    else if (local) { state = local; source = 'local'; }
    if (!state) state = createDefaultState(now);
    state = this._migrate(state);
    state = this._sanitize(state, now);
    return { state, source };
  }

  save(state, { flush = false } = {}) {
    state.lastSave = TimeManager.now();
    state.lastSeen = state.lastSave;
    const payload = this._serialize(state);
    try { localStorage.setItem(LS_KEY, payload); } catch (e) { /* private mode */ }
    this.cloudDirty = true;
    const t = TimeManager.now();
    if (flush || t - this.lastCloudAt > CLOUD_MIN_INTERVAL) {
      this.lastCloudAt = t; this.cloudDirty = false;
      this.platform.saveData({ [CLOUD_KEY]: payload }, flush).catch((e) => { this.cloudDirty = true; console.warn('[Save] cloud save failed', e); });
    }
  }

  _serialize(state) { const body = JSON.stringify(state); return JSON.stringify({ c: checksum(body), d: body }); }
  _parse(raw) {
    try {
      const obj = typeof raw === 'string' ? JSON.parse(raw) : raw;
      if (obj && obj.d && obj.c) {
        if (checksum(obj.d) !== obj.c) { console.warn('[Save] checksum mismatch'); return null; }
        return JSON.parse(obj.d);
      }
      return obj && obj.v ? obj : null;
    } catch { return null; }
  }
  _readLocal() { try { return this._parse(localStorage.getItem(LS_KEY)); } catch { return null; } }

  _migrate(s) {
    const def = createDefaultState(s.createdAt || TimeManager.now());
    // глубокий merge дефолтов — новые поля появляются автоматически
    const merge = (d, x) => { for (const k in d) { if (x[k] === undefined) x[k] = d[k]; else if (d[k] && typeof d[k] === 'object' && !Array.isArray(d[k]) && x[k] && typeof x[k] === 'object') merge(d[k], x[k]); } return x; };
    s = merge(def, s);
    s.v = SAVE_VERSION;
    return s;
  }

  /** Базовые проверки целостности (anti-cheat lite). */
  _sanitize(s, now) {
    const num = (v, max = 1e300) => (Number.isFinite(v) && v >= 0 ? Math.min(v, max) : 0);
    s.coins = num(s.coins); s.gems = num(s.gems, 1e9); s.totalEarned = num(s.totalEarned); s.runEarned = num(s.runEarned);
    s.tapLevel = Math.floor(num(s.tapLevel, 100000)); s.autoLevel = Math.floor(num(s.autoLevel, 100000)); s.luckLevel = Math.floor(num(s.luckLevel, BALANCE.luckMaxLevel));
    s.prestige.count = Math.floor(num(s.prestige.count, 100000)); s.prestige.points = Math.floor(num(s.prestige.points, 1e7));
    if (s.lastSeen > now) s.lastSeen = now;           // время из будущего
    if (s.createdAt > now) s.createdAt = now;
    for (const id in s.characters) { const l = Math.floor(num(s.characters[id], BALANCE.maxCharacterLevel)); if (l < 1) delete s.characters[id]; else s.characters[id] = l; }
    if (!s.characters[BALANCE.starterCharacterId]) s.characters[BALANCE.starterCharacterId] = 1;
    if (!s.characters[s.activeCharacter]) s.activeCharacter = BALANCE.starterCharacterId;
    for (const id in s.boosts) if (s.boosts[id] > now + 3600_000) s.boosts[id] = now; // буст «на год» — обнуляем
    return s;
  }

  clear() { try { localStorage.removeItem(LS_KEY); } catch {} }
}
