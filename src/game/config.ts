/** Central gameplay tuning for the calibration range. Tweak can mutate CONFIG in development. */
export const DEFAULT_CONFIG = {
  run: {
    seconds: 90,
    totalTargets: 12,
    maxScore: 1200,
  },
  player: {
    radius: 0.38,
    halfHeight: 0.52,
    eyeHeight: 1.62,
    walkSpeed: 5.8,
    sprintSpeed: 8.5,
    acceleration: 42,
    gravity: -28,
    maxFall: -35,
    airControl: 0.55,
  },
  camera: {
    fov: 76,
    minPitch: -1.25,
    maxPitch: 1.15,
    lookSpeed: 0.0022,
  },
  weapon: {
    cooldown: 0.16,
    recoil: 0.045,
  },
  score: {
    hit: 100,
    miss: 10,
  },
} as const

type MutableConfig<T> = { -readonly [K in keyof T]: T[K] extends number ? number : T[K] extends object ? MutableConfig<T[K]> : T[K] }
export const CONFIG: MutableConfig<typeof DEFAULT_CONFIG> = structuredClone(DEFAULT_CONFIG)
