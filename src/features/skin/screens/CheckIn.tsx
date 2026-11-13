import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Check } from 'lucide-react'
import { useSkin } from '../SkinContext'
import { listSpots } from '../api'
import { MORNING_STEPS, nightSteps } from '../routine'
import { TAGS } from '../insights'
import type { Spot } from '../types'
import Timelapse from '../components/Timelapse'
import GhostCamera from '../components/GhostCamera'
import SpotTapper from '../components/SpotTapper'

const STEPS = ['Photo', 'Spots', 'Routine']

export default function CheckIn() {
  const { checkins, urls, today, dayNum, todayCheckin, save } = useSkin()
  const nav = useNavigate()

  const prior = useMemo(() => checkins.filter((c) => c.check_date < today), [checkins, today])
  const priorWithPhoto = prior.filter((c) => c.photo_path && urls[c.photo_path])
  const timelapseUrls = priorWithPhoto.map((c) => urls[c.photo_path!])
  const ghostUrl = timelapseUrls[timelapseUrls.length - 1]
  const lastPrior = prior[prior.length - 1]

  const [step, setStep] = useState(-1) // -1 = timelapse intro
  const [photo, setPhoto] = useState<Blob | null>(null)
  const [photoUrl, setPhotoUrl] = useState('')
  const [spots, setSpots] = useState<Spot[]>([])
  const [am, setAm] = useState(todayCheckin?.am_done ?? false)
  const [pm, setPm] = useState(todayCheckin?.pm_done ?? false)
  const [tags, setTags] = useState<string[]>(todayCheckin?.tags ?? [])
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  useEffect(() => () => { if (photoUrl) URL.revokeObjectURL(photoUrl) }, [photoUrl])

  function captured(blob: Blob) {
    setPhoto(blob)
    setPhotoUrl(URL.createObjectURL(blob))
    setStep(1)
  }

  async function sameAsYesterday() {
    if (!lastPrior) return
    setSpots(await listSpots(lastPrior.id))
  }

  async function finish() {
    setBusy(true); setErr('')
    try {
      const before = todayCheckin?.score ?? lastPrior?.score ?? 0
      await save({ photo, spots, am, pm, tags })
      nav('/skin', { replace: true, state: { from: before } })
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Could not save')
      setBusy(false)
    }
  }

  const stepIdx = Math.max(0, step)
  const night = nightSteps(dayNum)

  return (
    <div className="checkin">
      <header className="checkin-top">
        <button className="btn-text light" onClick={() => nav('/skin')}>Cancel</button>
        <div className="segments">
          {STEPS.map((s, i) => <span key={s} className={i === stepIdx ? 'on' : ''}>{s}</span>)}
        </div>
        <span style={{ width: 56 }} />
      </header>

      {step === -1 && <Timelapse urls={timelapseUrls} onDone={() => setStep(0)} />}

      {step === 0 && (
        <div className="fade-in">
          <GhostCamera ghostUrl={ghostUrl} onCapture={captured} />
        </div>
      )}

      {step === 1 && (
        <div className="panel-step">
          <SpotTapper src={photoUrl} spots={spots} onChange={setSpots} />
          <div className="spot-bar">
            <b>{spots.length} spots</b>
            {lastPrior && <button className="btn-chip" onClick={sameAsYesterday}>Same as yesterday</button>}
          </div>
          <div className="step-actions">
            <button className="btn-chip" onClick={() => setStep(0)}>Retake</button>
            <button className="btn-primary" onClick={() => setStep(2)}>Next</button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="panel-step">
          <ul className="list dark">
            <li><button className="row" onClick={() => setAm(!am)}>
              <span className={'check' + (am ? ' on' : '')}>{am && <Check size={16} strokeWidth={3} />}</span>
              <span className="row-main"><b>Morning</b><small>{MORNING_STEPS.join(' · ')}</small></span>
            </button></li>
            <li><button className="row" onClick={() => setPm(!pm)}>
              <span className={'check' + (pm ? ' on' : '')}>{pm && <Check size={16} strokeWidth={3} />}</span>
              <span className="row-main"><b>Night</b><small>{night.join(' · ')}</small></span>
            </button></li>
          </ul>
          <p className="tag-head">Today's habits</p>
          <div className="tags">
            {TAGS.map((t) => (
              <button key={t.id} type="button" className={'tag' + (tags.includes(t.id) ? ' on' : '')}
                onClick={() => setTags(tags.includes(t.id) ? tags.filter((x) => x !== t.id) : [...tags, t.id])}>
                {t.label}
              </button>
            ))}
          </div>
          {err && <p className="error">{err}</p>}
          <div className="step-actions">
            <button className="btn-chip" onClick={() => setStep(1)}>Back</button>
            <button className="btn-primary" disabled={busy} onClick={finish}>{busy ? 'Saving…' : 'Done'}</button>
          </div>
        </div>
      )}
    </div>
  )
}
