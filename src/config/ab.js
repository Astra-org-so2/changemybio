/**
 * AB_CONFIG — плоский объект строк (формат ysdk.getFlags defaultFlags).
 * Локальные дефолты перекрываются Remote Config из Консоли Яндекс Игр.
 * Все значения — строки (ограничение SDK). Парсим через getNum/getBool.
 *
 * Как добавить эксперимент: добавь ключ сюда, затем создай флаг с тем же именем в Консоли.
 */
export const AB_DEFAULTS = {
  // Витрина
  game_title_variant: 'A',           // A|B|C — используется для аналитики/заголовка в игре
  onboarding_variant: 'hint',        // hint | none
  // Экономика
  tap_mult: '1',
  upgrade_cost_mult: '1',
  chest_cost_mult: '1',
  rewarded_reward_mult: '1',
  // Реклама
  min_interstitial_interval_sec: '180',
  max_interstitial_per_session: '4',
  min_session_time_before_ad_sec: '180',
  // Rewarded
  free_chest_cooldown_sec: '600',
  income_boost_duration_sec: '60',
  // Серверная валидация покупок (Phase 6). '' = клиентская обработка; URL = POST signature на сервер.
  payments_server_url: '',
  // Монетизация: офферы
  remove_ads_offer_after_int: '3',     // показать оффер Remove Ads после N-го interstitial (0 = никогда)
  remove_ads_offer_cooldown_sessions: '3',
  starter_pack_trigger: 'prestige',    // prestige | epic | none — момент разблокировки/показа Starter Pack
  starter_pack_offer_cooldown_sessions: '2',
  // События
  event_override: '',                // '' = по расписанию | 'none' | 'weekend_brainrot'
  // Соц.
  shortcut_prompt_after_sec: '300',  // предлагать ярлык после N сек в сессии (0 = выкл)
  shortcut_reward_gems: '20',
};

let flags = { ...AB_DEFAULTS };
export const AB = {
  set(remote) { flags = { ...AB_DEFAULTS, ...(remote || {}) }; },
  get(key) { return flags[key]; },
  num(key) { const v = parseFloat(flags[key]); return Number.isFinite(v) ? v : parseFloat(AB_DEFAULTS[key]); },
  bool(key) { return String(flags[key]) === 'true'; },
  all() { return { ...flags }; },
};
