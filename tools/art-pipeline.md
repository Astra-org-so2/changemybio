# Art pipeline (Phase 4)

1. Сгенерировать/нарисовать персонажа: flat vector, толстый контур, белый фон, full body, без текста.
2. `python3 tools/art.py in.png <id>` → `assets/characters/<id>.webp` (256×256, прозрачный фон, ~10 КБ).
3. Ничего в коде менять не нужно: `characters.js` уже ссылается на `assets/characters/<id>.webp`; `ui/Art.js` подхватит файл, иначе покажет emoji.
4. Готово: c01, r01, e01, l01, l02, l05, m01, m02, m03 (все mythic, ключевые legendary/epic/rare — они попадают в share-карточки). Остальные — emoji до появления арта.
5. Бюджет: 100 персонажей × ~12 КБ ≈ 1.2 МБ, грузится лениво только для видимых карточек.
