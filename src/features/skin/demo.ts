// Demo mode: in-memory sample data used when no Supabase env is configured.
import type { Challenge, Checkin, Product, ProductStatus, Spot } from './types'
import { addDays, dayNumber, todayStr } from './dates'
import { isDifferinNight } from './routine'
import { clearSkinScore } from './score'
import { TAGS } from './insights'
import seed from '../../../supabase/products.seed.json'

const DEMO_DAY = 24 // today is Day 24, not yet checked in
const MISSED = new Set([6, 15])

function rng(seed: number) {
  let s = seed >>> 0
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 2 ** 32 }
}

// One fixed pool of blackhead positions; a day with n spots shows the first n, so spots "heal" over time.
const pool: Spot[] = (() => {
  const r = rng(7)
  const zones = [
    { x: [0.45, 0.55], y: [0.47, 0.56], w: 0.35 }, // nose
    { x: [0.38, 0.62], y: [0.25, 0.34], w: 0.25 }, // forehead
    { x: [0.30, 0.40], y: [0.50, 0.62], w: 0.12 }, // left cheek
    { x: [0.60, 0.70], y: [0.50, 0.62], w: 0.12 }, // right cheek
    { x: [0.44, 0.56], y: [0.66, 0.72], w: 0.16 }, // chin
  ]
  return Array.from({ length: 50 }, () => {
    let p = r(), z = zones[0]
    for (const zz of zones) { if (p < zz.w) { z = zz; break } p -= zz.w }
    return { x: z.x[0] + r() * (z.x[1] - z.x[0]), y: z.y[0] + r() * (z.y[1] - z.y[0]) }
  })
})()

