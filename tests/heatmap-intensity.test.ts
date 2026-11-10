import { describe, expect, test } from 'bun:test'
import { getIntensityTone, legendTones } from '../src/plugins/heatmap/intensity'

describe('getIntensityTone', () => {
  test('marks zero and negative values as empty', () => {
    expect(getIntensityTone(0, 9)).toBe('empty')
    expect(getIntensityTone(-1, 9)).toBe('empty')
    expect(getIntensityTone(0, 0)).toBe('empty')
  })

  test('splits progress toward a goal into low, medium, and high steps', () => {
    expect(getIntensityTone(1, 9)).toBe('low')
    expect(getIntensityTone(3, 9)).toBe('low')
    expect(getIntensityTone(4, 9)).toBe('medium')
    expect(getIntensityTone(6, 9)).toBe('medium')
    expect(getIntensityTone(7, 9)).toBe('high')
    expect(getIntensityTone(8, 9)).toBe('high')
  })

  test('separates reaching the goal from overachieving it', () => {
    expect(getIntensityTone(9, 9)).toBe('complete')
    expect(getIntensityTone(17, 9)).toBe('complete')
    expect(getIntensityTone(18, 9)).toBe('over')
  })

  test('keeps count-only mode on the count ramp', () => {
    expect(getIntensityTone(1, 0)).toBe('low')
    expect(getIntensityTone(2, 0)).toBe('medium')
    expect(getIntensityTone(3, 0)).toBe('high')
    expect(getIntensityTone(4, 0)).toBe('count-max')
    expect(getIntensityTone(20, 0)).toBe('count-max')
  })
})

describe('legendTones', () => {
  test('shows every tone available in goal mode', () => {
    expect(legendTones(9)).toEqual(['empty', 'low', 'medium', 'high', 'complete', 'over'])
  })

  test('omits completion tones when there is no goal', () => {
    expect(legendTones(0)).toEqual(['empty', 'low', 'medium', 'high', 'count-max'])
  })
})
