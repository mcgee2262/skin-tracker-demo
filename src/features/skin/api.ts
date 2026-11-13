import { supabase, hasSupabaseEnv } from '../../lib/supabase'
import * as demo from './demo'
import seed from '../../../supabase/products.seed.json'
import type { Challenge, Checkin, Product, ProductStatus, Spot } from './types'
import { dayNumber, todayStr } from './dates'
import { isDifferinNight } from './routine'
import { clearSkinScore } from './score'

const BUCKET = 'health-photos'

/** No Supabase env → run on in-memory sample data. */
export const DEMO = !hasSupabaseEnv

export async function getChallenge(): Promise<Challenge | null> {
  if (DEMO) return demo.getChallenge()
  const { data, error } = await supabase.from('skin_challenges').select('*').order('created_at').limit(1)
  if (error) throw error
  return (data?.[0] as Challenge) ?? null
}

export async function setChallengeStart(id: string, start_date: string) {
  if (DEMO) return demo.setChallengeStart(id, start_date)
  const { error } = await supabase.from('skin_challenges').update({ start_date }).eq('id', id)
  if (error) throw error
}

export async function listCheckins(): Promise<Checkin[]> {
  if (DEMO) return demo.listCheckins()
  const { data, error } = await supabase.from('skin_checkins').select('*').order('check_date')
  if (error) throw error
  return (data ?? []) as Checkin[]
}

export async function listSpots(checkinId: string): Promise<Spot[]> {
  if (DEMO) return demo.listSpots(checkinId)
  const { data, error } = await supabase.from('skin_spots').select('x,y').eq('checkin_id', checkinId)
  if (error) throw error
  return (data ?? []).map((s) => ({ x: Number(s.x), y: Number(s.y) }))
}

export async function listSpotsForCheckins(ids: string[]): Promise<Spot[]> {
  if (DEMO) return demo.listSpotsForCheckins(ids)
  if (!ids.length) return []
  const { data, error } = await supabase.from('skin_spots').select('x,y').in('checkin_id', ids)
  if (error) throw error
  return (data ?? []).map((s) => ({ x: Number(s.x), y: Number(s.y) }))
}

export async function photoUrls(paths: string[]): Promise<Record<string, string>> {
  if (DEMO) return demo.photoUrls(paths)
  if (!paths.length) return {}
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrls(paths, 60 * 60 * 6)
  if (error) throw error
  const out: Record<string, string> = {}
  data?.forEach((d) => { if (d.path && d.signedUrl) out[d.path] = d.signedUrl })
  return out
}

async function userId(): Promise<string> {
  const { data } = await supabase.auth.getUser()
  if (!data.user) throw new Error('Not signed in')
  return data.user.id
}

async function ensureChallenge(existing: Challenge | null, date: string): Promise<Challenge> {
  if (existing) return existing
  const { data, error } = await supabase.from('skin_challenges').insert({ start_date: date }).select().single()
  if (error) throw error
  return data as Challenge
}

export interface SaveInput {
  date?: string
  spots?: Spot[]
  photo?: Blob | null
  am: boolean
  pm: boolean
  tags?: string[]
}

/** Saves (or redoes) a day's check-in. Returns the saved row with its computed score. */
export async function saveCheckin(
  challenge: Challenge | null,
  all: Checkin[],
  input: SaveInput,
): Promise<{ challenge: Challenge; checkin: Checkin }> {
  if (DEMO) return demo.saveCheckin(input)
  const date = input.date ?? todayStr()
  const ch = await ensureChallenge(challenge, date)
  const day = dayNumber(ch.start_date, date)
  const uid = await userId()
  const existing = all.find((c) => c.check_date === date)

  let photo_path = existing?.photo_path ?? null
  if (input.photo) {
    photo_path = `${uid}/skin/${date}.jpg`
    const { error } = await supabase.storage.from(BUCKET).upload(photo_path, input.photo, {
      upsert: true, contentType: 'image/jpeg',
    })
    if (error) throw error
  }

  const spot_count = input.spots ? input.spots.length : existing?.spot_count ?? all[all.length - 1]?.spot_count ?? 0

  const { data, error } = await supabase
    .from('skin_checkins')
    .upsert(
      {
        challenge_id: ch.id,
        check_date: date,
        day_number: day,
        photo_path,
        spot_count,
        am_done: input.am,
        pm_done: input.pm,
        tags: input.tags ?? existing?.tags ?? [],
        differin_night: isDifferinNight(day),
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,check_date' },
    )
    .select()
    .single()
  if (error) throw error
  let row = data as Checkin

  if (input.spots) {
    const del = await supabase.from('skin_spots').delete().eq('checkin_id', row.id)
    if (del.error) throw del.error
    if (input.spots.length) {
      const ins = await supabase.from('skin_spots').insert(
        input.spots.map((s) => ({ checkin_id: row.id, x: round4(s.x), y: round4(s.y) })),
      )
      if (ins.error) throw ins.error
    }
  }

  const merged = [...all.filter((c) => c.check_date !== date), row]
  const score = clearSkinScore(merged, date, day)
  const up = await supabase.from('skin_checkins').update({ score }).eq('id', row.id).select().single()
  if (up.error) throw up.error
  row = up.data as Checkin
  return { challenge: ch, checkin: row }
}

const round4 = (n: number) => Math.round(Math.min(1, Math.max(0, n)) * 10000) / 10000

// ---- Products ----

export async function listProducts(): Promise<Product[]> {
  if (DEMO) return demo.listProducts()
  const { data, error } = await supabase.from('skin_products').select('*').order('sort')
  if (error) throw error
  let rows = (data ?? []) as Product[]
  if (rows.length === 0) {
    const toInsert = (['mom', 'dad'] as const).flatMap((house) =>
      seed.items.map((i) => ({ ...i, house })),
    )
    const ins = await supabase.from('skin_products').insert(toInsert).select()
    if (ins.error) throw ins.error
    rows = (ins.data ?? []) as Product[]
  }
  return rows
}

export async function setProductStatus(id: string, status: ProductStatus) {
  if (DEMO) return demo.setProductStatus(id, status)
  const { error } = await supabase.from('skin_products').update({ status }).eq('id', id)
  if (error) throw error
}
