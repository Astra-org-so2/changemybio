# YANDEX_MODERATION_CHECKLIST (аудит MVP v0.1)

Легенда: ✅ выполнено в коде · ⚙️ требует настройки в Консоли · 🔎 проверить вручную перед подачей

## SDK
- ✅ SDK подключён относительным путём `<script src="/sdk.js">` (рекомендуемый вариант для загрузки архива).
- ✅ `YaGames.init()` вызывается один раз до любых методов SDK; при отсутствии SDK — MockPlatform (только dev).
- ✅ `ysdk.features.LoadingAPI.ready()` вызывается после скрытия лоадера, когда UI интерактивен.
- ✅ `GameplayAPI.start()/stop()` — при старте, показе рекламы, сворачивании вкладки.
- ✅ Используются только документированные методы (adv, player, payments, leaderboards, getFlags, clipboard, isAvailableMethod).
- 🔎 Открыть игру с `?debug-mode=16` — индикатор loader должен быть `IT`.

## Реклама
- ✅ Rewarded — только по явной кнопке с описанием награды (📺 + текст). Никогда автоматически.
- ✅ Награда выдаётся только в `onRewarded`; `onClose` без reward — ничего.
- ✅ Interstitial — только в логических паузах: после prestige (после анимации), при выходе из Collection/Shop.
- ✅ Не показывается: первые 180 с сессии, чаще 180 с, > 4 за сессию, 60 с после rewarded, 3 с после тапа, 5–20 с после дропа.
- ✅ Нет `setInterval(showFullscreenAdv)`.
- ✅ После покупки Remove Ads interstitial отключён; rewarded доступен.
- ✅ Нет сторонних рекламных SDK.
- ⚙️ Включить монетизацию в Консоли → Реклама.

## Офферы IAP (Phase 3)
- ✅ Оффер Remove Ads — только после N-го interstitial (флаг, по умолчанию 3), одна закрываемая модалка, cooldown 3 сессии, никогда поверх другой модалки и не в первые минуты (interstitial сам не раньше 180 с).
- ✅ Starter Pack — по триггеру `starter_pack_trigger` (prestige|epic|none), показ через 2.5 с после анимации, cooldown 2 сессии.
- ✅ Цена в оффере — из `getCatalog()`; при недоступности платежей офферы не показываются.
- ✅ Воронка: `offer_shown → offer_accepted/offer_dismissed → purchase_started → purchase_completed/failed`.
- ✅ После покупки Remove Ads вызывается `adv.hideBannerAdv()` (если sticky-баннер управляется через API в Консоли).

## Покупки
- ✅ Опциональная серверная валидация: флаг `payments_server_url` → `getPayments({signed:true})` → HMAC-проверка на сервере (`server/`), double-spend по токену. Без флага — клиентская схема (допустима платформой).
- ✅ `ysdk.getPayments()` с обработкой недоступности (магазин показывает «Скоро»).
- ✅ Цена/валюта/иконка — из `getCatalog()` (`priceValue`, `priceCurrencyCode`, `getPriceCurrencyImage`) — п. 1.13.2.
- ✅ `getPurchases()` при каждом запуске + `consumePurchase()` для consumable — п. 1.13.1.
- ✅ Идемпотентность по `purchaseToken`; сначала начисление и сохранение, потом consume.
- ⚙️ Создать товары в Консоли с теми же `id`: remove_ads, starter_pack, gems_small, gems_medium, gems_large, premium_pack.
- ⚙️ Подать заявку на подключение покупок заранее.

## Лидерборды / соцфункции (Phase 2)
- ✅ `setScore` только после `isAvailableMethod('leaderboards.setScore')`, троттлинг 60 с; `getEntries` кэшируется 1 мин (лимит 20/5 мин).
- ✅ Авторизация — по кнопке с объяснением выгоды (рейтинг + облако), не блокирует игру.
- ✅ Ярлык: `shortcut.canShowPrompt()` → кнопка → `showPrompt()`; награда только при `outcome === 'accepted'`; не чаще 1 раза в 3 сессии, не ранее 300 с.
- ⚙️ Создать лидерборды с техническими именами `total_coins`, `prestige`, `collection`, `event_score` (numeric, DESC).

## Сохранения
- ✅ `player.setData` (cloud) + localStorage fallback; выбирается более свежее по `lastSave`.
- ✅ Троттлинг cloud-сохранений ≤ 1/15 с (лимит 100/5 мин); flush при скрытии вкладки.
- ✅ Размер сейва ≪ 200 КБ.
- 🔎 iOS Safari: localStorage может очищаться — cloud приоритетен для авторизованных.

## Ориентация / устройства
- ✅ Portrait mobile-first, desktop — центрированный фрейм 480 px. Landscape на мобиле — тот же layout (не ломается).
- ⚙️ В Консоли указать: мобильные + десктоп, ориентация — портрет (или «любая»).
- ✅ Все tap-targets ≥ 44 px.

## Контент
- ✅ Оригинальные персонажи/названия, emoji-графика системная, звуки процедурные (WebAudio) — нет чужих ассетов.
- ✅ Нет запрещённого контента, азартных механик за реальные деньги (сундуки за игровую валюту, шансы показаны).
- ✅ Локализация RU/EN по `ysdk.environment.i18n.lang`.

## Производительность
- ✅ Бандл ~90 КБ, без внешних библиотек, без изображений. Boot логики < 100 мс (jsdom).
- ✅ Партиклы — фиксированный пул, авто-даунгрейд при FPS < 40.
- 🔎 Проверить на реальном Android среднего сегмента: 60 FPS при 5 тапах/сек.

## Ошибки консоли
- ✅ Smoke-тест: 0 ошибок при полном прогоне (`node tests/smoke.jsdom.mjs`).
- 🔎 Прогнать в браузере с реальным SDK через debug-панель — console должен быть чистым.

## Share (Phase 5)
- ✅ Share-карточка генерируется на canvas из собственных ассетов; Web Share API → clipboard(image) → download; текст — через `ysdk.clipboard.writeText`. Только по кнопке игрока.

## Промоматериалы
- ⚙️ Иконка 512×512, обложка, ≥ 3 скриншота — по `STORE_ASSETS.md`. Только оригинальный арт.
