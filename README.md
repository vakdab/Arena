# Arena Lab / Arena Strike

This branch integrates the Arena Strike browser shooter with the modular Arena Lab Three.js FPS training-range foundation.

## Arena Strike lineage

The original Arena project provides a browser 3D shooter, Arena and CS Office maps, weapon models, and references to `ReagentX/decompiled-csgo-maps` and `SamJUK/CS3D`. Original maps and models may be subject to Valve Corporation rights; review `docs/RESEARCH_SOURCES.md` before redistribution.

## Arena Lab foundation

Arena Lab adds a Ukrainian-language training range with first-person camera, WASD movement, pointer-lock mouse look, firing, 12 targets, hit/miss tracking, accuracy, a session timer, results/restart flow, local persistence, and an offline-friendly leaderboard client. The runtime is organized into engine, game, UI, normalized scene adapters, and data layers so future multiplayer can be added without copying raw repository formats.

The integration adapters cover a conservative VMF-to-normalized scene path, Arena simplified JSON scenes, and loader-safe CS3D/Arena asset descriptors. The first playable map is the local procedural `calibration-range`.

## Development

```bash
pnpm install
pnpm dev
pnpm typecheck
pnpm test
pnpm build
pnpm smoke
```

The game UI is Ukrainian. Keyboard controls are WASD, mouse look, and left click or Space to fire; touch devices use the on-screen stick, drag look, and fire button.
