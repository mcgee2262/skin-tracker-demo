import { useEffect, useState } from 'react'

/** Counts from `from` to `to` over `ms`; jumps straight to `to` with reduced motion. */
export function useCountUp(to: number, from: number = to, ms = 600): number {
  const [v, setV] = useState(from)
  useEffect(() => {
    if (from === to || window.matchMedia('(prefers-reduced-motion: reduce)').matches) { setV(to); return }
    const t0 = performance.now()
    let raf = 0
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / ms)
      setV(Math.round(from + (to - from) * p))
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [to, from, ms])
  return v
}
