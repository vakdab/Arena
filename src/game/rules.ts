import { CONFIG } from './config'

export type RunPhase = 'playing' | 'won' | 'lost'
export type LoseReason = 'time'

export type RunState = {
  unranked: boolean
  phase: RunPhase
  loseReason?: LoseReason
  score: number
  shots: number
  hits: number
  misses: number
  accuracy: number
  timeLeft: number
  elapsed: number
  totalTargets: number
  remaining: number
}

export function createRun(totalTargets = CONFIG.run.totalTargets): RunState {
  return { unranked: false, phase: 'playing', score: 0, shots: 0, hits: 0, misses: 0, accuracy: 0, timeLeft: CONFIG.run.seconds, elapsed: 0, totalTargets, remaining: totalTargets }
}

export function recordShot(state: RunState, hit: boolean): RunState {
  if (state.phase !== 'playing') return state
  const shots = state.shots + 1
  const hits = state.hits + (hit ? 1 : 0)
  const misses = state.misses + (hit ? 0 : 1)
  const remaining = Math.max(0, state.totalTargets - hits)
  const score = Math.max(0, hits * CONFIG.score.hit - misses * CONFIG.score.miss)
  return { ...state, shots, hits, misses, score, remaining, accuracy: shots ? (hits / shots) * 100 : 0, phase: remaining === 0 ? 'won' : state.phase }
}

export function tick(state: RunState, dt: number): RunState {
  if (state.phase !== 'playing') return state
  const elapsed = state.elapsed + dt
  const timeLeft = Math.max(0, state.timeLeft - dt)
  if (timeLeft <= 0) return { ...state, elapsed, timeLeft, phase: 'lost', loseReason: 'time' }
  return { ...state, elapsed, timeLeft }
}

export function formatClock(seconds: number): string {
  const whole = Math.max(0, Math.ceil(seconds))
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, '0')}`
}

export function formatAccuracy(value: number): string {
  return `${Math.round(value)}%`
}
