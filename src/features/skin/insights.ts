import { addDays } from './dates'
import type { Checkin } from './types'

/** Daily habits you can tag at check-in. Good habits first. */
export const TAGS = [
  { id: 'sleep', label: 'Slept 8+ hrs' },
  { id: 'water', label: 'Lots of water' },
  { id: 'workout', label: 'Worked out' },
  { id: 'sugar', label: 'Sugar' },
  { id: 'dairy', label: 'Dairy' },
  { id: 'stress', label: 'Stressed' },
] as const

export type TagId = (typeof TAGS)[number]['id']
export const tagLabel = (id: string) => TAGS.find((t) => t.id === id)?.label ?? id

export interface Insight {
  tag: string
  /** Average change in spot count the next day (negative = fewer spots). */
  withTag: number
  without: number
  /** withTag - without. Negative = tag goes with fewer spots. */
  diff: number
  n: number
}

const MIN_EACH = 3
const MIN_CHECKINS = 8

/**
 * For each tag: look at pairs of back-to-back check-in days. The "change" is tomorrow's spots minus
 * today's. Compare the average change after days WITH the tag to days WITHOUT it.
 * Needs a few samples on each side; otherwise the tag is skipped.
 */
export function whatHelps(checkins: Pick<Checkin, 'check_date' | 'spot_count' | 'tags'>[]): Insight[] {
  if (checkins.length < MIN_CHECKINS) return []
  const byDate = new Map(checkins.map((c) => [c.check_date, c]))
  const pairs: { tags: string[]; delta: number }[] = []
  for (const c of checkins) {
    const next = byDate.get(addDays(c.check_date, 1))
    if (next) pairs.push({ tags: c.tags ?? [], delta: next.spot_count - c.spot_count })
  }
  const avg = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length
  const out: Insight[] = []
  for (const t of TAGS) {
    const w = pairs.filter((p) => p.tags.includes(t.id)).map((p) => p.delta)
    const o = pairs.filter((p) => !p.tags.includes(t.id)).map((p) => p.delta)
    if (w.length < MIN_EACH || o.length < MIN_EACH) continue
    const withTag = avg(w), without = avg(o)
    out.push({ tag: t.id, withTag, without, diff: withTag - without, n: w.length })
  }
  return out.sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff))
}
