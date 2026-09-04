/**
 * EVENTS — временные события. Активность вычисляется по расписанию (UTC) — не нужен релиз для запуска.
 * schedule: { type: 'weekly', startDow: 5 (пт), startHour: 12, durationHours: 48 } → каждые выходные.
 * Можно перекрыть Remote Config: флаг event_override = 'weekend_brainrot' | 'none'.
 */
export const EVENTS = [
  {
    id: 'weekend_brainrot',
    name: { ru: 'Выходной Брейнрот', en: 'Weekend Brainrot' },
    desc: { ru: 'Собирай 🌀 за тапы и сундуки. Дойди до 1000 — получи эксклюзивного персонажа!', en: 'Collect 🌀 from taps and chests. Reach 1000 — get an exclusive character!' },
    emoji: '🌀',
    schedule: { type: 'weekly', startDow: 5, startHour: 12, durationHours: 48 },
    currencyPerTap: 1,          // 🌀 за тап (с шансом)
    currencyTapChance: 0.2,
    currencyPerChest: 25,
    milestones: [               // event score → награда
      { score: 100,  gems: 10 },
      { score: 300,  gems: 25, chest: 'rare' },
      { score: 600,  gems: 50 },
      { score: 1000, character: 'ev01' },
    ],
    leaderboard: 'event_score',
  },
];
export const EVENT_MAP = Object.fromEntries(EVENTS.map((e) => [e.id, e]));
