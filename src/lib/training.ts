export const SPLIT_CYCLE = [
  'cardio',
  'chest_back',
  'shoulders_arms',
  'legs',
  'rest',
] as const

export type CycleDay = (typeof SPLIT_CYCLE)[number]
export type SplitDay = CycleDay | 'other'
export type SetKind = 'warmup' | 'pyramid' | 'backoff' | 'drop' | 'straight'

export const PYRAMID_REPS = [12, 10, 8, 6, 4] as const
export const BACKOFF_TARGET_REPS = 12
export const PYRAMID_RIR = 2
export const TOP_SET_RIR = 1
export const ANCHOR_REPS = 8

export interface PlannedSet {
  position: number
  kind: 'pyramid' | 'backoff'
  target_reps: number
  rir: number | null
}

/** Pyramid of 12, 10, 8, 6, 4 (2 RIR, 1 RIR on the set of 4), then a 12-rep back-off. */
export function defaultStrengthSets(): PlannedSet[] {
  const pyramid: PlannedSet[] = PYRAMID_REPS.map((reps, position) => ({
    position,
    kind: 'pyramid',
    target_reps: reps,
    rir: reps === 4 ? TOP_SET_RIR : PYRAMID_RIR,
  }))
  return [
    ...pyramid,
    {
      position: pyramid.length,
      kind: 'backoff',
      target_reps: BACKOFF_TARGET_REPS,
      rir: null,
    },
  ]
}

export interface WeightCarrier {
  kind: string
  target_reps: number | null
  weight: number | null
}

/** The back-off is taken at the weight of the 8-rep pyramid set. */
export function pyramidAnchorWeight(sets: WeightCarrier[]): number | null {
  const anchor = sets.find(
    (set) =>
      set.kind === 'pyramid' &&
      set.target_reps === ANCHOR_REPS &&
      set.weight != null &&
      set.weight > 0,
  )
  return anchor?.weight ?? null
}

/**
 * The back-off keeps following the 8-rep weight until someone types a different one.
 * A null back-off weight still follows. A weight that matches the previous anchor still follows.
 */
export function backoffShouldFollow(
  previousAnchor: number | null,
  backoffWeight: number | null,
): boolean {
  if (backoffWeight == null) return true
  if (previousAnchor == null) return false
  return Number(backoffWeight) === Number(previousAnchor)
}

/** About 20% off the previous load, rounded to the nearest 5. */
export function suggestedDropWeight(weight: number | null): number | null {
  if (weight == null || !(weight > 0)) return null
  return Math.round((weight * 0.8) / 5) * 5
}

export function nextDropWeight(
  backoffWeight: number | null,
  existingDrops: { weight: number | null }[],
): number | null {
  const last = [...existingDrops].reverse().find((set) => set.weight != null && set.weight > 0)
  return suggestedDropWeight(last?.weight ?? backoffWeight)
}

/** Epley: weight × (1 + reps / 30). */
export function epley1rm(weight: number, reps: number): number | null {
  if (!Number.isFinite(weight) || !Number.isFinite(reps)) return null
  if (weight <= 0 || reps <= 0) return null
  return weight * (1 + reps / 30)
}

export interface EstimateSet {
  weight: number | null
  reps: number | null
  kind?: string | null
  unit?: string | null
  completed?: boolean
}

export interface EstimateHit {
  estimate: number
  weight: number
  reps: number
  unit: string
}

export function bestEstimated1rm(sets: EstimateSet[], unit?: string): EstimateHit | null {
  let best: EstimateHit | null = null
  for (const set of sets) {
    if (set.kind === 'warmup') continue
    if (set.completed === false) continue
    if (unit && (set.unit ?? 'lb') !== unit) continue
    if (set.weight == null || set.reps == null) continue
    const estimate = epley1rm(Number(set.weight), Number(set.reps))
    if (estimate == null) continue
    if (!best || estimate > best.estimate) {
      best = {
        estimate,
        weight: Number(set.weight),
        reps: Number(set.reps),
        unit: set.unit ?? 'lb',
      }
    }
  }
  return best
}

export function heaviestWeight(sets: EstimateSet[], unit: string): number | null {
  let best: number | null = null
  for (const set of sets) {
    if (set.kind === 'warmup') continue
    if (set.completed === false) continue
    if ((set.unit ?? 'lb') !== unit) continue
    if (set.weight == null || !(Number(set.weight) > 0)) continue
    const weight = Number(set.weight)
    if (best == null || weight > best) best = weight
  }
  return best
}

