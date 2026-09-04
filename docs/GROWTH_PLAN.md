# GROWTH_PLAN

Каждая фаза имеет **критерий остановки** — если он сработал, не переходим дальше, а чиним текущую фазу или закрываем проект.

## PHASE 1 — MVP (текущая)
- **Цель:** доказать core loop на реальных игроках.
- **Изменения:** всё из `docs/GDD.md`; публикация в черновик, тест через debug-панель, soft-launch без промо.
- **Метрики:** time-to-first-tap, tutorial completion (first_upgrade), taps/session, D1.
- **Успех:** first_upgrade ≥ 75 % новых, avg session ≥ 4 мин, D1 ≥ 25 %, crash-free ≥ 99 %.
- **Стоп:** first_upgrade < 50 % или avg session < 2 мин → проблема в первых 30 секундах; переделать onboarding до любых других работ.

## PHASE 2 — Retention ✅ реализовано в коде (v0.2), ждёт данных
- **Цель:** D1 ≥ 35 %, D7 ≥ 12 %.
- **Изменения:** тюнинг offline-cap/efficiency и daily-наград по данным; leaderboard-экран (ysdk.leaderboards); первое временное событие «Weekend Brainrot» (48 ч, event-персонаж, event-валюта); push-триггер через «Добавить на рабочий стол» (ysdk.shortcut, если доступно).
- **Метрики:** D1/D3/D7, sessions/DAU, daily_login streak distribution, offline claim rate.
- **Успех:** D1 +5 п.п. от Phase 1, sessions/DAU ≥ 2.2.
- **Стоп:** D7 < 5 % после 2 итераций → мета-прогрессия не удерживает; пересмотреть prestige/коллекцию, а не добавлять контент.

## PHASE 3 — Monetization ✅ код готов (v0.3): офферы + флаги; далее — A/B на данных
- **Цель:** ARPDAU ≥ 1 ₽.
- **Изменения:** A/B через Remote Config: `free_chest_cooldown_sec` (600 vs 300), `rewarded_reward_mult` (1 vs 1.5), `min_interstitial_interval_sec` (180 vs 120); показ Remove Ads после 3-го interstitial; Starter Pack — timing (после 1-го prestige vs после 1-го Epic).
- **Метрики:** RV views/DAU, RV completion, INT/DAU, IAP conv, ARPPU, ARPDAU, отток после interstitial (session_end в течение 30 с после `interstitial_shown`).
- **Успех:** RV views/DAU ≥ 1.2, ARPDAU ≥ 1 ₽, отток после INT < 5 %.
- **Стоп:** рост INT снижает D1 > 3 п.п. → откатить частоту; монетизация не должна есть retention.

## PHASE 4 — Content ✅ код готов (v0.4): 100 персонажей, трек «Удача», бонусы зон, арт-пайплайн
- **Цель:** удлинить LTV.
- **Изменения:** кастомный арт персонажей (WebP, ленивая загрузка по `asset`), +37 персонажей до 100, новые зоны prestige с уникальными бонусами, второй апгрейд-трек (crit chance), сезонные события раз в 2 недели.
- **Метрики:** D14/D30, collection % distribution, prestige count distribution.
- **Успех:** D30 ≥ 4 %, средняя коллекция у D7-игроков ≥ 40 %.
- **Стоп:** контент не сдвигает D14 → инвестировать в growth, а не в контент.

## PHASE 5 — Growth ✅ код готов (v0.5): share-карточка PNG, TR/ES, 3 иконки + обложка для A/B
- **Цель:** CTR карточки ≥ 6 %, органический приток.
- **Изменения:** A/B иконки/обложки (5 концепций из STORE_ASSETS.md), title-варианты, локализация TR/EN/ES (i18n уже готов), share-карточка с картинкой (canvas → clipboard/Web Share).
- **Метрики:** CTR, установки/показы каталога, share rate, K-factor.
- **Успех:** CTR +2 п.п., share ≥ 3 % от Epic+ дропов.
- **Стоп:** CTR не растёт после 3 итераций арта → проблема в жанровом позиционировании, а не в иконке.

## PHASE 6 — Scaling
- **Цель:** устойчивые 100 K+ ₽/мес.
- **Изменения:** серверная валидация покупок (`signed: true`, проверка signature), custom leaderboard для неавторизованных, кросс-промо между своими играми, подача на фичеринг, клоны формата на другие HTML5-порталы (адаптер `platform/` уже изолирует SDK).
- **Метрики:** ARPDAU по когортам, доля фичеринга в DAU, revenue/месяц.
- **Успех:** 3 месяца подряд ≥ 100 K ₽.
- **Стоп:** ARPDAU падает при росте DAU > 20 % → монетизация не масштабируется на широкую аудиторию; вернуться к Phase 3.
