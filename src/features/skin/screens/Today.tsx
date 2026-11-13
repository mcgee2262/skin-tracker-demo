import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Check, ChevronRight, Flame, Settings } from 'lucide-react'
import { supabase } from '../../../lib/supabase'
import { useSkin, streakOf } from '../SkinContext'
import { hourNY, prettyDate } from '../dates'
import { MORNING_STEPS, nightSteps } from '../routine'
import { nextRank, rankFor } from '../score'
import { DEMO, setChallengeStart } from '../api'
import ScoreRing from '../components/ScoreRing'
import { useCountUp } from '../components/useCountUp'

function CheckCircle({ on }: { on: boolean }) {
  return <span className={'check' + (on ? ' on' : '')}>{on && <Check size={16} strokeWidth={3} />}</span>
}

export default function Today() {
  const { challenge, checkins, todayCheckin, today, dayNum, save, refresh, urls } = useSkin()
  const nav = useNavigate()
  const from = (useLocation().state as { from?: number } | null)?.from
  const [sheet, setSheet] = useState(false)
  const [startDraft, setStartDraft] = useState(challenge?.start_date ?? today)

  const latest = todayCheckin ?? checkins[checkins.length - 1]
  const prior = checkins.filter((c) => c.id !== latest?.id && c.check_date < (latest?.check_date ?? today)).pop()
  const score = latest?.score ?? 0
  const shown = useCountUp(score, from ?? score)
  const delta = latest && prior && latest.score != null && prior.score != null ? latest.score - prior.score : null
  const next = nextRank(score)
  const streak = streakOf(checkins, today)
  const am = todayCheckin?.am_done ?? false
  const pm = todayCheckin?.pm_done ?? false

  const lastShot = [...checkins].reverse().find((c) => c.photo_path && urls[c.photo_path])
  const first = checkins[0]
  const fewer = lastShot && first ? first.spot_count - lastShot.spot_count : 0
  const spotLine = !lastShot || lastShot.id === first?.id
    ? 'Your Day 1 baseline'
    : fewer > 0 ? `${fewer} fewer than Day 1` : fewer < 0 ? `${-fewer} more than Day 1` : 'Same as Day 1'

  const toggle = (which: 'am' | 'pm') =>
    save({ am: which === 'am' ? !am : am, pm: which === 'pm' ? !pm : pm })

  async function saveStart() {
    if (challenge) { await setChallengeStart(challenge.id, startDraft); await refresh() }
    setSheet(false)
  }

  return (
    <main className="screen">
      <header className="today-head">
        <div>
          <h1 className="large-title">Day {Math.min(dayNum, 90)} of 90</h1>
          <p className="head-sub">{prettyDate(today)}{DEMO && ' · Demo data'}</p>
        </div>
        <div className="head-right">
          <span className="pill"><Flame size={16} /> {streak}</span>
          <button className="icon-btn" onClick={() => setSheet(true)} aria-label="Settings"><Settings size={22} /></button>
        </div>
      </header>

      <section className="card score-card">
        <ScoreRing value={shown} />
        <div className="score-meta">
          <div className="rank">{rankFor(score).name}</div>
          {delta !== null && <div className="sub">{delta >= 0 ? '+' : ''}{delta} since yesterday</div>}
          {next ? <div className="sub">{next.pointsAway} pts to {next.name}</div> : <div className="sub">Top rank</div>}
        </div>
      </section>

      <section className="quote">
        <p>“No one buys from chuds.”</p>
        <span>— Blake B Sales</span>
      </section>

      <div className="section-header">Routine</div>
      <ul className="list">
        <li><button className="row" onClick={() => toggle('am')}>
          <CheckCircle on={am} />
          <span className="row-main"><b>Morning</b><small>{MORNING_STEPS.join(', ')}</small></span>
          <span className="row-status">{am ? 'Done' : hourNY() < 12 ? 'Today' : 'Missed'}</span>
        </button></li>
        <li><button className="row" onClick={() => toggle('pm')}>
          <CheckCircle on={pm} />
          <span className="row-main"><b>Night</b><small>{nightSteps(dayNum).join(', ')}</small></span>
          <span className="row-status">{pm ? 'Done' : 'Tonight'}</span>
        </button></li>
      </ul>

      {lastShot && (
        <>
          <div className="section-header">Last photo</div>
          <Link to="/photos" className="list last-shot">
            <img src={urls[lastShot.photo_path!]} alt="" />
            <span className="row-main">
              <b>Day {lastShot.day_number} · {lastShot.spot_count} spots</b>
              <small>{spotLine}</small>
            </span>
            <ChevronRight size={18} className="chev" />
          </Link>
        </>
      )}

      <div className="bottom-cta">
        <button className="btn-primary" onClick={() => nav('/checkin')}>
          {todayCheckin?.photo_path ? <><Check size={20} strokeWidth={2.5} /> Checked in — Redo</> : 'Check In'}
        </button>
      </div>

      {sheet && (
        <div className="sheet-backdrop" onClick={() => setSheet(false)}>
          <div className="sheet" onClick={(e) => e.stopPropagation()}>
            <h2>Settings</h2>
            {challenge && (
              <label className="sheet-field">
                Challenge start date
                <input className="field" type="date" value={startDraft} onChange={(e) => setStartDraft(e.target.value)} />
              </label>
            )}
            <button className="btn-primary" onClick={saveStart}>Done</button>
            {DEMO
              ? <p className="sub">Demo mode: sample data, nothing is saved.</p>
              : <button className="btn-text danger" onClick={() => supabase.auth.signOut()}>Sign out</button>}
          </div>
        </div>
      )}
    </main>
  )
}
