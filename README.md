# Brainrot Factory: Tap & Collect

Мемный tap/idle-коллекционер для **Яндекс Игр**. Vanilla JS (ES-modules), DOM UI + Canvas-партиклы, без фреймворков. Прод-бандл ≈ 90 КБ, ноль внешних ассетов.

## Документация
| Файл | Содержание |
|---|---|
| `docs/GDD.md` | Game Design Document, формулы, первые 5 минут |
| `docs/MONETIZATION_MODEL.md` | Параметрическая модель дохода, сценарии, DAU для 100 K ₽ |
| `docs/GROWTH_PLAN.md` | Фазы 1–6 с критериями успеха и остановки |
| `docs/STORE_ASSETS.md` | Названия, описания, концепции иконок/обложек |
| `docs/YANDEX_MODERATION_CHECKLIST.md` | Аудит на соответствие требованиям платформы |

## Структура
```
src/
  config/   balance.js (BALANCE_CONFIG), characters.js (63), products.js (IAP), ab.js (AB_CONFIG/Remote Config), i18n.js
  core/     GameManager, SaveManager (cloud+local, checksum, sanitize), TimeManager, EventBus, State, format
  game/     Economy (формулы), EventSystem (временные события), TapSystem, UpgradeSystem, ChestSystem (pity), PrestigeSystem, CollectionSystem, QuestSystem, DailySystem, OfflineSystem
  platform/ YandexPlatform (адаптер ysdk), MockPlatform (dev), MonetizationManager → AdManager + PaymentManager, LeaderboardManager
  analytics/AnalyticsManager
  ui/       UI (роутер/модалки), MainScreen, CollectionScreen, ChestScreen, ShopScreen, QuestScreen, PrestigeScreen, SocialScreen (событие + рейтинг), Particles, Sound
public/     index.html, styles.css
tools/      build.js, dev-server.js, sim.mjs / sweep.mjs (симуляция экономики)
tests/      unit (node --test) + smoke (jsdom, полный boot)
```
Правило: UI слушает `EventBus`, игровая логика не знает про DOM; никто, кроме `MonetizationManager`, не трогает рекламу/покупки.

## Разработка
```bash
npm install
npm run dev        # http://localhost:8080 — MockPlatform (реклама/покупки эмулируются оверлеем)
npm test           # юнит-тесты экономики/систем
node tests/smoke.jsdom.mjs   # полный прогон игры в jsdom (нужен jsdom: npm i -D jsdom)
node tools/sweep.mjs v       # симуляция прогресса активного игрока за 1 час
```
В dev-режиме доступны `window.__game` и `window.__ui`.

## Сборка
```bash
npm run build      # → dist/ (index.html, styles.css, game.js)
npm run zip        # → brainrot-factory.zip для загрузки в Консоль
```

## Публикация в Яндекс Играх
1. Консоль → «Добавить черновик» → загрузить `brainrot-factory.zip` (в корне архива должен быть `index.html`).
2. **Покупки:** заранее подать заявку на подключение; создать товары с ID `remove_ads`, `starter_pack`, `gems_small`, `gems_medium`, `gems_large`, `premium_pack` (типы: non-consumable для remove_ads/premium_pack, consumable для остальных).
3. **Реклама:** включить монетизацию; sticky-баннер по желанию (в коде не управляется).
4. **Remote Config (A/B):** создать флаги с именами из `src/config/ab.js` (например `min_interstitial_interval_sec`).
5. **Лидерборды:** технические имена `total_coins`, `prestige`, `collection`, `event_score` (numeric, по убыванию).
   **Событие «Weekend Brainrot»** идёт по расписанию (пт 12:00 UTC, 48 ч); форс-запуск/выключение — флаг Remote Config `event_override` = `weekend_brainrot` | `none`.
6. Открыть черновик с `?debug-mode=16`, проверить индикатор SDK `IT`, чистую консоль, реальный rewarded/interstitial, тестовую покупку и её consume.
7. Загрузить промо по `docs/STORE_ASSETS.md`, пройти `docs/YANDEX_MODERATION_CHECKLIST.md`, отправить на модерацию.

## Серверная валидация покупок (опционально)
См. `server/README.md`. Включается флагом Remote Config `payments_server_url` — без релиза клиента.

## Локальный запуск с реальным SDK
Следуй официальной инструкции «Локальный запуск» (проксирование `/sdk.js` через `@yandex-games/sdk-dev-proxy`) — тогда вместо MockPlatform будет реальный `YaGames`.

## Арт
Персонажи грузятся лениво из `assets/characters/<id>.webp` с фолбэком на emoji (`src/ui/Art.js`). Пайплайн: `tools/art-pipeline.md`. Иконка-концепт: `assets/store/icon_512.png`.

## Баланс
Все коэффициенты — в `src/config/balance.js`. После правок запускай `node tools/sweep.mjs v`: смотри `firstChest` (цель 40–60 с), `prestigeAt` (цель 25–35 мин), `maxGap` (максимальная пауза между апгрейдами, цель < 180 с).
