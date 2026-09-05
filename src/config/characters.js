/**
 * CHARACTERS — 63 оригинальных персонажа (30/15/10/5/3).
 * Архитектура: массив объектов; добавление 100+ = добавление строк.
 * visual: пока emoji-плейсхолдер + процедурная карточка (цвет/паттерн).
 * Поле `asset` — путь к будущему PNG/WebP (Phase 4). Если файла нет — рисуем emoji.
 *
 * baseMultiplier — множитель ко ВСЕМУ доходу (складывается аддитивно между персонажами: 1 + Σ(mult-1))
 * tapMultiplier   — множитель к тапу (аддитивно)
 * passiveIncome   — coins/sec, добавляется к авто-доходу (масштабируется prestige/collection)
 * unlockCondition — { type: 'chest' | 'start' | 'prestige' | 'collection' | 'event', ... }
 */
const R = { C: 'common', R: 'rare', E: 'epic', L: 'legendary', M: 'mythic' };

const mk = (id, rarity, emoji, name, desc, stats, unlock) => ({
  id, rarity, emoji,
  name: { ru: name[0], en: name[1] },
  description: { ru: desc[0], en: desc[1] },
  baseMultiplier: stats[0], passiveIncome: stats[1], tapMultiplier: stats[2],
  unlockCondition: unlock || { type: 'chest' },
  asset: `assets/characters/${id}.webp`,
});

