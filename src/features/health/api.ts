import { supabase, hasSupabaseEnv } from '../../lib/supabase'
import { addDays, todayStr } from '../skin/dates'
import type { Daily, HealthKind } from './types'

const DEMO = !hasSupabaseEnv

// ---- demo (in memory) ----
const demoRows: Daily[] = (() => {
  const rows: Daily[] = []
  const today = todayStr()
  let s = 11
  const r = () => ((s = (s * 16807) % 2147483647) / 2147483647)
  for (let i = 1; i <= 24; i++) {
    const d = addDays(today, -i)
    rows.push({ log_date: d, kind: 'sleep', value: Math.round((6 + r() * 3) * 2) / 2, note: null })
    rows.push({ log_date: d, kind: 'water', value: Math.round(3 + r() * 7), note: null })
    rows.push({ log_date: d, kind: 'mood', value: 2 + Math.round(r() * 3), note: null })
    if (r() < 0.5) rows.push({ log_date: d, kind: 'workout', value: [20, 30, 45, 60][Math.floor(r() * 4)], note: 'Lift' })
  }
  return rows
})()

export async function listDaily(sinceDays = 30): Promise<Daily[]> {
  const since = addDays(todayStr(), -sinceDays)
  if (DEMO) return demoRows.filter((r) => r.log_date >= since).map((r) => ({ ...r }))
  const { data, error } = await supabase.from('health_daily').select('log_date,kind,value,note').gte('log_date', since)
  if (error) throw error
  return (data ?? []).map((r) => ({ ...r, value: Number(r.value) })) as Daily[]
}

export async function setDaily(kind: HealthKind, value: number, note: string | null = null, date = todayStr()) {
  if (DEMO) {
    const i = demoRows.findIndex((r) => r.log_date === date && r.kind === kind)
    const row = { log_date: date, kind, value, note }
    if (i >= 0) demoRows[i] = row; else demoRows.push(row)
    return
  }
  const { error } = await supabase
    .from('health_daily')
    .upsert({ log_date: date, kind, value, note }, { onConflict: 'user_id,log_date,kind' })
  if (error) throw error
}

export async function clearDaily(kind: HealthKind, date = todayStr()) {
  if (DEMO) {
    const i = demoRows.findIndex((r) => r.log_date === date && r.kind === kind)
    if (i >= 0) demoRows.splice(i, 1)
    return
  }
  const { error } = await supabase.from('health_daily').delete().eq('log_date', date).eq('kind', kind)
  if (error) throw error
}
