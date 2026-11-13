import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Droplets, Dumbbell, Flame, Frown, Laugh, Meh, Moon, Smile, Sparkles, X, Angry, type LucideIcon } from 'lucide-react'
import { useSkin, streakOf } from '../skin/SkinContext'
import { addDays, hourNY, prettyDate } from '../skin/dates'
import { clearDaily, listDaily, setDaily } from './api'
import { crossInsights, tasksDone } from './insights'
import { MOODS, WATER_GOAL, WORKOUT_TYPES, type Daily, type HealthKind } from './types'

const MOOD_ICONS: LucideIcon[] = [Angry, Frown, Meh, Smile, Laugh]

function Ring({ done, of }: { done: number; of: number }) {
  const size = 96, stroke = 11, r = (size - stroke) / 2, c = 2 * Math.PI * r
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--separator)" strokeWidth={stroke} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--blue)" strokeWidth={stroke} strokeLinecap="round"
        strokeDasharray={`${c * (done / of)} ${c}`} transform={`rotate(-90 ${size / 2} ${size / 2})`} />
      <text x="50%" y="50%" textAnchor="middle" dominantBaseline="central" fontSize="28" fontWeight="700" fill="var(--text)">{done}/{of}</text>
    </svg>
  )
}

export default function Home() {
  const { checkins, today, dayNum, todayCheckin } = useSkin()
  const [daily, setDailyRows] = useState<Daily[]>([])
  const [sheet, setSheet] = useState(false)
  const [err, setErr] = useState('')

  const load = useCallback(async () => {
    try { setDailyRows(await listDaily(30)) } catch (e) { setErr(e instanceof Error ? e.message : 'Could not load') }
  }, [])
  useEffect(() => { void load() }, [load])

  const perDay = useMemo(() => {
    const m = new Map<string, Map<string, Daily>>()
    for (const r of daily) {
      if (!m.has(r.log_date)) m.set(r.log_date, new Map())
      m.get(r.log_date)!.set(r.kind, r)
    }
    return m
  }, [daily])
  const t = perDay.get(today)
  const skinDays = useMemo(() => new Set(checkins.filter((c) => c.photo_path).map((c) => c.check_date)), [checkins])
  const progress = tasksDone(t, skinDays.has(today))

  const week = Array.from({ length: 7 }, (_, i) => {
    const d = addDays(today, i - 6)
    const p = tasksDone(perDay.get(d), skinDays.has(d))
    return { d, good: p.done >= 3, label: prettyDate(d).slice(0, 1) }
  })

  const insight = useMemo(
    () => crossInsights(checkins, daily).find((i) => Math.abs(i.diff) >= 0.5),
    [checkins, daily],
  )

  const latest = todayCheckin ?? checkins[checkins.length - 1]
  const water = t?.get('water')?.value ?? 0
  const sleep = t?.get('sleep')?.value
  const workout = t?.get('workout')
  const mood = t?.get('mood')?.value
  const MoodIcon = mood ? MOOD_ICONS[mood - 1] : Smile
  const greet = hourNY() < 12 ? 'Good morning' : hourNY() < 18 ? 'Good afternoon' : 'Good evening'

  async function set(kind: HealthKind, value: number, note: string | null = null) {
    try { await setDaily(kind, value, note); await load(); setErr('') }
    catch (e) { setErr(e instanceof Error ? e.message : 'Could not save') }
  }
  async function clear(kind: HealthKind) {
    try { await clearDaily(kind); await load() } catch (e) { setErr(e instanceof Error ? e.message : 'Could not clear') }
  }

  return (
    <main className="screen">
      <header className="today-head">
        <div>
          <h1 className="large-title">{greet}</h1>
          <p className="head-sub">{prettyDate(today)}</p>
        </div>
        <div className="head-right"><span className="pill"><Flame size={16} /> {streakOf(checkins, today)}</span></div>
      </header>
      {err && <div className="banner inline">{err}</div>}

      <section className="card today-card">
        <Ring done={progress.done} of={progress.of} />
        <div className="score-meta">
          <div className="rank">{progress.done === progress.of ? 'All done' : 'Today'}</div>
          <div className="sub">{progress.done} of {progress.of} health tasks</div>
          <button className="btn-chip blue" onClick={() => setSheet(true)}>Log</button>
        </div>
      </section>

      <div className="week">
        {week.map((w) => (
          <span key={w.d} className={'wd' + (w.good ? ' on' : '')}><i />{w.label}</span>
        ))}
      </div>

      <div className="section-header">Modules</div>
      <div className="mods">
        <Link to="/skin" className="mod">
          <Sparkles size={20} /><b>Skin</b>
          <span className="mod-num">{latest?.score ?? 0}</span>
          <small>Day {Math.min(dayNum, 90)} of 90</small>
        </Link>
        <button className="mod" onClick={() => setSheet(true)}>
          <Moon size={20} /><b>Sleep</b>
          <span className="mod-num">{sleep ?? '–'}<em>{sleep ? ' hrs' : ''}</em></span>
          <small>{sleep ? 'Last night' : 'Tap to log'}</small>
        </button>
        <button className="mod" onClick={() => setSheet(true)}>
          <Droplets size={20} /><b>Water</b>
          <span className="mod-num">{water}<em> / {WATER_GOAL}</em></span>
          <span className="bar"><span style={{ width: `${Math.min(100, (water / WATER_GOAL) * 100)}%` }} /></span>
        </button>
        <button className="mod" onClick={() => setSheet(true)}>
          <Dumbbell size={20} /><b>Workout</b>
          <span className="mod-num">{workout ? workout.value : '–'}<em>{workout ? ' min' : ''}</em></span>
          <small>{workout?.note ?? 'Rest day?'}</small>
        </button>
        <button className="mod wide" onClick={() => setSheet(true)}>
          <MoodIcon size={20} /><b>Mood</b>
          <span className="mod-num">{mood ? MOODS[mood - 1] : '–'}</span>
          <small>{mood ? 'Today' : 'Tap to log'}</small>
        </button>
      </div>

      <div className="section-header">What I notice</div>
      <section className="card">
        {insight
          ? <p className="notice">After days with <b>{insight.label}</b>, your spots {insight.diff < 0 ? 'drop' : 'rise'} {Math.abs(insight.diff).toFixed(1)} more the next day ({insight.n} days).</p>
          : <p className="sub">Log sleep, water and workouts for a couple of weeks. Then this card shows what helps your skin.</p>}
      </section>

      {sheet && (
        <div className="sheet-backdrop" onClick={() => setSheet(false)}>
          <div className="sheet" onClick={(e) => e.stopPropagation()}>
            <div className="sheet-top"><h2>Quick log</h2>
              <button className="icon-btn" onClick={() => setSheet(false)} aria-label="Close"><X size={22} /></button>
            </div>

            <div className="log-row"><span><Droplets size={18} /> Water</span>
              <div className="stepper">
                <button onClick={() => set('water', Math.max(0, water - 1))} aria-label="Less water">−</button>
                <b>{water}</b>
                <button onClick={() => set('water', water + 1)} aria-label="More water">+</button>
              </div>
            </div>

            <div className="log-row"><span><Moon size={18} /> Sleep (hrs)</span>
              <div className="stepper">
                <button onClick={() => set('sleep', Math.max(0, (sleep ?? 8) - 0.5))} aria-label="Less sleep">−</button>
                <b>{sleep ?? '–'}</b>
                <button onClick={() => set('sleep', Math.min(14, (sleep ?? 7.5) + 0.5))} aria-label="More sleep">+</button>
              </div>
            </div>

            <div className="log-block"><span><Dumbbell size={18} /> Workout {workout && <button className="btn-text" onClick={() => clear('workout')}>Clear</button>}</span>
              <div className="chips">
                {WORKOUT_TYPES.map((w) => (
                  <button key={w} className={'chip' + (workout?.note === w ? ' on' : '')} onClick={() => set('workout', workout?.value ?? 30, w)}>{w}</button>
                ))}
              </div>
              <div className="chips">
                {[15, 30, 45, 60, 90].map((m) => (
                  <button key={m} className={'chip' + (workout?.value === m ? ' on' : '')} onClick={() => set('workout', m, workout?.note ?? 'Other')}>{m} min</button>
                ))}
              </div>
            </div>

            <div className="log-block"><span><Smile size={18} /> Mood</span>
              <div className="moods">
                {MOODS.map((m, i) => {
                  const Icon = MOOD_ICONS[i]
                  return (
                    <button key={m} className={'mood-btn' + (mood === i + 1 ? ' on' : '')} onClick={() => set('mood', i + 1)}>
                      <Icon size={26} /><small>{m}</small>
                    </button>
                  )
                })}
              </div>
            </div>

            <button className="btn-primary" onClick={() => setSheet(false)}>Done</button>
          </div>
        </div>
      )}
    </main>
  )
}