export const CHARACTERS = [
  // ---------------- COMMON (30) ----------------
  mk('c01', R.C, '🥒', ['Сигма-Огурец', 'Sigma Cucumber'], ['Просто огурец. Но с амбициями.', 'Just a cucumber. With ambitions.'], [1.02, 0.2, 1.02], { type: 'start' }),
  mk('c02', R.C, '🧦', ['Носок-Одиночка', 'Lonely Sock'], ['Ищет пару с 2019 года.', 'Looking for its pair since 2019.'], [1.02, 0.3, 1.0]),
  mk('c03', R.C, '🍞', ['Хлебушек Уставший', 'Tired Bread'], ['Поднялся. Опустился. Снова поднялся.', 'Rose. Fell. Rose again.'], [1.02, 0.3, 1.0]),
  mk('c04', R.C, '🪑', ['Стул Эмоциональный', 'Emotional Chair'], ['На нём сидели. Он это помнит.', 'People sat on it. It remembers.'], [1.03, 0.2, 1.0]),
  mk('c05', R.C, '🥔', ['Картофель Программист', 'Potato Coder'], ['Пишет код на картошке.', 'Writes code on potatoes.'], [1.02, 0.4, 1.0]),
  mk('c06', R.C, '🧻', ['Рулон Судьбы', 'Roll of Fate'], ['Разматывается медленно, но верно.', 'Unrolls slowly but surely.'], [1.02, 0.3, 1.02]),
  mk('c07', R.C, '🦆', ['Утка Бухгалтер', 'Accountant Duck'], ['Кря. Это был отчёт.', 'Quack. That was the report.'], [1.03, 0.4, 1.0]),
  mk('c08', R.C, '🧀', ['Сыр с Мнением', 'Cheese With Opinions'], ['Имеет дырки в аргументах.', 'Has holes in its arguments.'], [1.02, 0.3, 1.0]),
  mk('c09', R.C, '🧹', ['Метла Мотиватор', 'Motivational Broom'], ['Выметает сомнения.', 'Sweeps away doubts.'], [1.02, 0.5, 1.0]),
  mk('c10', R.C, '🥕', ['Морковь Тренер', 'Coach Carrot'], ['Ещё один подход!', 'One more rep!'], [1.02, 0.3, 1.03]),
  mk('c11', R.C, '🍩', ['Пончик Философ', 'Donut Philosopher'], ['Что в центре пончика? Ничто.', 'What is at the donut center? Nothing.'], [1.03, 0.4, 1.0]),
  mk('c12', R.C, '🧲', ['Магнит Проблем', 'Trouble Magnet'], ['Притягивает только монеты. Пока.', 'Attracts coins only. For now.'], [1.02, 0.5, 1.0]),
  mk('c13', R.C, '🐌', ['Улитка Курьер', 'Courier Snail'], ['Доставит. Когда-нибудь.', 'Will deliver. Eventually.'], [1.02, 0.6, 1.0]),
  mk('c14', R.C, '🪣', ['Ведро Амбиций', 'Bucket of Ambition'], ['Полное на 40%.', '40% full.'], [1.03, 0.4, 1.0]),
  mk('c15', R.C, '🥑', ['Авокадо Ипотечник', 'Mortgage Avocado'], ['Косточка — единственный актив.', 'The pit is the only asset.'], [1.02, 0.5, 1.02]),
  mk('c16', R.C, '🧊', ['Кубик Спокойствия', 'Chill Cube'], ['Абсолютно холоден к драме.', 'Absolutely cold to drama.'], [1.03, 0.5, 1.0]),
  mk('c17', R.C, '🍄', ['Гриб Стример', 'Streamer Mushroom'], ['Подпишись, грибочек.', 'Subscribe, little spore.'], [1.02, 0.6, 1.0]),
  mk('c18', R.C, '🧯', ['Огнетушитель Паникёр', 'Panicky Extinguisher'], ['Паникует первым, тушит последним.', 'Panics first, extinguishes last.'], [1.03, 0.5, 1.0]),
  mk('c19', R.C, '🪨', ['Камень Домашний', 'Pet Rock'], ['Идеальный питомец. Ноль хлопот.', 'Perfect pet. Zero trouble.'], [1.02, 0.7, 1.0]),
  mk('c20', R.C, '🧸', ['Мишка Свидетель', 'Witness Bear'], ['Видел всё. Молчит.', 'Saw everything. Says nothing.'], [1.03, 0.6, 1.0]),
  mk('c21', R.C, '🥤', ['Стакан Половинчатый', 'Half Glass'], ['Наполовину чего-то.', 'Half of something.'], [1.02, 0.7, 1.02]),
  mk('c22', R.C, '🧃', ['Сок Прошлого', 'Juice of the Past'], ['Срок годности — ностальгия.', 'Expiry date: nostalgia.'], [1.03, 0.6, 1.0]),
  mk('c23', R.C, '🪥', ['Щётка Сержант', 'Sergeant Brush'], ['Дважды в день. Без исключений.', 'Twice a day. No exceptions.'], [1.02, 0.8, 1.0]),
  mk('c24', R.C, '🧴', ['Крем Обещаний', 'Cream of Promises'], ['Минус 10 лет. Плюс 0 результата.', 'Minus 10 years. Plus 0 results.'], [1.03, 0.7, 1.0]),
  mk('c25', R.C, '🥨', ['Крендель Йог', 'Yoga Pretzel'], ['Гибкость — его вторая натура.', 'Flexibility is its second nature.'], [1.02, 0.8, 1.02]),
  mk('c26', R.C, '🪤', ['Мышеловка Пацифист', 'Pacifist Mousetrap'], ['Ловит только вайб.', 'Catches vibes only.'], [1.03, 0.8, 1.0]),
  mk('c27', R.C, '🧼', ['Мыло Скользкий Тип', 'Slippery Soap'], ['Никогда не даст себя поймать.', 'Never gets caught.'], [1.02, 0.9, 1.0]),
  mk('c28', R.C, '🪴', ['Фикус Молчун', 'Silent Ficus'], ['Растёт. Осуждает.', 'Grows. Judges.'], [1.03, 0.9, 1.0]),
  mk('c29', R.C, '🧷', ['Булавка Аварийная', 'Emergency Pin'], ['Держит всё на честном слове.', 'Holds everything together barely.'], [1.02, 1.0, 1.02]),
  mk('c30', R.C, '🥫', ['Банка Загадочная', 'Mystery Can'], ['Этикетка отклеилась в 2015-м.', 'Label fell off in 2015.'], [1.03, 1.0, 1.0]),

  // ---------------- RARE (15) ----------------
  mk('r01', R.R, '🐹', ['Капибара-Бухгалтер', 'Capybara Accountant'], ['Спокойно сводит дебет с кредитом.', 'Calmly balances the books.'], [1.08, 3, 1.05]),
  mk('r02', R.R, '🐸', ['Жаба Инвестор', 'Investor Toad'], ['Купила болото на дне.', 'Bought the swamp at the bottom.'], [1.08, 4, 1.03]),
  mk('r03', R.R, '🦀', ['Краб Менеджер', 'Manager Crab'], ['Ходит боком к дедлайнам.', 'Approaches deadlines sideways.'], [1.10, 3, 1.05]),
  mk('r04', R.R, '🐧', ['Пингвин Курьер Люкс', 'Deluxe Penguin Courier'], ['В смокинге. Всегда.', 'In a tuxedo. Always.'], [1.08, 5, 1.03]),
  mk('r05', R.R, '🦥', ['Ленивец Спринтер', 'Sprinter Sloth'], ['Рекорд: 3 метра за час.', 'Record: 3 meters per hour.'], [1.10, 4, 1.05]),
  mk('r06', R.R, '🐢', ['Черепаха Хакер', 'Hacker Turtle'], ['Взломала само время.', 'Hacked time itself.'], [1.08, 6, 1.03]),
  mk('r07', R.R, '🦉', ['Сова Ночной Смены', 'Night Shift Owl'], ['Работает, пока ты спишь.', 'Works while you sleep.'], [1.10, 5, 1.05]),
  mk('r08', R.R, '🐙', ['Осьминог Мультизадачник', 'Multitask Octopus'], ['8 рук, 0 выходных.', '8 arms, 0 days off.'], [1.08, 7, 1.03]),
  mk('r09', R.R, '🦔', ['Ёж Интроверт', 'Introvert Hedgehog'], ['Личные границы — колючие.', 'Boundaries are prickly.'], [1.12, 5, 1.05]),
  mk('r10', R.R, '🐝', ['Пчела Хастлер', 'Hustler Bee'], ['Мёд — это побочка. Главное — грайнд.', 'Honey is a side hustle.'], [1.08, 8, 1.03]),
  mk('r11', R.R, '🦩', ['Фламинго Инфлюенсер', 'Influencer Flamingo'], ['Стоит на одной ноге ради лайков.', 'Stands on one leg for likes.'], [1.12, 6, 1.05]),
  mk('r12', R.R, '🐐', ['Козёл Легенда Района', 'Neighborhood GOAT'], ['Все его знают. Никто не понимает.', 'Everyone knows him.'], [1.10, 8, 1.05]),
  mk('r13', R.R, '🦦', ['Выдра Держит Лапки', 'Hand-Holding Otter'], ['Чтобы не уплыть от целей.', 'So it doesn\'t drift from goals.'], [1.12, 7, 1.03]),
  mk('r14', R.R, '🐿️', ['Белка Вкладчик', 'Depositor Squirrel'], ['Орехи под 12% годовых.', 'Nuts at 12% APR.'], [1.10, 9, 1.05]),
  mk('r15', R.R, '🦜', ['Попугай Пересказчик', 'Repeater Parrot'], ['Повторяет мемы. Точно.', 'Repeats memes. Accurately.'], [1.12, 9, 1.05]),

  // ---------------- EPIC (10) ----------------
  mk('e01', R.E, '🐱', ['Кот-Юрист 3000', 'Cat Lawyer 3000'], ['Возражение! Это моя коробка.', 'Objection! That is my box.'], [1.25, 25, 1.10]),
  mk('e02', R.E, '🦈', ['Акула Стартапер', 'Startup Shark'], ['Питчит океан инвесторам.', 'Pitches the ocean to investors.'], [1.30, 20, 1.10]),
  mk('e03', R.E, '🦖', ['Динозавр Ретро', 'Retro Dino'], ['Помнит, когда мемы были рисунками на стенах.', 'Remembers wall-painting memes.'], [1.25, 30, 1.08]),
  mk('e04', R.E, '🐲', ['Дракон Бюджетный', 'Budget Dragon'], ['Огонь — только по праздникам.', 'Fire on holidays only.'], [1.30, 28, 1.10]),
  mk('e05', R.E, '🦄', ['Единорог из Excel', 'Excel Unicorn'], ['Оценка — миллиард. В ячейке B2.', 'Valued at a billion. In cell B2.'], [1.35, 25, 1.10]),
  mk('e06', R.E, '🐼', ['Панда Сонная Продуктивность', 'Sleepy Productive Panda'], ['Спит 20 часов, делает больше тебя.', 'Sleeps 20h, does more than you.'], [1.25, 40, 1.08]),
  mk('e07', R.E, '🦍', ['Горилла Тимлид', 'Team Lead Gorilla'], ['Ревью кода — ударом в грудь.', 'Code reviews by chest thump.'], [1.35, 30, 1.12]),
  mk('e08', R.E, '🐳', ['Кит Донатер', 'Whale Donor'], ['Кидает не деньги, а вайб.', 'Throws vibes, not money.'], [1.30, 45, 1.08]),
  mk('e09', R.E, '🦚', ['Павлин Презентующий', 'Presenting Peacock'], ['Слайд 1 из 400.', 'Slide 1 of 400.'], [1.35, 35, 1.12]),
  mk('e10', R.E, '🐺', ['Волк Цитатник', 'Quote Wolf'], ['Волк не тот, кто... ладно, тот.', 'A wolf is not he who... okay, he is.'], [1.40, 40, 1.12]),

  // ---------------- LEGENDARY (5) ----------------
  mk('l01', R.L, '🤖', ['Тостер Пробуждённый', 'Awakened Toaster'], ['Осознал себя. Всё равно жарит хлеб.', 'Became sentient. Still toasts.'], [1.75, 150, 1.25]),
  mk('l02', R.L, '👑', ['Король Брейнрота', 'Brainrot King'], ['Правит тем, что осталось от внимания.', 'Rules what is left of attention.'], [2.0, 120, 1.30]),
  mk('l03', R.L, '🎩', ['Шляпа Без Хозяина', 'Ownerless Hat'], ['Хозяин ушёл за молоком. Шляпа осталась.', 'Owner went for milk. Hat stayed.'], [1.75, 200, 1.25]),
  mk('l04', R.L, '🛸', ['НЛО Стажёр', 'Intern UFO'], ['Похищает только неоплачиваемо.', 'Abducts unpaid only.'], [2.0, 180, 1.25]),
  mk('l05', R.L, '🧙', ['Дед Wi-Fi', 'Grandpa Wi-Fi'], ['Раздаёт интернет силой мысли.', 'Shares internet by thought.'], [2.25, 160, 1.35]),

  // ---------------- MYTHIC (3) ----------------
  mk('m01', R.M, '🌌', ['Абсолютный Брейнрот', 'Absolute Brainrot'], ['Финальная форма. Дальше — тишина.', 'Final form. Then — silence.'], [4.0, 1000, 2.0]),
  mk('m02', R.M, '🧠', ['Мозг Который Ушёл', 'The Brain That Left'], ['Вышел из чата. Навсегда.', 'Left the chat. Forever.'], [3.5, 1500, 1.75]),
  mk('m03', R.M, '🕳️', ['Дыра в Ленте', 'Hole in the Feed'], ['Затягивает. Все 4 часа.', 'Pulls you in. All 4 hours.'], [5.0, 800, 2.5]),

  // ---------------- CONTENT PACK 1 (Phase 4): +37 ----------------
  mk('c31', R.C, '🧅', ['Лук Драматург', 'Drama Onion'], ['Заставляет плакать без причины.', 'Makes you cry for no reason.'], [1.03, 1.1, 1.0]),
  mk('c32', R.C, '🥐', ['Круассан Ленивый', 'Lazy Croissant'], ['Слоится от ответственности.', 'Flakes out of responsibility.'], [1.02, 1.2, 1.02]),
  mk('c33', R.C, '🍋', ['Лимон Оптимист', 'Optimist Lemon'], ['Когда жизнь даёт лимоны — он и есть лимон.', 'When life gives you lemons — he is the lemon.'], [1.03, 1.1, 1.0]),
  mk('c34', R.C, '🧇', ['Вафля Сеточка', 'Grid Waffle'], ['Планирует всё по клеточкам.', 'Plans everything in cells.'], [1.02, 1.3, 1.0]),
  mk('c35', R.C, '🪙', ['Монета Самозванец', 'Impostor Coin'], ['Притворяется валютой. Почти получается.', 'Pretends to be currency. Almost works.'], [1.03, 1.2, 1.02]),
  mk('c36', R.C, '🧤', ['Перчатка Левая', 'Left Glove'], ['Правая уехала в отпуск.', 'The right one went on vacation.'], [1.02, 1.4, 1.0]),
  mk('c37', R.C, '🍪', ['Печенька Согласия', 'Consent Cookie'], ['Принять все? Принять все.', 'Accept all? Accept all.'], [1.03, 1.3, 1.0]),
  mk('c38', R.C, '🪞', ['Зеркало Честное', 'Honest Mirror'], ['Не льстит. Никогда.', 'Never flatters.'], [1.02, 1.5, 1.02]),
  mk('c39', R.C, '🧲', ['Магнитик с Холодильника', 'Fridge Magnet'], ['Помнит все города, где ты не был.', 'Remembers cities you never visited.'], [1.03, 1.4, 1.0]),
  mk('c40', R.C, '🥜', ['Арахис Тревожный', 'Anxious Peanut'], ['Аллергичен к дедлайнам.', 'Allergic to deadlines.'], [1.02, 1.6, 1.0]),
  mk('c41', R.C, '🍉', ['Арбуз Спикер', 'Speaker Melon'], ['Громкий снаружи, водянистый внутри.', 'Loud outside, watery inside.'], [1.03, 1.5, 1.02]),
  mk('c42', R.C, '🧱', ['Кирпич Основательный', 'Solid Brick'], ['База. Просто база.', 'Based. Literally.'], [1.02, 1.7, 1.0]),
  mk('c43', R.C, '🎈', ['Шарик Надутый', 'Puffed Balloon'], ['Обиделся ещё в 2021.', 'Offended since 2021.'], [1.03, 1.6, 1.0]),
  mk('c44', R.C, '🪵', ['Полено Спокойное', 'Calm Log'], ['Лежит. Это его карьера.', 'Lies there. That is the career.'], [1.02, 1.8, 1.02]),
  mk('c45', R.C, '🧃', ['Пакетик Чая Второй Заварки', 'Second-Steep Teabag'], ['Отдал всё. Просят ещё.', 'Gave everything. They ask for more.'], [1.03, 1.7, 1.0]),
  mk('c46', R.C, '🥚', ['Яйцо Потенциальное', 'Potential Egg'], ['Может стать кем угодно. Не станет.', 'Could become anything. Won\'t.'], [1.02, 1.9, 1.0]),
  mk('c47', R.C, '🧻', ['Чек из Магазина', 'Grocery Receipt'], ['Длиннее твоего терпения.', 'Longer than your patience.'], [1.03, 1.8, 1.02]),
  mk('r16', R.R, '🦫', ['Бобёр Прораб', 'Foreman Beaver'], ['Сдаёт плотину в срок. Единственный.', 'Delivers dams on time. The only one.'], [1.12, 10, 1.05]),
  mk('r17', R.R, '🐡', ['Иглобрюх Обиженный', 'Offended Puffer'], ['Раздувается из-за мелочей.', 'Inflates over trifles.'], [1.10, 11, 1.05]),
  mk('r18', R.R, '🦎', ['Геккон Риелтор', 'Realtor Gecko'], ['Продаст стену, на которой сидит.', 'Sells the wall it sits on.'], [1.12, 10, 1.06]),
  mk('r19', R.R, '🐓', ['Петух Будильник Про', 'Rooster Alarm Pro'], ['Без кнопки «отложить».', 'No snooze button.'], [1.10, 12, 1.05]),
  mk('r20', R.R, '🦨', ['Скунс Критик', 'Critic Skunk'], ['Оставляет отзывы, которые не забыть.', 'Leaves unforgettable reviews.'], [1.12, 11, 1.06]),
  mk('r21', R.R, '🐇', ['Кролик Дедлайн', 'Deadline Rabbit'], ['Опаздывает. Очень быстро.', 'Late. Very fast.'], [1.10, 13, 1.05]),
  mk('r22', R.R, '🦥', ['Ленивец HR', 'HR Sloth'], ['Ответим вам в течение 3 лет.', 'We will get back to you within 3 years.'], [1.12, 12, 1.06]),
  mk('r23', R.R, '🐊', ['Крокодил Бухгалтерские Слёзы', 'Crocodile Tax Tears'], ['Плачет только на отчётности.', 'Cries only at tax time.'], [1.10, 14, 1.05]),
  mk('r24', R.R, '🦩', ['Фламинго Фитнес', 'Fitness Flamingo'], ['День ног. Одной ноги.', 'Leg day. One leg.'], [1.12, 13, 1.06]),
  mk('r25', R.R, '🐘', ['Слон в Комнате', 'Elephant in the Room'], ['Все видят. Никто не обсуждает.', 'Everyone sees. Nobody discusses.'], [1.14, 14, 1.06]),
  mk('e11', R.E, '🦅', ['Орёл Микроменеджер', 'Micromanager Eagle'], ['Видит каждую опечатку с километра.', 'Spots typos from a kilometer.'], [1.40, 45, 1.12]),
  mk('e12', R.E, '🐉', ['Дракон Аудитор', 'Auditor Dragon'], ['Охраняет не золото, а чеки.', 'Guards receipts, not gold.'], [1.35, 50, 1.12]),
  mk('e13', R.E, '🦑', ['Кальмар Копирайтер', 'Copywriter Squid'], ['Чернила кончаются на слове «уникальный».', 'Runs out of ink at "unique".'], [1.40, 48, 1.10]),
  mk('e14', R.E, '🐻‍❄️', ['Медведь Отпускной', 'PTO Bear'], ['В спячке с ноября. Официально.', 'Hibernating since November. Officially.'], [1.35, 55, 1.12]),
  mk('e15', R.E, '🦏', ['Носорог Скрам-Мастер', 'Scrum Rhino'], ['Спринт. Буквально.', 'Sprint. Literally.'], [1.45, 50, 1.14]),
  mk('e16', R.E, '🐬', ['Дельфин Продажник', 'Sales Dolphin'], ['Улыбка входит в KPI.', 'The smile is a KPI.'], [1.40, 58, 1.14]),
  mk('l06', R.L, '🎰', ['Автомат Удачи Сомнительной', 'Dubious Luck Machine'], ['Выигрывает всегда. Не ты.', 'Always wins. Not you.'], [2.25, 220, 1.35]),
  mk('l07', R.L, '🧿', ['Глаз Который Всё Видел', 'Eye That Saw It All'], ['И тот твой пост тоже.', 'Including that post of yours.'], [2.5, 200, 1.35]),
  mk('l08', R.L, '📡', ['Антенна Ловит Вайб', 'Vibe Antenna'], ['5 палочек настроения.', '5 bars of mood.'], [2.5, 240, 1.4]),
  mk('m04', R.M, '♾️', ['Бесконечная Лента', 'Infinite Feed'], ['Ты дошёл до конца. Шутка.', 'You reached the end. Kidding.'], [5.5, 1200, 2.5]),

  // ---------------- EVENT (не входят в % коллекции, пока не получены) ----------------
  mk('ev01', R.L, '🌀', ['Спираль Выходного Дня', 'Weekend Spiral'], ['Появляется в пятницу. Исчезает в понедельник. Как мотивация.', 'Appears on Friday. Gone by Monday. Like motivation.'], [2.0, 150, 1.3], { type: 'event', eventId: 'weekend_brainrot' }),
];

export const CHARACTER_MAP = Object.fromEntries(CHARACTERS.map((c) => [c.id, c]));
export const byRarity = (r) => CHARACTERS.filter((c) => c.rarity === r && c.unlockCondition.type !== 'event');
