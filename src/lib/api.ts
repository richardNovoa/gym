import { todayISO } from './format'
import { requireClient } from './supabase'
import { defaultStrengthSets, orderSets, type SetKind, type SplitDay } from './training'
import type {
  CardioSession,
  Exercise,
  Profile,
  ProgressEntry,
  SetPatch,
  SetRecord,
  WorkoutDetail,
  WorkoutExercise,
  WorkoutSummary,
} from './types'

const SPLITS = new Set<SplitDay>(['cardio', 'chest_back', 'shoulders_arms', 'legs', 'rest', 'other'])
const KINDS = new Set<SetKind>(['warmup', 'pyramid', 'backoff', 'drop', 'straight'])

function fail(error: { message: string } | null): void {
  if (error) throw new Error(error.message)
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (Array.isArray(value)) return asRecord(value[0])
  if (value && typeof value === 'object') return value as Record<string, unknown>
  return null
}

function str(value: unknown): string | null {
  return typeof value === 'string' ? value : null
}

function num(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : null
  }
  return null
}

function int(value: unknown): number | null {
  const parsed = num(value)
  return parsed == null ? null : Math.trunc(parsed)
}

function strArray(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value.filter((item): item is string => typeof item === 'string')
}

function asSplit(value: unknown): SplitDay | null {
  return typeof value === 'string' && SPLITS.has(value as SplitDay) ? (value as SplitDay) : null
}

function asKind(value: unknown): SetKind {
  return typeof value === 'string' && KINDS.has(value as SetKind) ? (value as SetKind) : 'straight'
}

function mapExercise(value: unknown): Exercise | null {
  const row = asRecord(value)
  if (!row || typeof row.id !== 'string' || typeof row.name !== 'string') return null
  return {
    id: row.id,
    owner_id: str(row.owner_id),
    source_id: str(row.source_id),
    name: row.name,
    force: str(row.force),
    level: str(row.level),
    mechanic: str(row.mechanic),
    equipment: str(row.equipment),
    category: str(row.category),
    primary_muscles: strArray(row.primary_muscles),
    secondary_muscles: strArray(row.secondary_muscles),
    instructions: strArray(row.instructions),
    images: strArray(row.images),
  }
}

function mapSet(value: unknown): SetRecord | null {
  const row = asRecord(value)
  if (!row || typeof row.id !== 'string') return null
  return {
    id: row.id,
    workout_exercise_id: str(row.workout_exercise_id) ?? '',
    position: int(row.position) ?? 0,
    kind: asKind(row.kind),
    target_reps: int(row.target_reps),
    reps: int(row.reps),
    weight: num(row.weight),
    unit: str(row.unit) ?? 'lb',
    rir: int(row.rir),
    parent_set_id: str(row.parent_set_id),
    completed: row.completed === true,
  }
}

function mapCardio(value: unknown): CardioSession | null {
  const row = asRecord(value)
  if (!row || typeof row.id !== 'string') return null
  return {
    id: row.id,
    workout_id: str(row.workout_id),
    activity: str(row.activity) ?? 'Cardio',
    duration_seconds: int(row.duration_seconds),
    distance: num(row.distance),
    distance_unit: str(row.distance_unit) ?? 'mi',
    notes: str(row.notes),
  }
}

const EXERCISE_COLUMNS =
  'id, owner_id, source_id, name, force, level, mechanic, equipment, category, primary_muscles, secondary_muscles, instructions, images'

export async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await requireClient()
    .from('profiles')
    .select('id, name, avatar_url')
    .eq('id', userId)
    .maybeSingle()
  fail(error)
  const row = asRecord(data)
  if (!row || typeof row.id !== 'string') return null
  return { id: row.id, name: str(row.name), avatar_url: str(row.avatar_url) }
}

export async function fetchExercises(): Promise<Exercise[]> {
  const { data, error } = await requireClient()
    .from('exercises')
    .select(EXERCISE_COLUMNS)
    .order('name')
    .limit(2000)
  fail(error)
  return (data ?? []).map(mapExercise).filter((row): row is Exercise => row != null)
}

export async function createExercise(
  userId: string,
  input: {
    name: string
    equipment: string
    primaryMuscles: string[]
    instructions: string[]
  },
): Promise<string> {
  const { data, error } = await requireClient()
    .from('exercises')
    .insert({
      owner_id: userId,
      name: input.name.trim(),
      equipment: input.equipment.trim() || null,
      primary_muscles: input.primaryMuscles,
      secondary_muscles: [],
      instructions: input.instructions,
      category: 'strength',
      images: [],
    })
    .select('id')
    .single()
  fail(error)
  const row = asRecord(data)
  if (!row || typeof row.id !== 'string') throw new Error('Exercise was not created.')
  return row.id
}

export async function deleteExercise(id: string): Promise<void> {
  const { error } = await requireClient().from('exercises').delete().eq('id', id)
  if (error) {
    if (error.code === '23503') {
      throw new Error('This exercise is still in a workout, so it stays in the library.')
    }
    throw new Error(error.message)
  }
}

