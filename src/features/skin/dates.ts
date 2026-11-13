const TZ = 'America/New_York'

const dayFmt = new Intl.DateTimeFormat('en-CA', { timeZone: TZ })

/** Today's calendar date (YYYY-MM-DD) in America/New_York. */
export function todayStr(now = new Date()): string {
  return dayFmt.format(now)
}

export function hourNY(now = new Date()): number {
  return Number(new Intl.DateTimeFormat('en-US', { timeZone: TZ, hour: 'numeric', hour12: false }).format(now)) % 24
}

const toUTC = (d: string) => {
  const [y, m, day] = d.split('-').map(Number)
  return Date.UTC(y, m - 1, day)
}

export function diffDays(from: string, to: string): number {
  return Math.round((toUTC(to) - toUTC(from)) / 86400000)
}

export function addDays(d: string, n: number): string {
  return new Date(toUTC(d) + n * 86400000).toISOString().slice(0, 10)
}

export function dayNumber(start: string, date: string): number {
  return diffDays(start, date) + 1
}

export function prettyDate(d: string): string {
  const [y, m, day] = d.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, day)).toLocaleDateString('en-US', {
    timeZone: 'UTC', weekday: 'long', month: 'long', day: 'numeric',
  })
}
