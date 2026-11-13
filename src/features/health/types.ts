export type HealthKind = 'water' | 'sleep' | 'workout' | 'mood'

/** One value per kind per day. water = cups, sleep = hours, workout = minutes (note = type), mood = 1 to 5. */
export interface Daily {
  log_date: string
  kind: HealthKind
  value: number
  note: string | null
}

export const WATER_GOAL = 8
export const MOODS = ['Rough', 'Low', 'Okay', 'Good', 'Great'] as const
export const WORKOUT_TYPES = ['Run', 'Lift', 'Sport', 'Walk', 'Other'] as const
