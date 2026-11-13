import type { Spot } from '../types'

function zoneOf({ x, y }: Spot): string {
  if (y < 0.28) return 'Forehead'
  if (y < 0.62) return x > 0.38 && x < 0.62 ? 'Nose' : 'Cheeks'
  if (y < 0.8) return x < 0.3 || x > 0.7 ? 'Jaw' : 'Chin'
  return 'Chin'
}

/** Share of spots per zone, largest first. */
export function zoneShares(spots: Spot[]): { zone: string; share: number }[] {
  const counts: Record<string, number> = { Forehead: 0, Nose: 0, Cheeks: 0, Chin: 0, Jaw: 0 }
  spots.forEach((s) => { counts[zoneOf(s)]++ })
  const total = spots.length || 1
  return Object.entries(counts).map(([zone, n]) => ({ zone, share: n / total })).sort((a, b) => b.share - a.share)
}

export function hottestZone(spots: Spot[]): string | null {
  if (!spots.length) return null
  return zoneShares(spots)[0].zone.toLowerCase()
}

// Spot coords are relative to the photo; the camera's face-oval guide spans x 14–86%, y 12–86%.
export default function HeatMap({ spots }: { spots: Spot[] }) {
  return (
    <svg viewBox="0 0 150 200" className="heatmap" role="img" aria-label="Problem zones heat map">
      <defs>
        <filter id="blur" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="5" /></filter>
        <clipPath id="face"><ellipse cx="75" cy="100" rx="62" ry="86" /></clipPath>
      </defs>
      <ellipse cx="75" cy="100" rx="62" ry="86" fill="var(--blue-tint)" />
      <g clipPath="url(#face)" filter="url(#blur)">
        {spots.map((s, i) => (
          <circle key={i} cx={75 + ((s.x - 0.5) / 0.36) * 62} cy={100 + ((s.y - 0.49) / 0.37) * 86} r="6" fill="#0A3D91" fillOpacity="0.3" />
        ))}
      </g>
      <ellipse cx="75" cy="100" rx="62" ry="86" fill="none" stroke="var(--blue)" strokeOpacity="0.4" strokeWidth="1.5" />
    </svg>
  )
}
