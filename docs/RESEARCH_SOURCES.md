# Інтеграційні джерела Arena Lab

Цей файл зберігає зовнішні факти, використані для архітектури.

- [Arena](https://github.com/vakdab/Arena) — браузерний 3D-шутер на Three.js. README описує процедурну карту та `maps/office.json`, який є спрощеною геометрією `cs_office`, а також JSON-моделі ножів із CS3D v1.0.0.
- [CS3D](https://github.com/SamJUK/CS3D) — WebGL 3D model viewer/base API для моделей і текстур CS:GO; репозиторій має `base/`, `viewer/`, `examples/` і скрипти експорту/декомпіляції.
- [decompiled-csgo-maps](https://github.com/ReagentX/decompiled-csgo-maps) — офіційні CS:GO карти, декомпільовані у `.vmf` станом на 2018-10-20; README посилається на BSPSource.
- [Three.js](https://threejs.org/) — runtime бібліотека, на якій працює стартовий браузерний engine.

Важливе обмеження: README Arena прямо попереджає, що оригінальні карти та моделі належать Valve Corporation, а три GitHub-репозиторії не мають ліцензії. Тому Arena Lab інтегрує формати й адаптери, не копіює сирий контент у публічний build і не заявляє права на Valve assets. Публічне використання конкретних моделей/матеріалів потребує окремої юридичної перевірки.
