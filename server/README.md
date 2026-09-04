# Payments server (Phase 6 — серверная валидация покупок)

Эталонная реализация проверки подписи Яндекс Игр. Без зависимостей, Node 18+.

```bash
YANDEX_PAYMENTS_SECRET='<ключ из Консоли → Покупки → Настройки>' ALLOW_ORIGIN='https://yandex.ru' npm run server
```

## Как это работает
1. Клиент (при заданном флаге Remote Config `payments_server_url`) инициализирует `getPayments({ signed: true })`.
2. `payments.purchase()` / `getPurchases()` возвращают `{ signature }` = `<base64 HMAC-SHA256>.<base64 JSON>`.
3. Клиент шлёт signature `POST /purchase` или `POST /purchases` (text/plain).
4. Сервер (`server/verify.js`): HMAC с секретом (timing-safe), парсинг, double-spend по `token`, маппинг `product.id → grant` из `src/config/products.js`.
5. Ответ `{ granted: [{ token, productId, grant }], rejected: [...] }`. Клиент начисляет **только granted**, затем вызывает `consumePurchase(token)`.

## Что заменить в продакшене
- `usedTokens` Map → таблица с PRIMARY KEY по token (Postgres/Redis). Запись — до ответа клиенту.
- Привязка к игроку: передавать `player.signature` (из `getPlayer({ signed: true })`) и хранить `player_id` рядом с токеном.
- Начисление: если у вас серверный профиль — писать туда; если нет — текущая схема (клиент применяет granted) уже устраняет подделку подписи и повторное начисление одного токена.
- Rate limit и логирование `rejected` в аналитику (`purchase_failed` с reason).

## Тесты
`tests/server.test.js` — проверка на публичном примере из документации (ключ `t0p$ecret`), отказ при подмене суммы/ключа, double-spend.
