export type HeatmapIntensity =
  | 'empty'
  | 'low'
  | 'medium'
  | 'high'
  | 'complete'
  | 'over'
  | 'count-max'

const GOAL_LEGEND: HeatmapIntensity[] = [
  'empty',
  'low',
  'medium',
  'high',
  'complete',
  'over',
]

const COUNT_LEGEND: HeatmapIntensity[] = ['empty', 'low', 'medium', 'high', 'count-max']

export function getIntensityTone(value: number, goal: number): HeatmapIntensity {
  if (value <= 0) return 'empty'

  if (goal <= 0) {
    if (value >= 4) return 'count-max'
    if (value >= 3) return 'high'
    if (value >= 2) return 'medium'
    return 'low'
  }

  if (value >= goal * 2) return 'over'
  if (value >= goal) return 'complete'

  const progress = value / goal
  if (progress <= 1 / 3) return 'low'
  if (progress <= 2 / 3) return 'medium'
  return 'high'
}

export function legendTones(goal: number): HeatmapIntensity[] {
  return goal > 0 ? GOAL_LEGEND : COUNT_LEGEND
}
