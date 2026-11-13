/** Days 1–14: Differin every other night (odd days). Day 15+: every night. */
export function isDifferinNight(dayNumber: number): boolean {
  if (dayNumber >= 15) return true
  return dayNumber % 2 === 1
}

export function nightSteps(dayNumber: number): string[] {
  return isDifferinNight(dayNumber)
    ? ['Wash', 'Differin', 'Cetaphil']
    : ['Wash', 'Cetaphil (skip Differin)']
}

export const MORNING_STEPS = ['Wash', 'SPF moisturizer']
