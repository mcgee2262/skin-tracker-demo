import { describe, expect, it } from 'vitest'
import { clearSkinScore, nextRank, rankFor } from './score'

const c = (check_date: string, spot_count: number, am = true, pm = true) => ({ check_date, spot_count, am_done: am, pm_done: pm })

describe('clearSkinScore', () => {
  it('is 30 on day 1 with full routine (no spot improvement yet)', () => {
    expect(clearSkinScore([c('2026-11-01', 40)], '2026-11-01', 1)).toBe(30)
  })
  it('is 0 with no routine and no improvement', () => {
    expect(clearSkinScore([c('2026-11-01', 40, false, false)], '2026-11-01', 1)).toBe(0)
  })
  it('averages the last 3 check-ins', () => {
    const list = [c('2026-11-01', 40), c('2026-11-02', 20), c('2026-11-03', 20), c('2026-11-04', 20)]
    // spotsNow=20 -> spotPart 50; routine 8/8 -> 100 ; 0.7*50+0.3*100 = 65
    expect(clearSkinScore(list, '2026-11-04', 4)).toBe(65)
  })
  it('clamps spot part at 0 when spots grow', () => {
    expect(clearSkinScore([c('2026-11-01', 10), c('2026-11-02', 50)], '2026-11-02', 2)).toBeGreaterThanOrEqual(0)
  })
  it('treats a zero baseline as 1', () => {
    expect(clearSkinScore([c('2026-11-01', 0)], '2026-11-01', 1)).toBe(100)
  })
  it('only counts routine from the last 7 days', () => {
    const list = [c('2026-11-01', 10, true, true), c('2026-11-20', 10, false, false)]
    // window 11-14..11-20: 0 steps / 14
    expect(clearSkinScore(list, '2026-11-20', 20)).toBe(0)
  })
})

describe('ranks', () => {
  it('maps scores to ranks', () => {
    expect(rankFor(0).name).toBe('Rookie')
    expect(rankFor(39).name).toBe('Rookie')
    expect(rankFor(40).name).toBe('Closer')
    expect(rankFor(70).name).toBe('Top Seller')
    expect(rankFor(90).name).toBe('Chad Salesman')
  })
  it('reports points to next rank', () => {
    expect(nextRank(35)).toEqual({ name: 'Closer', pointsAway: 5 })
    expect(nextRank(95)).toBeNull()
  })
})
