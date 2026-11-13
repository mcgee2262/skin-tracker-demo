import { useEffect, useState } from 'react'

interface Props {
  urls: string[]
  /** total playtime in ms; frame time is clamped to 40–600 ms */
  totalMs?: number
  onDone: () => void
  /** shown when there are no photos (Day 1) */
  emptyText?: string
  /** keep the last frame on screen until unmount */
  holdLast?: boolean
}

export default function Timelapse({ urls, totalMs = 3000, onDone, emptyText = 'Day 1. Let’s go.', holdLast }: Props) {
  const [i, setI] = useState(0)
  const reduced = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

  useEffect(() => {
    if (urls.length === 0) {
      const t = setTimeout(onDone, 1500)
      return () => clearTimeout(t)
    }
    urls.forEach((u) => { const im = new Image(); im.src = u })
    const frame = reduced ? 600 : Math.min(600, Math.max(40, totalMs / urls.length))
    let n = 0
    const id = setInterval(() => {
      n++
      if (n >= urls.length) { clearInterval(id); onDone(); return }
      setI(n)
    }, frame)
    return () => clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urls])

  return (
    <div className="timelapse" onClick={onDone} role="button" aria-label="Skip">
      {urls.length === 0 ? (
        <div className="timelapse-empty">{emptyText}</div>
      ) : (
        <img src={urls[Math.min(i, urls.length - 1)]} alt="" />
      )}
      {!holdLast && urls.length > 0 && <div className="timelapse-hint">Tap to skip</div>}
    </div>
  )
}