export interface DatedSet extends EstimateSet {
  date: string
}

export interface DailyEstimate {
  date: string
  estimate: number
  weight: number
  reps: number
}

export function dailyBestEstimates(sets: DatedSet[], unit: string): DailyEstimate[] {
  const byDate = new Map<string, DailyEstimate>()
  for (const set of sets) {
    if (set.kind === 'warmup') continue
    if (set.completed === false) continue
    if ((set.unit ?? 'lb') !== unit) continue
    if (set.weight == null || set.reps == null) continue
    const estimate = epley1rm(Number(set.weight), Number(set.reps))
    if (estimate == null) continue
    const current = byDate.get(set.date)
    if (!current || estimate > current.estimate) {
      byDate.set(set.date, {
        date: set.date,
        estimate,
        weight: Number(set.weight),
        reps: Number(set.reps),
      })
    }
  }
  return [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date))
}

export function nextSplit(last: SplitDay | null | undefined): CycleDay {
  if (!last || last === 'other') return SPLIT_CYCLE[0]
  const index = SPLIT_CYCLE.indexOf(last as CycleDay)
  if (index === -1) return SPLIT_CYCLE[0]
  return SPLIT_CYCLE[(index + 1) % SPLIT_CYCLE.length]
}

export interface SplitSource {
  split: SplitDay | null
  performed_on: string
  started_at?: string | null
  created_at?: string | null
}

export function mostRecentSplit(workouts: SplitSource[]): SplitDay | null {
  if (workouts.length === 0) return null
  const sorted = [...workouts].sort((a, b) => {
    if (a.performed_on !== b.performed_on) return b.performed_on.localeCompare(a.performed_on)
    const aTime = a.started_at ?? a.created_at ?? ''
    const bTime = b.started_at ?? b.created_at ?? ''
    return bTime.localeCompare(aTime)
  })
  return sorted[0]?.split ?? null
}

export function selectNextSplit(workouts: SplitSource[]): CycleDay {
  return nextSplit(mostRecentSplit(workouts))
}

export interface OrderedSet {
  id: string
  position: number
  parent_set_id: string | null
}

export interface SetFieldPatch {
  reps?: number | null
  weight?: number | null
  completed?: boolean
}

/**
 * Only fields that actually changed. A blur that updates weight must not send
 * `reps: null`, or a slower request can wipe reps that completion just stored.
 */
export function buildSetPatch(input: {
  nextReps: number | null
  nextWeight: number | null
  reps: number | null
  weight: number | null
  completed?: boolean
}): SetFieldPatch | null {
  const patch: SetFieldPatch = {}
  if (input.nextReps !== input.reps) patch.reps = input.nextReps
  if (!sameNumber(input.nextWeight, input.weight)) patch.weight = input.nextWeight
  if (input.completed !== undefined) patch.completed = input.completed
  return Object.keys(patch).length === 0 ? null : patch
}

function sameNumber(left: number | null, right: number | null): boolean {
  if (left == null || right == null) return left === right
  return Number(left) === Number(right)
}

/** Completing an empty reps field logs the prescribed target. Unchecking keeps a typed value. */
export function repsForToggle(
  draftReps: number | null,
  targetReps: number | null,
  currentlyCompleted: boolean,
): number | null {
  if (draftReps != null) return draftReps
  if (currentlyCompleted) return null
  return targetReps
}

/** Parents in position order, with drop segments directly under their back-off. */
export function orderSets<T extends OrderedSet>(sets: T[]): T[] {
  const parents = sets
    .filter((set) => set.parent_set_id == null)
    .sort((a, b) => a.position - b.position || a.id.localeCompare(b.id))
  const children = sets.filter((set) => set.parent_set_id != null)
  const used = new Set<string>()
  const ordered: T[] = []
  for (const parent of parents) {
    ordered.push(parent)
    used.add(parent.id)
    const kids = children
      .filter((set) => set.parent_set_id === parent.id)
      .sort((a, b) => a.position - b.position || a.id.localeCompare(b.id))
    for (const kid of kids) {
      ordered.push(kid)
      used.add(kid.id)
    }
  }
  const leftovers = sets
    .filter((set) => !used.has(set.id))
    .sort((a, b) => a.position - b.position || a.id.localeCompare(b.id))
  return [...ordered, ...leftovers]
}
