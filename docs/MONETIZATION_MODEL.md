# MONETIZATION_MODEL — путь к 100 000 ₽/мес

> **Дисклеймер.** Ни одна цифра ниже не является прогнозом или гарантией. Это параметрическая модель:
> подставь реальные значения из Консоли Яндекс Игр / РСЯ после запуска. Все рекламные ставки (eCPM)
> помечены как **UNKNOWN** — их нужно взять из фактической статистики; в модели они — переменные.

## 1. Формулы

```
DAU                 = daily active users
S                   = sessions / DAU / day
RV_rate             = доля DAU, посмотревших ≥1 rewarded
RV_per_viewer       = rewarded views на одного смотрящего
RV_views/DAU        = RV_rate × RV_per_viewer
INT_views/DAU       = interstitials на DAU (ограничен AdManager: ≤4/сессию, ≥180 с интервал)

Ad revenue / DAU    = (RV_views/DAU × eCPM_rv + INT_views/DAU × eCPM_int) / 1000        # eCPM в ₽ за 1000 показов — UNKNOWN
IAP revenue / DAU   = conv_daily × ARPPU_daily                                           # conv_daily = доля DAU, купивших сегодня
ARPDAU              = Ad revenue/DAU + IAP revenue/DAU
Monthly revenue     = ARPDAU × DAU × 30
DAU_needed(target)  = target / (ARPDAU × 30)
```

## 2. Сценарии (переменные → результат)

| Параметр | Pessimistic | Base | Optimistic | Источник после запуска |
|---|---|---|---|---|
| DAU | 2 000 | 5 000 | 12 000 | Консоль → Аудитория |
| Sessions/DAU | 1.6 | 2.2 | 3.0 | `session_start` |
| RV opt-in rate | 25 % | 40 % | 55 % | `ad_reward_completed` uniq / DAU |
| RV views / viewer | 1.5 | 2.5 | 3.5 | `ad_reward_completed` |
| **RV views/DAU** | **0.375** | **1.0** | **1.93** | |
| INT views/DAU | 0.8 | 1.3 | 1.8 | `interstitial_shown` |
| eCPM rewarded, ₽ | **X_rv (UNKNOWN)** | X_rv | X_rv | РСЯ статистика |
| eCPM interstitial, ₽ | **X_int (UNKNOWN)** | X_int | X_int | РСЯ статистика |
| IAP daily conversion | 0.10 % | 0.30 % | 0.60 % | `purchase_completed` uniq / DAU |
| ARPPU (за покупку), ₽ | 60 | 90 | 130 | средний чек |
| IAP rev / DAU, ₽ | 0.06 | 0.27 | 0.78 | |

**Ad revenue / DAU** = (RV_views/DAU · X_rv + INT_views/DAU · X_int) / 1000.

### Иллюстративная подстановка (ТОЛЬКО для проверки арифметики; X — не факты)

Если принять для расчёта X_rv = 200 ₽ и X_int = 60 ₽ (условные значения, заменить на реальные):

| | Pessimistic | Base | Optimistic |
|---|---|---|---|
| Ad rev / DAU | (0.375·200 + 0.8·60)/1000 = **0.123 ₽** | (1.0·200 + 1.3·60)/1000 = **0.278 ₽** | (1.93·200 + 1.8·60)/1000 = **0.494 ₽** |
| IAP rev / DAU | 0.06 ₽ | 0.27 ₽ | 0.78 ₽ |
| **ARPDAU** | **0.18 ₽** | **0.55 ₽** | **1.27 ₽** |
| Monthly ad | 7 400 ₽ | 41 700 ₽ | 178 000 ₽ |
| Monthly IAP | 3 600 ₽ | 40 500 ₽ | 281 000 ₽ |
| **Monthly total** | **≈11 000 ₽** | **≈82 000 ₽** | **≈459 000 ₽** |

## 3. Сколько DAU нужно для 100 000 ₽/мес

`DAU_needed = 100 000 / (ARPDAU × 30) = 3 333 / ARPDAU`

| ARPDAU, ₽ | DAU needed |
|---|---|
| 0.2 | 16 700 |
| 0.5 | 6 700 |
| 1.0 | 3 300 |
| 1.5 | 2 200 |
| 2.0 | 1 700 |
| 3.0 | 1 100 |

**Вывод для команды:** цель — не «больше DAU любой ценой», а ARPDAU ≥ 1 ₽ при DAU ≥ 3–4 K. Рычаги ARPDAU в порядке приоритета:
1. **RV views/DAU** (самый управляемый): качество плейсментов, видимость выгоды, cooldown free chest. Цель ≥ 1.5.
2. **Sessions/DAU**: offline cap 8 ч + daily + квесты → цель ≥ 2.5.
3. **IAP conversion**: Remove Ads видим после 2–3 interstitial; Starter Pack после первого prestige (момент максимальной вовлечённости).
4. **INT/DAU** — последний рычаг, ограничен сверху UX и правилами платформы.

## 4. Что замерить в первые 14 дней (калибровка модели)

| Параметр | Событие / источник | Заменяет |
|---|---|---|
| eCPM rewarded/interstitial | Консоль → Монетизация | X_rv, X_int |
| RV opt-in | `ad_reward_available` vs `ad_reward_started` vs `ad_reward_completed` | RV_rate, RV_per_viewer |
| Interstitial fill | `interstitial_check` (reason) vs `interstitial_shown` | INT/DAU |
| Конверсия | `purchase_started` → `purchase_completed` по product_id | conv, ARPPU |
| Retention | `retention_milestone`, Консоль | DAU-прогноз при данном притоке |

## 4a. Эксперименты Phase 3 (флаги Remote Config, без релиза)

| Флаг | A (default) | B | Метрика решения |
|---|---|---|---|
| `free_chest_cooldown_sec` | 600 | 300 | RV views/DAU, D1 |
| `rewarded_reward_mult` | 1 | 1.5 | RV opt-in, ARPDAU |
| `min_interstitial_interval_sec` | 180 | 120 | INT/DAU vs отток после INT |
| `remove_ads_offer_after_int` | 3 | 2 / 5 | offer→purchase conv, D1 |
| `starter_pack_trigger` | prestige | epic | conv Starter Pack, ARPPU |

Правило: один флаг за раз, минимум 7 дней, решение по ARPDAU **и** D1 одновременно (см. критерий остановки Phase 3).

## 5. Ограничения модели
- eCPM зависит от гео, сезона, устройства; RU-мобайл и десктоп отличаются — считать раздельно.
- Remove Ads снижает INT/DAU у платящих — учтено как эффект второго порядка (не моделируется отдельно в MVP).
- Модель линейна по DAU; на практике ARPDAU у «органики» и «фичеринга» разный — вести когорты.
