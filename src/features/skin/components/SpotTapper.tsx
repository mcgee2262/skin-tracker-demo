import { useRef } from 'react'
import type { Spot } from '../types'

export default function SpotTapper({ src, spots, onChange }: { src: string; spots: Spot[]; onChange: (s: Spot[]) => void }) {
  const ref = useRef<HTMLDivElement>(null)

  function add(e: React.MouseEvent) {
    const box = ref.current!.getBoundingClientRect()
    const x = (e.clientX - box.left) / box.width
    const y = (e.clientY - box.top) / box.height
    onChange([...spots, { x, y }])
  }

  return (
    <div className="spot-wrap" ref={ref} onClick={add}>
      <img src={src} alt="Your photo" draggable={false} />
      {spots.map((s, i) => (
        <button
          key={i} className="spot-hit" aria-label="Remove spot"
          style={{ left: `${s.x * 100}%`, top: `${s.y * 100}%` }}
          onClick={(e) => { e.stopPropagation(); onChange(spots.filter((_, j) => j !== i)) }}
        >
          <span className="spot-dot" />
        </button>
      ))}
    </div>
  )
}
