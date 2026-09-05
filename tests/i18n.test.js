import { test } from 'node:test';
import assert from 'node:assert/strict';
import { STRINGS, setLang, t, LANGS } from '../src/config/i18n.js';
test('all locales cover EN keys (or fall back) and placeholders match', () => {
  const enKeys = Object.keys(STRINGS.en);
  for (const l of LANGS) {
    setLang(l);
    for (const k of enKeys) { const v = t(k); assert.ok(v !== undefined && v !== k, `${l}.${k}`); if (typeof STRINGS.en[k] === 'string') for (const ph of STRINGS.en[k].match(/\{\w+\}/g) || []) assert.ok(String(STRINGS[l][k] ?? STRINGS.en[k]).includes(ph), `${l}.${k} missing ${ph}`); }
    assert.equal(Object.keys(t('rarity')).length, 5, l + ' rarity');
  }
  setLang('ru');
});
