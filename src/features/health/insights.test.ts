import { describe, expect, it } from 'vitest'
import { crossInsights, tasksDone } from './insights'
import type { Daily } from './types'

const day = (i: number) => `2026-11-${String(i).padStart(2, '0')}`

describe('crossInsights', () => {
  it('finds sleep that goes with fewer spots next day', () => {
    let n = 40
    const checkins: { check_date: string; spot_count: number }[] = []
    const daily: Daily[] = []
    for (let i = 0; i < 14; i++) {
      const good = i % 2 === 0
      checkins.push({ check_date: day(i + 1), spot_count: n })
      daily.push({ log_date: day(i + 1), kind: 'sleep', value: good ? 8.5 : 6, note: null })
      n += good ? -2 : 1
    }
    const r = crossInsights(checkins, daily).find((x) => x.id === 'sleep')!
    expect(r.diff).toBe(-3)
  })
  it('returns nothing without enough days', () => {
    expect(crossInsights([{ check_date: day(1), spot_count: 9 }], [])).toEqual([])
  })
})

describe('tasksDone', () => {
  it('counts the five daily tasks', () => {
    const m = new Map<string, Daily>([
      ['water', { log_date: day(1), kind: 'water', value: 8, note: null }],
      ['mood', { log_date: day(1), kind: 'mood', value: 4, note: null }],
    ])
    expect(tasksDone(m, true)).toEqual({ done: 3, of: 5 })
    expect(tasksDone(undefined, false)).toEqual({ done: 0, of: 5 })
  })
})
