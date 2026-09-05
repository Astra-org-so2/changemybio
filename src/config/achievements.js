/**
 * Достижения — постоянные (не сбрасываются prestige), награда гемами, без рекламы.
 * Каждое: id, category, tiers[] (ступени: порог → гемы). Прогресс берётся из state через `value(s)`.
 * Ступенчатость даёт частые мелкие «закрытия» в первые сессии и длинные цели для D30+.
 */
const A = (id, category, icon, name, value, tiers) => ({ id, category, icon, name, value, tiers });

export const ACHIEVEMENT_CATEGORIES = ['taps', 'coins', 'collection', 'chests', 'prestige'];

export const ACHIEVEMENTS = [
  A('taps', 'taps', '👆', { ru: 'Тапальщик', en: 'Tapper', tr: 'Dokunucu', es: 'Toqueador' },
    (s) => s.stats.taps, [[100, 5], [1000, 10], [10000, 25], [100000, 60], [1000000, 150]]),
  A('combo', 'taps', '🔥', { ru: 'Комбо-мастер', en: 'Combo Master', tr: 'Kombo Ustası', es: 'Maestro del combo' },
    (s) => s.stats.maxCombo, [[10, 5], [25, 10], [50, 20], [100, 50]]),
  A('earned', 'coins', '🪙', { ru: 'Капиталист', en: 'Capitalist', tr: 'Kapitalist', es: 'Capitalista' },
    (s) => s.totalEarned, [[1e4, 5], [1e6, 10], [1e8, 25], [1e10, 50], [1e12, 100], [1e15, 200]]),
  A('upgrades', 'coins', '⬆️', { ru: 'Прокачка', en: 'Upgrader', tr: 'Geliştirici', es: 'Mejorador' },
    (s) => s.stats.upgrades, [[10, 5], [50, 10], [200, 25], [1000, 60]]),
  A('chars', 'collection', '📒', { ru: 'Коллекционер', en: 'Collector', tr: 'Koleksiyoncu', es: 'Coleccionista' },
    (s) => Object.keys(s.characters).length, [[5, 5], [15, 15], [30, 30], [50, 60], [75, 100], [100, 250]]),
  A('rare', 'collection', '💠', { ru: 'Редкий вкус', en: 'Rare Taste', tr: 'Nadir Zevk', es: 'Gusto raro' },
    (s, ctx) => ctx.ownedOfRarity(s, 'rare'), [[1, 5], [10, 15], [25, 40]]),
  A('epic', 'collection', '💜', { ru: 'Эпично', en: 'Epic', tr: 'Epik', es: 'Épico' },
    (s, ctx) => ctx.ownedOfRarity(s, 'epic'), [[1, 10], [5, 20], [16, 60]]),
  A('legendary', 'collection', '🌟', { ru: 'Легенда', en: 'Legend', tr: 'Efsane', es: 'Leyenda' },
    (s, ctx) => ctx.ownedOfRarity(s, 'legendary'), [[1, 20], [4, 40], [8, 100]]),
  A('mythic', 'collection', '🧠', { ru: 'Абсолютный брейнрот', en: 'Absolute Brainrot', tr: 'Mutlak Brainrot', es: 'Brainrot absoluto' },
    (s, ctx) => ctx.ownedOfRarity(s, 'mythic'), [[1, 50], [4, 200]]),
  A('dupes', 'collection', '🔁', { ru: 'Дубли в дело', en: 'Dupes at Work', tr: 'Kopyalar İşte', es: 'Duplicados útiles' },
    (s) => Object.values(s.characters).reduce((a, l) => a + (l - 1), 0), [[10, 5], [50, 15], [200, 40]]),
  A('chests', 'chests', '🎁', { ru: 'Открывашка', en: 'Unboxer', tr: 'Kutu Açıcı', es: 'Abrecajas' },
    (s) => s.stats.chests, [[5, 5], [25, 10], [100, 25], [500, 60], [2000, 150]]),
  A('prestige', 'prestige', '⭐', { ru: 'Перезапуск', en: 'Rebooted', tr: 'Yeniden Başlatıldı', es: 'Reiniciado' },
    (s) => s.stats.prestiges, [[1, 20], [3, 30], [10, 60], [25, 150]]),
  A('ppoints', 'prestige', '✨', { ru: 'Звёздная пыль', en: 'Stardust', tr: 'Yıldız Tozu', es: 'Polvo de estrellas' },
    (s) => s.prestige.points, [[10, 10], [100, 25], [1000, 60], [10000, 150]]),
  A('days', 'prestige', '📅', { ru: 'Постоянный клиент', en: 'Regular', tr: 'Müdavim', es: 'Habitual' },
    (s) => s.daily.totalClaims || 0, [[3, 10], [7, 20], [14, 40], [30, 100]]),
];

export const ACHIEVEMENT_MAP = Object.fromEntries(ACHIEVEMENTS.map((a) => [a.id, a]));
