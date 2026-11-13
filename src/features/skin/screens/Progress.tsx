import { useEffect, useMemo, useState } from 'react'
import { Lock } from 'lucide-react'
import { useSkin } from '../SkinContext'
import { listSpotsForCheckins } from '../api'
import { RANKS, rankFor } from '../score'
import { whatHelps, tagLabel } from '../insights'
import type { Spot } from '../types'
import ScoreChart from '../components/ScoreChart'
import HeatMap, { zoneShares } from '../components/HeatMap'

const MILESTONES = [30, 60, 90]

export default function Progress() {
  const { checkins, dayNum, urls } = useSkin()
  const [spots, setSpots] = useState<Spot[]>([])
  const [open, setOpen] = useState<number | null>(null)

  const last7 = checkins.slice(-7)
  const key = last7.map((c) => c.id).join(',')
  useEffect(() => { void listSpotsForCheckins(last7.map((c) => c.id)).then(setSpots) }, [key]) // eslint-disable-line

  const first = checkins[0]
  const latest = checkins[checkins.length - 1]
  const score = latest?.score ?? 0
  const zones = zoneShares(spots)
  const helps = useMemo(() => whatHelps(checkins).filter((i) => Math.abs(i.diff) >= 0.5).slice(0, 4), [checkins])

  const routineDone = useMemo(() => {
    const since = checkins.filter((c) => dayNum - c.day_number < 7)
    const steps = since.reduce((s, c) => s + (c.am_done ? 1 : 0) + (c.pm_done ? 1 : 0), 0)
    return { steps, of: Math.min(7, dayNum) * 2 }
  }, [checkins, dayNum])

  function pairFor(m: number) {
    const a = first
    const b = [...checkins].reverse().find((c) => c.day_number <= m && c.photo_path) 
    return { a, b }
  }

  return (
    <main className="screen">
      <h1 className="large-title">Progress</h1>

      <section className="card">
        <div className="chart-head">
          <span className="sub">Clear Skin Score</span>
          <span className="lead-num">{score}</span>
          <span className="sub">{first?.score != null && latest && latest.id !== first.id
            ? `${score - first.score >= 0 ? 'Up' : 'Down'} ${Math.abs(score - first.score)} from Day 1 (${first.score})`
            : 'Your first score'}</span>
        </div>
        <ScoreChart checkins={checkins} todayDay={Math.min(dayNum, 90)} />
        {dayNum >= 8 && dayNum <= 28 && (
          <p className="note">Weeks 2 to 4: a small dip is normal while Differin purges. Keep going.</p>
        )}
      </section>

      <div className="section-header">Problem zones</div>
      <section className="card zones">
        <HeatMap spots={spots} />
        {spots.length ? (
          <ul className="zone-list">
            {zones.map(({ zone, share }) => (
              <li key={zone}>
                <span className="zone-name">{zone}</span>
                <span className="zone-pct">{Math.round(share * 100)}%</span>
                <span className="zone-bar"><span style={{ width: `${share * 100}%` }} /></span>
              </li>
            ))}
            <li className="zone-foot">Last {last7.length} check-ins</li>
          </ul>
        ) : <p className="sub">No spots logged yet</p>}
      </section>

      {helps.length > 0 && (
        <>
          <div className="section-header">What helps</div>
          <ul className="list">
            {helps.map((i) => (
              <li key={i.tag} className="row static">
                <span className="row-main">
                  <b>{tagLabel(i.tag)}</b>
                  <small>{i.diff < 0 ? 'Fewer' : 'More'} spots the next day, {Math.abs(i.diff).toFixed(1)} on average ({i.n} days)</small>
                </span>
                <span className={'badge ' + (i.diff < 0 ? 'good' : 'bad')}>{i.diff < 0 ? '↓' : '↑'}</span>
              </li>
            ))}
          </ul>
        </>
      )}

      <div className="section-header">Stats</div>
      <ul className="list">
        <li className="row static">
          <span className="row-main"><b>Spots today</b><small>{first && latest ? `${first.spot_count} on Day 1 · ${first.spot_count - latest.spot_count >= 0 ? `${first.spot_count - latest.spot_count} fewer` : `${latest.spot_count - first.spot_count} more`}` : 'No check-ins yet'}</small></span>
          <span className="big-num">{latest?.spot_count ?? '–'}</span>
        </li>
        <li className="row static">
          <span className="row-main"><b>Routine, last 7 days</b><small>Morning and night steps done</small></span>
          <span className="big-num">{routineDone.steps}/{routineDone.of}</span>
        </li>
      </ul>

      <div className="section-header">Before and after</div>
      <ul className="list">
        {MILESTONES.map((m) => {
          const unlocked = dayNum >= m
          return (
            <li key={m}>
              <button className="row" disabled={!unlocked} onClick={() => setOpen(m)}>
                <span className="row-main"><b>Day {m}</b></span>
                <span className="row-status">{unlocked ? 'View' : <><Lock size={14} /> in {m - dayNum} days</>}</span>
              </button>
            </li>
          )
        })}
      </ul>

      <div className="section-header">Ranks</div>
      <div className="ranks">
        {RANKS.map((r, i) => <span key={r.name} className={i === rankFor(score).index ? 'on' : ''}>{r.name}</span>)}
      </div>

      {open && (() => {
        const { a, b } = pairFor(open)
        const ua = a?.photo_path ? urls[a.photo_path] : undefined
        const ub = b?.photo_path ? urls[b.photo_path] : undefined
        return (
          <div className="sheet-backdrop" onClick={() => setOpen(null)}>
            <div className="sheet" onClick={(e) => e.stopPropagation()}>
              <h2>Day 1 vs Day {b?.day_number ?? open}</h2>
              <div className="compare">
                <figure>{ua ? <img src={ua} alt="Day 1" /> : <div className="ph" />}<figcaption>Day 1</figcaption></figure>
                <figure>{ub ? <img src={ub} alt={`Day ${open}`} /> : <div className="ph" />}<figcaption>Day {b?.day_number ?? open}</figcaption></figure>
              </div>
              <button className="btn-primary" onClick={() => setOpen(null)}>Close</button>
            </div>
          </div>
        )
      })()}
    </main>
  )
}
