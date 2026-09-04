# Art pipeline (Phase 4)

1. Сгенерировать/нарисовать персонажа: flat vector, толстый контур, белый фон, full body, без текста.
2. `python3 tools/art.py in.png <id>` → `assets/characters/<id>.webp` (256×256, прозрачный фон, ~10 КБ).
3. Ничего в коде менять не нужно: `characters.js` уже ссылается на `assets/characters/<id>.webp`; `ui/Art.js` подхватит файл, иначе покажет emoji.
4. Бюджет: 100 персонажей × ~12 КБ ≈ 1.2 МБ, грузится лениво только для видимых карточек.
