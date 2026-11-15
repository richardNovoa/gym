import type { SetKind, SplitDay } from './training'

export interface Exercise {
  id: string
  owner_id: string | null
  source_id: string | null
  name: string
  force: string | null
  level: string | null
  mechanic: string | null
  equipment: string | null
  category: string | null
  primary_muscles: string[]
  secondary_muscles: string[]
  instructions: string[]
  images: string[]
}

export interface SetRecord {
  id: string
  workout_exercise_id: string
  position: number
  kind: SetKind
  target_reps: number | null
  reps: number | null
  weight: number | null
  unit: string
  rir: number | null
  parent_set_id: string | null
  completed: boolean
}

export interface WorkoutExercise {
  id: string
  workout_id: string
  exercise_id: string
  position: number
  notes: string | null
  exercise: Exercise
  sets: SetRecord[]
}

export interface CardioSession {
  id: string
  workout_id: string | null
  activity: string
  duration_seconds: number | null
  distance: number | null
  distance_unit: string
  notes: string | null
}

export interface WorkoutSummary {
  id: string
  name: string | null
  split: SplitDay | null
  performed_on: string
  started_at: string | null
  ended_at: string | null
  notes: string | null
  created_at: string
  exercises: { id: string; position: number; name: string }[]
  cardio: CardioSession | null
}

export interface WorkoutDetail {
  id: string
  name: string | null
  split: SplitDay | null
  performed_on: string
  started_at: string | null
  ended_at: string | null
  notes: string | null
  created_at: string
  exercises: WorkoutExercise[]
  cardio: CardioSession | null
}

export interface Profile {
  id: string
  name: string | null
  avatar_url: string | null
}

export interface ProgressEntry {
  exerciseId: string
  exerciseName: string
  date: string
  weight: number
  reps: number
  unit: string
  kind: SetKind
}

export interface SetPatch {
  reps?: number | null
  weight?: number | null
  unit?: string
  completed?: boolean
  target_reps?: number | null
  rir?: number | null
}
