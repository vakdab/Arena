import { describe, expect, it } from 'vitest'
import { createRun, formatAccuracy, formatClock, recordShot, tick } from '../src/game/rules'
import { insertScore, parseSave } from '../src/engine/save'

describe('calibration range rules', () => {
  it('tracks hits, misses, score and accuracy', () => {
    let run = createRun(2)
    run = recordShot(run, true)
    run = recordShot(run, false)
    expect(run.hits).toBe(1)
    expect(run.misses).toBe(1)
    expect(run.accuracy).toBe(50)
    expect(run.score).toBe(90)
    expect(run.remaining).toBe(1)
  })
  it('wins after all targets are hit and freezes afterward', () => {
    const won = recordShot(recordShot(createRun(2), true), true)
    expect(won.phase).toBe('won')
    expect(recordShot(won, false)).toEqual(won)
  })
  it('loses when the timer reaches zero', () => {
    const lost = tick(createRun(1), 90)
    expect(lost.phase).toBe('lost')
    expect(lost.timeLeft).toBe(0)
  })
  it('formats HUD values', () => {
    expect(formatClock(89.2)).toBe('1:30')
    expect(formatAccuracy(66.6)).toBe('67%')
  })
})

describe('local persistence', () => {
  it('rejects malformed saves and orders leaderboard entries', () => {
    expect(parseSave('{bad').locale).toBe('uk')
    const result = insertScore([], { name: 'A', score: 900, seconds: 20, at: 1 })
    expect(result.rank).toBe(0)
    expect(result.board[0].score).toBe(900)
  })
})
