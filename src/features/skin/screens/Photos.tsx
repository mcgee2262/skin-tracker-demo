import { useMemo, useState } from 'react'
import { Check, Play } from 'lucide-react'
import { useSkin } from '../SkinContext'
import Timelapse from '../components/Timelapse'

export default function Photos() {
  const { checkins, urls } = useSkin()
  const shots = useMemo(() => checkins.filter((c) => c.photo_path && urls[c.photo_path]), [checkins, urls])
  const [sel, setSel] = useState<string[]>([])
  const [play, setPlay] = useState(false)

  const ids = sel.length ? sel : shots.length ? [shots[0].id, shots[shots.length - 1].id] : []
  const pair = ids.map((id) => shots.find((s) => s.id === id)).filter(Boolean) as typeof shots
  pair.sort((a, b) => a.day_number - b.day_number)

  function toggle(id: string) {
    setSel((cur) => cur.includes(id) ? cur.filter((x) => x !== id) : cur.length >= 2 ? [cur[1], id] : [...cur, id])
  }

  return (
    <main className="screen">
      <header className="photos-head">
        <h1 className="large-title">Photos</h1>
        <button className="btn-chip blue" disabled={shots.length < 2} onClick={() => setPlay(true)}><Play size={14} /> Timelapse</button>
      </header>

      {shots.length === 0 ? (
        <p className="muted pad">No photos yet. Do your first check-in.</p>
      ) : (
        <>
          <section className="card">
            <div className="compare">
              {pair.map((c) => (
                <figure key={c.id}><img src={urls[c.photo_path!]} alt={`Day ${c.day_number}`} /><figcaption>Day {c.day_number}</figcaption></figure>
              ))}
            </div>
          </section>
          <div className="grid">
            {shots.map((c) => (
              <button key={c.id} className={'tile' + (sel.includes(c.id) ? ' sel' : '')} onClick={() => toggle(c.id)}>
                <img src={urls[c.photo_path!]} alt="" loading="lazy" />
                <span className="tile-label">Day {c.day_number}</span>
                {sel.includes(c.id) && <span className="tile-badge"><Check size={14} strokeWidth={3} /></span>}
              </button>
            ))}
          </div>
        </>
      )}

      {play && (
        <div className="overlay">
          <Timelapse urls={shots.map((c) => urls[c.photo_path!])} totalMs={Math.min(6000, Math.max(3000, shots.length * 120))} onDone={() => setPlay(false)} />
        </div>
      )}
    </main>
  )
}