function faceSvg(spots: Spot[]): string {
  const dots = spots
    .map((s) => `<circle cx="${(s.x * 300).toFixed(1)}" cy="${(s.y * 400).toFixed(1)}" r="2.6" fill="#3b2a22" fill-opacity="0.8"/>`)
    .join('')
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 400" width="600" height="800">
<defs><radialGradient id="g" cx="50%" cy="42%" r="60%"><stop offset="0" stop-color="#f6d2b8"/><stop offset="1" stop-color="#e2ad8c"/></radialGradient>
<linearGradient id="bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#dfe6ee"/><stop offset="1" stop-color="#b9c4d1"/></linearGradient></defs>
<rect width="300" height="400" fill="url(#bg)"/>
<path d="M60 400 C70 330 110 315 150 315 C190 315 230 330 240 400Z" fill="#2f4a6d"/>
<rect x="125" y="280" width="50" height="45" fill="#e2ad8c"/>
<ellipse cx="68" cy="190" rx="14" ry="26" fill="#e2ad8c"/><ellipse cx="232" cy="190" rx="14" ry="26" fill="#e2ad8c"/>
<ellipse cx="150" cy="185" rx="85" ry="115" fill="url(#g)"/>
<path d="M65 150 C60 70 110 52 150 52 C195 52 242 70 235 150 C225 105 200 92 150 92 C105 92 78 105 65 150Z" fill="#4a3226"/>
<path d="M105 152 q15 -8 30 0" stroke="#4a3226" stroke-width="4" fill="none" stroke-linecap="round"/>
<path d="M165 152 q15 -8 30 0" stroke="#4a3226" stroke-width="4" fill="none" stroke-linecap="round"/>
<ellipse cx="120" cy="172" rx="9" ry="6" fill="#fff"/><circle cx="120" cy="172" r="4.5" fill="#3d2b20"/>
<ellipse cx="180" cy="172" rx="9" ry="6" fill="#fff"/><circle cx="180" cy="172" r="4.5" fill="#3d2b20"/>
<path d="M150 180 q-6 30 -12 38 q12 6 24 0" stroke="#c98f6f" stroke-width="3" fill="none" stroke-linecap="round"/>
<path d="M128 252 q22 14 44 0" stroke="#a5604c" stroke-width="4" fill="none" stroke-linecap="round"/>
${dots}</svg>`
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg)
}

function spotCountFor(day: number, r: () => number): number {
  const purge = day >= 6 ? 8 * Math.sin((Math.PI * (day - 6)) / 18) : 0
  return Math.max(0, Math.round(40 - 0.6 * (day - 1) + Math.max(0, purge) + (r() - 0.5) * 4))
}

// ---- in-memory store ----
const today = todayStr()
const challenge: Challenge = { id: 'demo-challenge', start_date: addDays(today, -(DEMO_DAY - 1)), length_days: 90 }
const checkins: Checkin[] = []
const spotsById: Record<string, Spot[]> = {}
const urls: Record<string, string> = {}

;(() => {
  const r = rng(42)
  const rt = rng(99)
  for (let d = 1; d < DEMO_DAY; d++) {
    const n = d === 1 ? 40 : spotCountFor(d, r)
    const am = r() < 0.85, pm = r() < 0.92
    if (MISSED.has(d)) continue
    const date = addDays(challenge.start_date, d - 1)
    const id = `demo-${d}`
    const path = `demo/${date}.jpg`
    const spots = pool.slice(0, n)
    spotsById[id] = spots
    urls[path] = faceSvg(spots)
    const row: Checkin = {
      id, challenge_id: challenge.id, check_date: date, day_number: d, photo_path: path,
      spot_count: n, am_done: am, pm_done: pm, differin_night: isDifferinNight(d), score: null,
      tags: TAGS.filter(() => rt() < 0.4).map((t) => t.id),
    }
    checkins.push(row)
    row.score = clearSkinScore(checkins, date, d)
  }
})()

let products: Product[] = (['mom', 'dad'] as const).flatMap((house) =>
  seed.items.map((i, k) => ({ ...i, id: `${house}-${k}`, house, status: i.status as ProductStatus })),
)
products = products.map((p) => (p.house === 'mom' && p.sort === 1 ? { ...p, status: 'purchased' } : p))

export const getChallenge = async () => ({ ...challenge })
export const setChallengeStart = async (_id: string, start: string) => { challenge.start_date = start }
export const listCheckins = async () => checkins.map((c) => ({ ...c })).sort((a, b) => a.check_date.localeCompare(b.check_date))
export const listSpots = async (id: string) => [...(spotsById[id] ?? [])]
export const listSpotsForCheckins = async (ids: string[]) => ids.flatMap((id) => spotsById[id] ?? [])
export const photoUrls = async (paths: string[]) => Object.fromEntries(paths.filter((p) => urls[p]).map((p) => [p, urls[p]]))
export const listProducts = async () => products.map((p) => ({ ...p }))
export const setProductStatus = async (id: string, status: ProductStatus) => {
  products = products.map((p) => (p.id === id ? { ...p, status } : p))
}

export async function saveCheckin(input: { date?: string; spots?: Spot[]; photo?: Blob | null; am: boolean; pm: boolean; tags?: string[] }) {
  const date = input.date ?? todayStr()
  const day = dayNumber(challenge.start_date, date)
  let row = checkins.find((c) => c.check_date === date)
  if (!row) {
    row = {
      id: `demo-${day}`, challenge_id: challenge.id, check_date: date, day_number: day, photo_path: null,
      spot_count: checkins[checkins.length - 1]?.spot_count ?? 0, am_done: false, pm_done: false,
      differin_night: isDifferinNight(day), score: null, tags: [],
    }
    checkins.push(row)
  }
  if (input.photo) {
    row.photo_path = `demo/${date}.jpg`
    urls[row.photo_path] = URL.createObjectURL(input.photo)
  }
  if (input.spots) { spotsById[row.id] = input.spots; row.spot_count = input.spots.length }
  row.am_done = input.am
  row.pm_done = input.pm
  if (input.tags) row.tags = input.tags
  row.score = clearSkinScore(checkins, date, day)
  return { challenge: { ...challenge }, checkin: { ...row } }
}
