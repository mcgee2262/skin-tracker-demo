import { describe, expect, it } from 'vitest'
import { isDifferinNight, nightSteps } from './routine'

describe('routine', () => {
  it('uses Differin on odd days through day 14', () => {
    expect(isDifferinNight(1)).toBe(true)
    expect(isDifferinNight(2)).toBe(false)
    expect(isDifferinNight(13)).toBe(true)
    expect(isDifferinNight(14)).toBe(false)
  })
  it('uses Differin every night from day 15', () => {
    expect(isDifferinNight(15)).toBe(true)
    expect(isDifferinNight(16)).toBe(true)
    expect(isDifferinNight(90)).toBe(true)
  })
  it('lists steps', () => {
    expect(nightSteps(1)).toEqual(['Wash', 'Differin', 'Cetaphil'])
    expect(nightSteps(2)).toEqual(['Wash', 'Cetaphil (skip Differin)'])
  })
})
