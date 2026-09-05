import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createDefaultState } from '../src/core/State.js';
import { EventSystem } from '../src/game/EventSystem.js';
import { AB } from '../src/config/ab.js';

const mk = (now) => { const s = createDefaultState(0); const gm = { state: s, now: () => now, analytics: { track() {} }, addGems(n) { s.gems += n; }, chests: { open() {} }, emitState() {}, save() {}, leaderboards: { submit() {} } }; return { s, ev: new EventSystem(gm) }; };

test('weekend event active Sat 12:00 UTC, inactive Wed', () => {
  AB.set({});
  const sat = Date.UTC(2026, 8, 5, 12); // Sat
  assert.ok(mk(sat).ev.active(sat), 'active on Saturday');
  const wed = Date.UTC(2026, 8, 2, 12);
  assert.equal(mk(wed).ev.active(wed), null);
  const monAfter = Date.UTC(2026, 8, 7, 12, 1); // Mon 12:01 — ended
  assert.equal(mk(monAfter).ev.active(monAfter), null);
});

test('event progress resets per occurrence; milestones claim once', () => {
  AB.set({ event_override: 'weekend_brainrot' });
  const now = Date.UTC(2026, 8, 5, 12); const { s, ev } = mk(now);
  for (let i = 0; i < 12; i++) ev.onChest(); // 300
  const st = ev.status(); assert.equal(st.score, 300); assert.ok(st.milestones[1].done);
  assert.ok(ev.claim(1)); assert.equal(ev.claim(1), false); assert.equal(s.gems, 25);
  assert.equal(ev.claim(3), false);
  for (let i = 0; i < 28; i++) ev.onChest(); assert.ok(ev.claim(3)); assert.equal(s.characters.ev01, 1);
  AB.set({});
});
