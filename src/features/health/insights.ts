import { addDays } from '../skin/dates'
import type { Checkin } from '../skin/types'
import { WATER_GOAL, type Daily } from './types'

export interface Habit { id: string; label: string; test: (d: Map<string, Daily>) => boolean }

/** Cross-module habits to test against next-day spot changes. */
export const HABITS: Habit[] = [
  { id: 'sleep', label: '8+ hours of sleep', test: (d) => (d.get('sleep')?.value ?? 0) >= 8 },
  { id: 'water', label: `${WATER_GOAL}+ cups of water`, test: (d) => (d.get('water')?.value ?? 0) >= WATER_GOAL },
  { id: 'workout', label: 'a workout', test: (d) => d.has('workout') },
]

export interface CrossInsight { id: string; label: string; diff: number; n: number }

/** Day-to-day change in spots after a day WITH the habit vs WITHOUT. Skips habits with < 3 days on a side. */
export function crossInsights(
  checkins: Pick<Checkin, 'check_date' | 'spot_count'>[],
  daily: Daily[],
): CrossInsight[] {
  const perDay = new Map<string, Map<string, Daily>>()
  for (const r of daily) {
    if (!perDay.has(r.log_date)) perDay.set(r.log_date, new Map())
    perDay.get(r.log_date)!.set(r.kind, r)
  }
  const byDate = new Map(checkins.map((c) => [c.check_date, c]))
  const pairs: { day: Map<string, Daily>; delta: number }[] = []
  for (const c of checkins) {
    const next = byDate.get(addDays(c.check_date, 1))
    const day = perDay.get(c.check_date)
    if (next && day) pairs.push({ day, delta: next.spot_count - c.spot_count })
  }
  const avg = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length
  const out: CrossInsight[] = []
  for (const h of HABITS) {
    const w = pairs.filter((p) => h.test(p.day)).map((p) => p.delta)
    const o = pairs.filter((p) => !h.test(p.day)).map((p) => p.delta)
    if (w.length < 3 || o.length < 3) continue
    out.push({ id: h.id, label: h.label, diff: avg(w) - avg(o), n: w.length })
  }
  return out.sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff))
}

/** How many of today's 5 tasks are done. */
export function tasksDone(day: Map<string, Daily> | undefined, skinChecked: boolean) {
  const t = [
    skinChecked,
    (day?.get('water')?.value ?? 0) >= WATER_GOAL,
    day?.has('sleep') ?? false,
    day?.has('workout') ?? false,
    day?.has('mood') ?? false,
  ]
  return { done: t.filter(Boolean).length, of: t.length }
}
