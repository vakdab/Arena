# Arena Lab — план реалізації

## Мета

Перетворити Three.js starter на браузерний FPS-тренувальний полігон із модульним runtime-шаром. Гравець рухається WASD, дивиться мишею, стріляє по мішенях, бачить таймер, влучання, промахи й точність, а після завершення може перезапустити сесію. Перший playable build працює локально/offline; інтеграція leaderboard готується через затверджений Blueprint.

## Джерела інтеграції

- `vakdab/Arena` — референс браузерного Three.js-шутера та вже виконаний приклад спрощення `cs_office` у JSON.
- `SamJUK/CS3D` — референс WebGL viewer/base-підходу й формату моделей/текстур; у runtime буде окремий asset adapter, а не iframe-копія розширення.
- `ReagentX/decompiled-csgo-maps` — джерело VMF-описів. VMF проходить через обмежений parser/normalizer у безпечний JSON-формат блоків, без виконання entity-логіки або довіри до довільних матеріалів.

Сирі репозиторії не копіюються в гру. Треті сторони та обмеження публічного використання описані в `docs/THIRD_PARTY.md`.

## Архітектура

- `src/engine/` — фіксований loop, input, Rapier physics, renderer, audio, save та asset loading.
- `src/game/` — authoritative local simulation: player, weapon, targets, training session, scoring, scene orchestration.
- `src/integrations/` — нормалізовані типи сцени, VMF parser/normalizer, Arena-map adapter і CS3D model manifest adapter.
- `src/data/maps/` — невеликий browser-safe map preset, створений із нормалізованих блоків, а не сирий VMF.
- `src/ui/` — український title/HUD/pause/results/leaderboard шар поверх canvas.
- `server/` — встановлений Webdev leaderboard reference, міграція й API для затвердженого guest leaderboard.
- `assets/` — runtime assets, favicon і sharing metadata; generated media реєструється через Three.js asset lifecycle.

## Дизайн

### Варіанти

1. **Industrial Calibration Bay** — `0.08`: технічний тир із бетонними площинами, бурштиновими індикаторами та cyan-цілями.
2. **Night Operations Console** — `0.06`: темний нічний полігон із червоними warning-смугами та локальними прожекторами.
3. **Clean Lab Range** — `0.04`: світлий лабораторний простір із білими панелями та синіми точками наведення.

Обрано **Industrial Calibration Bay**, бо він найкраще поєднує чистий контраст Blueprint, читабельність цілей і технічний характер інтеграції карт.

- **Design movement:** industrial HUD / utilitarian sci-fi, без декоративного неону заради неону.
- **Core principles:** мішень завжди читається; симуляція відділена від косметики; кожна помилка має видимий feedback; імпортовані карти мають стабільні колізії.
- **Color philosophy:** вугільна база з concrete-grey поверхнями, amber для стану й cyan для target hit/readiness; червоний лише для помилки або небезпеки.
- **Layout paradigm:** широкий shooting lane із бічною HUD-колоною, а не центрований dashboard; сцена лишає екранний центр вільним для прицілу.
- **Signature elements:** номерні target-панелі, тонкі світлові лінії на підлозі, status-chip із session state.
- **Interaction:** старт захоплює pointer lock; стрільба працює лівим кліком або Space; Escape звільняє pointer lock і ставить гру на паузу.
- **Animation:** target pop-up/flash короткі й інформативні; без важких постефектів; recoil — малий camera kick, який вимикається Reduce motion.
- **Typography:** bundled ManusCC0 для display/body, живий текст для українського HUD.
- **Brand essence:** Arena Lab — тренажер точності для швидкої перевірки карт і WebGL-ресурсів; точний, технічний, розширюваний.
- **Brand voice:** короткі команди: «Почати сесію», «Точність», «Перезапустити».
- **Wordmark:** компактний приціл-рамка навколо `ARENA LAB`, без копіювання брендингу CS:GO.
- **Signature color:** amber `#F2B84B` як колір калібрування.

## Ігровий цикл першого checkpoint

Title → Start training → pointer-lock FPS movement → fire at 12 targets → session ends when all targets hit or timer expires → results with hit/miss/accuracy → local save and online leaderboard attempt → restart/title.

Гравець має відчувати: де він, що активне, скільки залишилось, чому постріл влучив/не влучив і що робити далі.

## Інтеграційні рішення

1. Нормалізований `SceneDefinition` містить `spawn`, `bounds`, `boxes`, `targets` та `metadata`; physics будується лише з цих простих primitives.
2. VMF parser бере `solid/side` bounds, обмежує кількість елементів, ігнорує unknown entities та ніколи не підвантажує матеріали з довільних URI.
3. `ArenaMapAdapter` конвертує відомий simplified JSON-подібний preset у `SceneDefinition`.
4. `CS3DAssetAdapter` читає manifest із model/texture URLs, нормалізує шлях і віддає loader-safe descriptors; gameplay не залежить від viewer iframe.
5. Перший build використовує локальний browser-safe preset і procedural target meshes, тому відсутність зовнішнього CDN не ламає гру.
6. Звуки та BGM — окремі assets, підключені через наявний Audio bus; помилка завантаження не блокує offline gameplay.

## Backend і leaderboard

Після approval увімкнено managed `server` і `database`. Використовується guest identity; leaderboard є casual client-reported ranking, а локальна гра продовжує працювати при недоступному API. Run ticket створюється на початку сесії, submit виконується один раз при завершенні, retry використовує той самий ticket.

## Поза першим checkpoint

Повний VMF geometry/material compiler, multiplayer-authoritative simulation, повна зброярська система, аккаунтний leaderboard і всі карти/моделі з репозиторіїв не входять у перший playable slice. Для них залишаються стабільні adapter interfaces і формат даних.
