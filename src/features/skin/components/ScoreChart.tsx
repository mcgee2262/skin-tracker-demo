import type { Checkin } from '../types'

export default function ScoreChart({ checkins, todayDay, length = 90 }: { checkins: Checkin[]; todayDay: number; length?: number }) {
  const W = 340, H = 150, pad = 8, lane = 26
  const x = (d: number) => lane + ((d - 1) / (length - 1)) * (W - lane - pad)
  const y = (s: number) => H - 20 - (s / 100) * (H - 34)
  const pts = checkins.filter((c) => c.score != null).map((c) => [x(c.day_number), y(c.score!)] as const)
  const line = pts.map(([px, py], i) => `${i ? 'L' : 'M'}${px.toFixed(1)},${py.toFixed(1)}`).join(' ')
  const area = pts.length ? `${line} L${pts[pts.length - 1][0]},${H - 20} L${pts[0][0]},${H - 20} Z` : ''
  const last = pts[pts.length - 1]

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="chart" role="img" aria-label="Score by day">
      {[0, 50, 100].map((g) => (
        <g key={g}>
          <line x1={lane} x2={W - pad} y1={y(g)} y2={y(g)} stroke="var(--separator)" strokeWidth="1" />
          <text x={lane - 6} y={y(g)} fontSize="11" fill="var(--text-2)" textAnchor="end" dominantBaseline="central">{g}</text>
        </g>
      ))}
      {area && <path d={area} fill="var(--blue)" fillOpacity="0.12" />}
      {line && <path d={line} fill="none" stroke="var(--blue)" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />}
      {todayDay <= length && <line x1={x(todayDay)} x2={x(todayDay)} y1={8} y2={H - 20} stroke="var(--blue)" strokeOpacity="0.25" strokeDasharray="3 3" />}
      {last && <circle cx={last[0]} cy={last[1]} r="5" fill="var(--blue)" stroke="#fff" strokeWidth="2" />}
      <text x={lane} y={H - 4} fontSize="11" fill="var(--text-2)">Day 1</text>
      <text x={W - pad} y={H - 4} fontSize="11" fill="var(--text-2)" textAnchor="end">Day {length}</text>
    </svg>
  )
}