export async function fetchWorkouts(): Promise<WorkoutSummary[]> {
  const { data, error } = await requireClient()
    .from('workouts')
    .select(
      `
      id, name, split, performed_on, started_at, ended_at, notes, created_at,
      workout_exercises (
        id, position,
        exercise:exercises ( name )
      ),
      cardio_sessions (
        id, workout_id, activity, duration_seconds, distance, distance_unit, notes
      )
    `,
    )
    .order('performed_on', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(200)
  fail(error)
  return (data ?? []).map(mapSummary).filter((row): row is WorkoutSummary => row != null)
}

function mapSummary(value: unknown): WorkoutSummary | null {
  const row = asRecord(value)
  if (!row || typeof row.id !== 'string') return null
  const exercises = (Array.isArray(row.workout_exercises) ? row.workout_exercises : [])
    .map((item) => {
      const entry = asRecord(item)
      const exercise = mapExerciseName(entry?.exercise)
      if (!entry || typeof entry.id !== 'string' || !exercise) return null
      return { id: entry.id, position: int(entry.position) ?? 0, name: exercise }
    })
    .filter((item): item is { id: string; position: number; name: string } => item != null)
    .sort((a, b) => a.position - b.position)
  const cardioList = Array.isArray(row.cardio_sessions) ? row.cardio_sessions : []
  return {
    id: row.id,
    name: str(row.name),
    split: asSplit(row.split),
    performed_on: str(row.performed_on) ?? todayISO(),
    started_at: str(row.started_at),
    ended_at: str(row.ended_at),
    notes: str(row.notes),
    created_at: str(row.created_at) ?? '',
    exercises,
    cardio: mapCardio(cardioList[0]),
  }
}

function mapExerciseName(value: unknown): string | null {
  const row = asRecord(value)
  return row && typeof row.name === 'string' ? row.name : null
}

export async function fetchWorkout(id: string): Promise<WorkoutDetail | null> {
  const { data, error } = await requireClient()
    .from('workouts')
    .select(
      `
      id, name, split, performed_on, started_at, ended_at, notes, created_at,
      workout_exercises (
        id, workout_id, exercise_id, position, notes,
        exercise:exercises ( ${EXERCISE_COLUMNS} ),
        sets (
          id, workout_exercise_id, position, kind, target_reps, reps, weight, unit, rir, parent_set_id, completed
        )
      ),
      cardio_sessions (
        id, workout_id, activity, duration_seconds, distance, distance_unit, notes
      )
    `,
    )
    .eq('id', id)
    .maybeSingle()
  fail(error)
  return mapDetail(data)
}

function mapDetail(value: unknown): WorkoutDetail | null {
  const row = asRecord(value)
  if (!row || typeof row.id !== 'string') return null
  const exercises = (Array.isArray(row.workout_exercises) ? row.workout_exercises : [])
    .map(mapWorkoutExercise)
    .filter((item): item is WorkoutExercise => item != null)
    .sort((a, b) => a.position - b.position)
  const cardioList = Array.isArray(row.cardio_sessions) ? row.cardio_sessions : []
  return {
    id: row.id,
    name: str(row.name),
    split: asSplit(row.split),
    performed_on: str(row.performed_on) ?? todayISO(),
    started_at: str(row.started_at),
    ended_at: str(row.ended_at),
    notes: str(row.notes),
    created_at: str(row.created_at) ?? '',
    exercises,
    cardio: mapCardio(cardioList[0]),
  }
}

function mapWorkoutExercise(value: unknown): WorkoutExercise | null {
  const row = asRecord(value)
  const exercise = mapExercise(row?.exercise)
  if (!row || typeof row.id !== 'string' || !exercise) return null
  const sets = orderSets(
    (Array.isArray(row.sets) ? row.sets : [])
      .map(mapSet)
      .filter((item): item is SetRecord => item != null),
  )
  return {
    id: row.id,
    workout_id: str(row.workout_id) ?? '',
    exercise_id: str(row.exercise_id) ?? exercise.id,
    position: int(row.position) ?? 0,
    notes: str(row.notes),
    exercise,
    sets,
  }
}

export async function createWorkout(input: {
  userId: string
  split: SplitDay
  name: string
  finish?: boolean
}): Promise<string> {
  const now = new Date().toISOString()
  const { data, error } = await requireClient()
    .from('workouts')
    .insert({
      user_id: input.userId,
      name: input.name,
      split: input.split,
      performed_on: todayISO(),
      started_at: now,
      ended_at: input.finish ? now : null,
    })
    .select('id')
    .single()
  fail(error)
  const row = asRecord(data)
  if (!row || typeof row.id !== 'string') throw new Error('Workout was not created.')
  return row.id
}

export async function createCardioWorkout(userId: string): Promise<string> {
  const id = await createWorkout({ userId, split: 'cardio', name: 'Cardio' })
  const { error } = await requireClient().from('cardio_sessions').insert({
    workout_id: id,
    user_id: userId,
    activity: 'Run',
    distance_unit: 'mi',
  })
  if (error) {
    await requireClient().from('workouts').delete().eq('id', id)
    throw new Error(error.message)
  }
  return id
}

export async function ensureCardioSession(workoutId: string, userId: string): Promise<void> {
  const { data, error } = await requireClient()
    .from('cardio_sessions')
    .select('id')
    .eq('workout_id', workoutId)
    .limit(1)
  fail(error)
  if (data && data.length > 0) return
  const { error: insertError } = await requireClient().from('cardio_sessions').insert({
    workout_id: workoutId,
    user_id: userId,
    activity: 'Run',
    distance_unit: 'mi',
  })
  fail(insertError)
}

export async function updateWorkout(
  id: string,
  patch: { notes?: string | null; ended_at?: string | null; name?: string },
): Promise<void> {
  const { error } = await requireClient().from('workouts').update(patch).eq('id', id)
  fail(error)
}

export async function deleteWorkout(id: string): Promise<void> {
  const { error } = await requireClient().from('workouts').delete().eq('id', id)
  fail(error)
}

export async function addExerciseToWorkout(
  workoutId: string,
  exerciseId: string,
  position: number,
): Promise<void> {
  const { data, error } = await requireClient()
    .from('workout_exercises')
    .insert({ workout_id: workoutId, exercise_id: exerciseId, position })
    .select('id')
    .single()
  fail(error)
  const row = asRecord(data)
  if (!row || typeof row.id !== 'string') throw new Error('Could not add that exercise.')
  const planned = defaultStrengthSets().map((set) => ({
    workout_exercise_id: row.id,
    position: set.position,
    kind: set.kind,
    target_reps: set.target_reps,
    rir: set.rir,
    unit: 'lb',
    completed: false,
  }))
  const { error: setError } = await requireClient().from('sets').insert(planned)
  if (setError) {
    await requireClient().from('workout_exercises').delete().eq('id', row.id)
    throw new Error(setError.message)
  }
}

export async function deleteWorkoutExercise(id: string): Promise<void> {
  const { error } = await requireClient().from('workout_exercises').delete().eq('id', id)
  fail(error)
}

export async function updateSet(id: string, patch: SetPatch): Promise<void> {
  const { error } = await requireClient().from('sets').update(patch).eq('id', id)
  fail(error)
}

export async function updateSetUnits(ids: string[], unit: string): Promise<void> {
  if (ids.length === 0) return
  const { error } = await requireClient().from('sets').update({ unit }).in('id', ids)
  fail(error)
}

export async function addStraightSet(
  workoutExerciseId: string,
  position: number,
  unit: string,
): Promise<void> {
  const { error } = await requireClient().from('sets').insert({
    workout_exercise_id: workoutExerciseId,
    position,
    kind: 'straight',
    unit,
    completed: false,
  })
  fail(error)
}

export async function addDropSet(input: {
  workoutExerciseId: string
  parentSetId: string
  position: number
  weight: number | null
  unit: string
}): Promise<void> {
  const { error } = await requireClient().from('sets').insert({
    workout_exercise_id: input.workoutExerciseId,
    parent_set_id: input.parentSetId,
    position: input.position,
    kind: 'drop',
    weight: input.weight,
    unit: input.unit,
    completed: false,
  })
  fail(error)
}

export async function deleteSet(id: string): Promise<void> {
  const { error } = await requireClient().from('sets').delete().eq('id', id)
  fail(error)
}

export async function saveCardio(
  id: string,
  patch: {
    activity?: string
    duration_seconds?: number | null
    distance?: number | null
    distance_unit?: string
    notes?: string | null
  },
): Promise<void> {
  const { error } = await requireClient().from('cardio_sessions').update(patch).eq('id', id)
  fail(error)
}

export async function fetchProgress(): Promise<ProgressEntry[]> {
  const { data, error } = await requireClient()
    .from('sets')
    .select(
      `
      reps, weight, unit, kind, completed,
      workout_exercises!inner (
        exercise:exercises!inner ( id, name ),
        workouts!inner ( performed_on )
      )
    `,
    )
    .eq('completed', true)
    .limit(5000)
  fail(error)
  const entries: ProgressEntry[] = []
  for (const item of data ?? []) {
    const row = asRecord(item)
    const parent = asRecord(row?.workout_exercises)
    const exercise = asRecord(parent?.exercise)
    const workout = asRecord(parent?.workouts)
    const weight = num(row?.weight)
    const reps = int(row?.reps)
    if (!exercise || typeof exercise.id !== 'string' || typeof exercise.name !== 'string') continue
    if (!workout || typeof workout.performed_on !== 'string') continue
    if (weight == null || reps == null) continue
    entries.push({
      exerciseId: exercise.id,
      exerciseName: exercise.name,
      date: workout.performed_on,
      weight,
      reps,
      unit: str(row?.unit) ?? 'lb',
      kind: asKind(row?.kind),
    })
  }
  return entries
}
