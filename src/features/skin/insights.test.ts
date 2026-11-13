import { describe, expect, it } from 'vitest'
import { whatHelps } from './insights'

const day = (i: number) => `2026-11-${String(i).padStart(2, '0')}`

describe('whatHelps', () => {
  it('needs enough check-ins', () => {
    expect(whatHelps([{ check_date: day(1), spot_count: 10, tags: ['sleep'] }])).toEqual([])
  })
  it('finds a tag that goes with fewer spots next day', () => {
    // tagged days drop 2 spots, untagged days rise 1
    let n = 40
    const list = Array.from({ length: 14 }, (_, i) => {
      const tagged = i % 2 === 0
      const row = { check_date: day(i + 1), spot_count: n, tags: tagged ? ['sleep'] : [] }
      n += tagged ? -2 : 1
      return row
    })
    const r = whatHelps(list).find((x) => x.tag === 'sleep')!
    expect(r.withTag).toBe(-2)
    expect(r.without).toBe(1)
    expect(r.diff).toBe(-3)
  })
  it('skips gaps between days', () => {
    const list = Array.from({ length: 10 }, (_, i) => ({ check_date: day(i * 2 + 1), spot_count: 20, tags: ['water'] }))
    expect(whatHelps(list)).toEqual([])
  })
})
