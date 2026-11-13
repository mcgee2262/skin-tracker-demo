import { addDays } from './dates'

export interface ScoreInput {
  check_date: string
  spot_count: number
  am_done: boolean
  pm_done: boolean
}

export const RANKS = [
  { name: 'Rookie', min: 0 },
  { name: 'Closer', min: 40 },
  { name: 'Top Seller', min: 70 },
  { name: 'Chad Salesman', min: 90 },
] as const

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n))

/**
 * @param checkins every check-in in the challenge, any order, including the one being scored
 * @param today    date of the check-in being scored (YYYY-MM-DD)
 * @param dayNumber challenge day number of `today` (1-based)
 */
export function clearSkinScore(checkins: ScoreInput[], today: string, dayNumber: number): number {
  const sorted = [...checkins].filter((c) => c.check_date <= today).sort((a, b) => a.check_date.localeCompare(b.check_date))
  if (sorted.length === 0) return 0

  const baseline = Math.max(1, sorted[0].spot_count)
  const last3 = sorted.slice(-3)
  const spotsNow = last3.reduce((s, c) => s + c.spot_count, 0) / last3.length
  const spotPart = clamp(100 * (1 - spotsNow / baseline), 0, 100)

  const windowStart = addDays(today, -6)
  const steps = sorted
    .filter((c) => c.check_date >= windowStart)
    .reduce((s, c) => s + (c.am_done ? 1 : 0) + (c.pm_done ? 1 : 0), 0)
  const denom = Math.min(7, Math.max(1, dayNumber)) * 2
  const routinePart = clamp((100 * steps) / denom, 0, 100)

  return Math.round(0.7 * spotPart + 0.3 * routinePart)
}

export function rankFor(score: number) {
  let idx = 0
  RANKS.forEach((r, i) => { if (score >= r.min) idx = i })
  return { index: idx, name: RANKS[idx].name }
}

/** Next rank and points needed, or null at the top rank. */
export function nextRank(score: number): { name: string; pointsAway: number } | null {
  const { index } = rankFor(score)
  const next = RANKS[index + 1]
  return next ? { name: next.name, pointsAway: next.min - score } : null
}
