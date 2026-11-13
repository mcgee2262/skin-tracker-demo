import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { Challenge, Checkin } from './types'
import { getChallenge, listCheckins, photoUrls, saveCheckin, type SaveInput } from './api'
import { dayNumber, todayStr } from './dates'

interface Ctx {
  loading: boolean
  error: string | null
  challenge: Challenge | null
  checkins: Checkin[]
  today: string
  dayNum: number
  todayCheckin: Checkin | undefined
  urls: Record<string, string>
  refresh: () => Promise<void>
  save: (input: SaveInput) => Promise<Checkin>
}

const SkinCtx = createContext<Ctx | null>(null)

export function SkinProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [challenge, setChallenge] = useState<Challenge | null>(null)
  const [checkins, setCheckins] = useState<Checkin[]>([])
  const [urls, setUrls] = useState<Record<string, string>>({})
  const today = todayStr()

  const refresh = useCallback(async () => {
    try {
      const [ch, list] = await Promise.all([getChallenge(), listCheckins()])
      setChallenge(ch)
      setCheckins(list)
      const paths = list.map((c) => c.photo_path).filter((p): p is string => !!p)
      setUrls(await photoUrls(paths))
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void refresh() }, [refresh])

  const save = useCallback(async (input: SaveInput) => {
    const res = await saveCheckin(challenge, checkins, input)
    await refresh()
    return res.checkin
  }, [challenge, checkins, refresh])

  const value = useMemo<Ctx>(() => ({
    loading, error, challenge, checkins, today, urls, refresh, save,
    dayNum: challenge ? dayNumber(challenge.start_date, today) : 1,
    todayCheckin: checkins.find((c) => c.check_date === today),
  }), [loading, error, challenge, checkins, today, urls, refresh, save])

  return <SkinCtx.Provider value={value}>{children}</SkinCtx.Provider>
}

export function useSkin(): Ctx {
  const v = useContext(SkinCtx)
  if (!v) throw new Error('useSkin outside SkinProvider')
  return v
}

/** Number of consecutive check-in days ending today or yesterday. */
export function streakOf(checkins: Checkin[], today: string): number {
  const days = new Set(checkins.map((c) => c.check_date))
  let d = today
  const prev = (s: string) => new Date(Date.parse(s + 'T00:00:00Z') - 86400000).toISOString().slice(0, 10)
  if (!days.has(d)) d = prev(d)
  let n = 0
  while (days.has(d)) { n++; d = prev(d) }
  return n
}
