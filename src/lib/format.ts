import { SPLIT_CYCLE, type CycleDay, type SetKind, type SplitDay } from './training'

export const SPLIT_LABEL: Record<SplitDay, string> = {
  cardio: 'Cardio',
  chest_back: 'Chest & Back',
  shoulders_arms: 'Shoulders & Arms',
  legs: 'Legs',
  rest: 'Rest',
  other: 'Other',
}

export const SPLIT_BLURB: Record<CycleDay, string> = {
  cardio: 'Activity, duration, and distance.',
  chest_back: 'Press and pull. Pyramid, then a back-off at the 8-rep weight.',
  shoulders_arms: 'Delts, biceps, and triceps. Same pyramid, same back-off.',
  legs: 'Squat, hinge, and single-leg work.',
  rest: 'Nothing to lift. Logging it moves the cycle on to cardio.',
}

export const SPLIT_SUGGESTIONS: Record<CycleDay, string[]> = {
  cardio: [],
  chest_back: ['chest', 'lats', 'back'],
  shoulders_arms: ['shoulders', 'biceps', 'triceps'],
  legs: ['quadriceps', 'hamstrings', 'glutes'],
  rest: [],
}

export function cycleIndex(day: CycleDay): number {
  return SPLIT_CYCLE.indexOf(day) + 1
}

export function isCycleDay(split: SplitDay | null | undefined): split is CycleDay {
  return split != null && (SPLIT_CYCLE as readonly string[]).includes(split)
}

export function greeting(date = new Date()): string {
  const hour = date.getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

export function todayISO(date = new Date()): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function parseISODate(iso: string): Date {
  const [year, month, day] = iso.split('-').map(Number)
  return new Date(year, (month ?? 1) - 1, day ?? 1)
}

export function formatWeekday(date = new Date()): string {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  }).format(date)
}

export function formatLongDate(iso: string): string {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  }).format(parseISODate(iso))
}

export function formatShortDate(iso: string): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
  }).format(parseISODate(iso))
}

export function formatMonth(iso: string): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    year: 'numeric',
  }).format(parseISODate(iso))
}

export function formatDuration(seconds: number | null): string {
  if (seconds == null || seconds < 0) return '—'
  const minutes = Math.floor(seconds / 60)
  const remain = seconds % 60
  if (minutes === 0) return `${remain}s`
  if (remain === 0) return `${minutes} min`
  return `${minutes}m ${remain}s`
}

export function formatNumber(value: number): string {
  if (Number.isInteger(value)) return String(value)
  const rounded = Math.round(value * 10) / 10
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1)
}

export function format1rm(value: number): string {
  return String(Math.round(value))
}

export function firstName(name: string | null | undefined): string | null {
  const trimmed = name?.trim()
  if (!trimmed) return null
  return trimmed.split(/\s+/)[0] ?? null
}

export function kindLabel(kind: SetKind, targetReps: number | null, rir: number | null): string {
  if (kind === 'pyramid') {
    const reps = targetReps ?? '—'
    return rir == null ? `${reps}` : `${reps} · ${rir} RIR`
  }
  if (kind === 'backoff') return 'Back-off'
  if (kind === 'drop') return 'Drop'
  if (kind === 'warmup') return 'Warm-up'
  return 'Set'
}

export function splitList(value: string): string[] {
  return value
    .split(/[,/\n]/)
    .map((part) => part.trim())
    .filter(Boolean)
}
