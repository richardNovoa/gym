import { describe, expect, it } from 'vitest'
import {
  backoffShouldFollow,
  buildSetPatch,
  repsForToggle,
  bestEstimated1rm,
  dailyBestEstimates,
  defaultStrengthSets,
  epley1rm,
  heaviestWeight,
  nextDropWeight,
  nextSplit,
  orderSets,
  pyramidAnchorWeight,
  selectNextSplit,
  suggestedDropWeight,
} from './training'

describe('default strength sets', () => {
  it('plans 12, 10, 8, 6, 4 then a 12-rep back-off', () => {
    const sets = defaultStrengthSets()
    expect(sets.map((set) => set.kind)).toEqual([
      'pyramid',
      'pyramid',
      'pyramid',
      'pyramid',
      'pyramid',
      'backoff',
    ])
    expect(sets.map((set) => set.target_reps)).toEqual([12, 10, 8, 6, 4, 12])
    expect(sets.map((set) => set.rir)).toEqual([2, 2, 2, 2, 1, null])
    expect(sets.map((set) => set.position)).toEqual([0, 1, 2, 3, 4, 5])
  })
})

describe('back-off weight', () => {
  it('reads the 8-rep pyramid weight', () => {
    expect(
      pyramidAnchorWeight([
        { kind: 'pyramid', target_reps: 12, weight: 95 },
        { kind: 'pyramid', target_reps: 8, weight: 135 },
        { kind: 'backoff', target_reps: 12, weight: null },
      ]),
    ).toBe(135)
  })

  it('follows the anchor until the back-off is edited to something else', () => {
    expect(backoffShouldFollow(null, null)).toBe(true)
    expect(backoffShouldFollow(135, null)).toBe(true)
    expect(backoffShouldFollow(135, 135)).toBe(true)
    expect(backoffShouldFollow(135, 115)).toBe(false)
    expect(backoffShouldFollow(null, 115)).toBe(false)
  })

  it('suggests a lighter drop, then another step down from the last drop', () => {
    expect(suggestedDropWeight(135)).toBe(110)
    expect(suggestedDropWeight(95)).toBe(75)
    expect(suggestedDropWeight(null)).toBeNull()
    expect(nextDropWeight(135, [])).toBe(110)
    expect(nextDropWeight(135, [{ weight: 110 }])).toBe(90)
  })
})

describe('set edits', () => {
  it('logs the prescribed reps when a set is completed with the field still empty', () => {
    expect(repsForToggle(null, 12, false)).toBe(12)
    expect(repsForToggle(9, 12, false)).toBe(9)
    expect(repsForToggle(null, 12, true)).toBeNull()
  })

  it('omits unchanged reps so a weight blur cannot wipe them', () => {
    expect(
      buildSetPatch({ nextReps: null, nextWeight: 135, reps: null, weight: null }),
    ).toEqual({ weight: 135 })
    expect(
      buildSetPatch({
        nextReps: 12,
        nextWeight: 135,
        reps: null,
        weight: 135,
        completed: true,
      }),
    ).toEqual({ reps: 12, completed: true })
    expect(
      buildSetPatch({ nextReps: 12, nextWeight: 135, reps: 12, weight: 135 }),
    ).toBeNull()
  })
})

describe('orderSets', () => {
  it('nests drop segments under their parent', () => {
    const ordered = orderSets([
      { id: 'drop-b', position: 8, parent_set_id: 'back' },
      { id: 'back', position: 5, parent_set_id: null },
      { id: 'drop-a', position: 6, parent_set_id: 'back' },
      { id: 'top', position: 4, parent_set_id: null },
    ])
    expect(ordered.map((set) => set.id)).toEqual(['top', 'back', 'drop-a', 'drop-b'])
  })
})

describe('Epley 1RM', () => {
  it('computes weight × (1 + reps / 30)', () => {
    expect(epley1rm(200, 6)).toBeCloseTo(200 * (1 + 6 / 30))
    expect(epley1rm(100, 1)).toBeCloseTo(100 * (1 + 1 / 30))
  })

  it('rejects non-positive inputs', () => {
    expect(epley1rm(0, 5)).toBeNull()
    expect(epley1rm(100, 0)).toBeNull()
    expect(epley1rm(Number.NaN, 5)).toBeNull()
  })

  it('picks the best completed estimate and ignores warm-ups', () => {
    const best = bestEstimated1rm([
      { kind: 'warmup', weight: 300, reps: 10, completed: true, unit: 'lb' },
      { kind: 'pyramid', weight: 185, reps: 4, completed: true, unit: 'lb' },
      { kind: 'backoff', weight: 155, reps: 9, completed: true, unit: 'lb' },
      { kind: 'pyramid', weight: 225, reps: 3, completed: false, unit: 'lb' },
    ])
    expect(best?.weight).toBe(185)
    expect(best?.reps).toBe(4)
    expect(best?.estimate).toBeCloseTo(185 * (1 + 4 / 30))
  })

  it('keeps a day to its best estimate and reports the heaviest load', () => {
    const series = dailyBestEstimates(
      [
        { date: '2026-11-01', kind: 'pyramid', weight: 135, reps: 8, unit: 'lb', completed: true },
        { date: '2026-11-01', kind: 'pyramid', weight: 185, reps: 4, unit: 'lb', completed: true },
        { date: '2026-11-08', kind: 'warmup', weight: 200, reps: 12, unit: 'lb', completed: true },
        { date: '2026-11-08', kind: 'pyramid', weight: 195, reps: 4, unit: 'lb', completed: true },
        { date: '2026-11-08', kind: 'pyramid', weight: 100, reps: 5, unit: 'kg', completed: true },
      ],
      'lb',
    )
    expect(series).toHaveLength(2)
    expect(series[0]?.weight).toBe(185)
    expect(series[1]?.weight).toBe(195)
    expect(series[1]?.estimate).toBeCloseTo(195 * (1 + 4 / 30))
    expect(
      heaviestWeight(
        [
          { weight: 185, reps: 4, unit: 'lb', completed: true },
          { weight: 195, reps: 4, unit: 'lb', completed: true },
          { weight: 300, reps: 1, unit: 'kg', completed: true },
        ],
        'lb',
      ),
    ).toBe(195)
  })
})

describe('next split', () => {
  it('walks cardio, chest & back, shoulders & arms, legs, then rest', () => {
    expect(nextSplit(null)).toBe('cardio')
    expect(nextSplit('cardio')).toBe('chest_back')
    expect(nextSplit('chest_back')).toBe('shoulders_arms')
    expect(nextSplit('shoulders_arms')).toBe('legs')
    expect(nextSplit('legs')).toBe('rest')
    expect(nextSplit('rest')).toBe('cardio')
    expect(nextSplit('other')).toBe('cardio')
  })

  it('uses the latest logged split, with start time as the tiebreak', () => {
    expect(
      selectNextSplit([
        { split: 'cardio', performed_on: '2026-11-14', started_at: '2026-11-14T15:00:00Z' },
        { split: 'chest_back', performed_on: '2026-11-15', started_at: '2026-11-15T15:00:00Z' },
        { split: 'legs', performed_on: '2026-11-15', started_at: '2026-11-15T12:00:00Z' },
      ]),
    ).toBe('shoulders_arms')
    expect(selectNextSplit([])).toBe('cardio')
  })
})
