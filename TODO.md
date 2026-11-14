# Arena Lab TODO

## Нормалізований інтеграційний шар для Arena, CS3D і VMF-карт

- [ ] Створити `SceneDefinition`/`MapBlock`/`TargetDefinition` типи та адаптери.
- [ ] Додати browser-safe VMF parser/normalizer, який обмежує bounds, ігнорує невідомі entity/material URI та не виконує код із VMF.
- [ ] Додати Arena JSON adapter і локальний shooting-range preset із метаданими джерела.
- [ ] Додати CS3D asset manifest adapter із нормалізованим loader-safe шляхом і source notes.
- [ ] Додати `docs/THIRD_PARTY.md` із посиланнями на три репозиторії, attribution і застереженням щодо ліцензій/прав Valve.

## FPS тренувальний полігон

- [ ] Замінити sky-islands gameplay на indoor first-person training loop: WASD, mouse look, pointer lock, firing, target hit detection, miss counting, accuracy, timer and restart.
- [ ] Зберегти fixed-step loop, Rapier collision helpers, existing Tweak manager, local save, pause/restart flow і browser-safe fallback.
- [ ] Додати 12 інтерактивних мішеней із readable hit/miss feedback та процедурний low-risk weapon view model.
- [ ] Перекласти весь player-facing UI та тексти гри українською, залишивши language fallback валідним для starter test.
- [ ] Додати online leaderboard client/server integration із guest identity, immutable board id/rules version, offline fallback і retry без дублювання run.

## Візуальна та аудіо подача

- [ ] Оформити Industrial Calibration Bay: concrete panels, amber calibration strips, cyan targets, dark readable HUD.
- [ ] Підключити generated SFX/BGM через existing Audio routing, зберігаючи silent fallback і gesture unlock.
- [ ] Підготувати game-specific favicon і `game-sharing.json`, потім виконати sharing preparation перед першим checkpoint.

## Перевірка та delivery

- [ ] Налаштувати TypeScript diagnostics через host-managed Webdev registration.
- [ ] Прогнати typecheck, unit tests, build і smoke з перевіркою title, gameplay, firing, pause, results, Ukrainian text та offline fallback.
- [ ] Перевірити `manus-routes.json`, build output і loader-safe asset paths.
- [ ] Зробити clean checkpoint через runtime save script, push exact SHA на `origin/main` і підтвердити recorded checkpoint.
- [ ] Не заявляти online leaderboard acceptance до перевірки API/DB у збереженому Preview checkpoint; локальна гра має бути прийнятною незалежно від цього.
