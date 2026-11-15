import { useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { ExercisePicker } from '../components/ExercisePicker'
import { Notice } from '../components/ui'
import { parseOptionalInt, parseOptionalNumber, useDraft } from '../components/useDraft'
import {
  addDropSet,
  addExerciseToWorkout,
  addStraightSet,
  deleteSet,
  deleteWorkoutExercise,
  fetchWorkout,
  updateSet,
  updateSetUnits,
  updateWorkout,
} from '../lib/api'
import { SPLIT_LABEL, SPLIT_SUGGESTIONS, isCycleDay, kindLabel } from '../lib/format'
import { backoffShouldFollow, buildSetPatch, nextDropWeight, repsForToggle } from '../lib/training'
import type { SetPatch, SetRecord, WorkoutExercise } from '../lib/types'
import { useAuth } from '../auth/AuthProvider'

export function WorkoutLoggerPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [picker, setPicker] = useState(false)
  const workout = useQuery({
    queryKey: ['workout', id],
    queryFn: () => fetchWorkout(id),
    enabled: Boolean(id),
  })

  async function refresh() {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['workout', id] }),
      queryClient.invalidateQueries({ queryKey: ['workouts'] }),
      queryClient.invalidateQueries({ queryKey: ['progress'] }),
    ])
  }

  const addExercise = useMutation({
    mutationFn: (exerciseId: string) => {
      const position =
        (workout.data?.exercises ?? []).reduce((max, exercise) => Math.max(max, exercise.position), -1) + 1
      return addExerciseToWorkout(workout.data?.id ?? id, exerciseId, position)
    },
    onSuccess: async () => {
      setPicker(false)
      await refresh()
    },
  })

  const finish = useMutation({
    mutationFn: () => updateWorkout(id, { ended_at: new Date().toISOString() }),
    onSuccess: async () => {
      await refresh()
      navigate('/')
    },
  })

  if (workout.isLoading) {
    return (
      <main className="grid min-h-dvh place-items-center">
        <p className="font-display text-3xl">Loading the log</p>
      </main>
    )
  }

  if (workout.isError) {
    return (
      <main className="mx-auto max-w-lg px-5 py-10">
        <Notice>{(workout.error as Error).message}</Notice>
      </main>
    )
  }

  if (!workout.data) {
    return (
      <main className="mx-auto max-w-lg px-5 py-10">
        <p>That workout is gone.</p>
        <Link to="/" className="mt-4 inline-block text-muted">
          Back to today
        </Link>
      </main>
    )
  }

  const detail = workout.data
  if (detail.split === 'cardio') {
    return <Navigate to={`/cardio/${detail.id}`} replace />
  }
  const title = detail.split ? SPLIT_LABEL[detail.split] : detail.name || 'Workout'
  const suggestions = detail.split && isCycleDay(detail.split) ? SPLIT_SUGGESTIONS[detail.split] : []

  return (
    <main className="mx-auto min-h-dvh w-full max-w-lg px-5 pb-32">
      <header className="sticky top-0 z-10 -mx-5 flex items-center justify-between bg-bg/90 px-5 py-4 backdrop-blur">
        <Link to="/" className="tap text-sm text-muted">
          Today
        </Link>
        {detail.ended_at ? (
          <Link to="/" className="tap text-sm font-medium">
            Close
          </Link>
        ) : (
          <button
            type="button"
            className="tap text-sm font-medium disabled:opacity-50"
            disabled={finish.isPending}
            onClick={() => finish.mutate()}
          >
            {finish.isPending ? 'Finishing…' : 'Finish'}
          </button>
        )}
      </header>
      <p className="text-sm text-muted">{detail.ended_at ? 'Finished. Edits still save.' : 'In progress'}</p>
      <h1 className="font-display text-4xl leading-none tracking-tight">{title}</h1>
      <p className="mt-3 text-muted">12, 10, 8, 6, 4, then a back-off for 12 at the 8-rep weight.</p>
      {addExercise.isError || finish.isError ? (
        <div className="mt-4">
          <Notice>{((addExercise.error || finish.error) as Error).message}</Notice>
        </div>
      ) : null}

      <div className="mt-6 space-y-4">
        {detail.exercises.length === 0 ? (
          <p className="rounded-3xl border border-dashed border-line px-4 py-8 text-center text-muted">
            Add the first exercise. Each one starts as the pyramid plus a back-off.
          </p>
        ) : (
          detail.exercises.map((exercise) => (
            <ExerciseBlock key={exercise.id} exercise={exercise} onChange={refresh} />
          ))
        )}
      </div>

      <NotesField
        initial={detail.notes ?? ''}
        onSave={async (notes) => {
          await updateWorkout(id, { notes })
        }}
      />

      <div
        className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-bg/95 px-5 py-3 backdrop-blur"
        style={{ paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom))' }}
      >
        <div className="mx-auto max-w-lg">
          <button
            type="button"
            className="tap h-14 w-full rounded-2xl bg-accent text-lg font-medium text-accent-ink"
            onClick={() => setPicker(true)}
          >
            Add exercise
          </button>
        </div>
      </div>

      {picker && user ? (
        <ExercisePicker
          userId={user.id}
          suggestions={suggestions}
          busy={addExercise.isPending}
          onClose={() => setPicker(false)}
          onPick={(exercise) => addExercise.mutate(exercise.id)}
        />
      ) : null}
    </main>
  )
}

function NotesField({ initial, onSave }: { initial: string; onSave: (notes: string) => Promise<void> }) {
  const draft = useDraft(initial)
  return (
    <label className="mt-6 block">
      <span className="text-sm text-muted">Notes</span>
      <textarea
        className="mt-2 min-h-24 w-full rounded-2xl border border-line bg-elev px-4 py-3 text-base outline-none focus:border-transparent focus:shadow-[0_0_0_2px_var(--accent)]"
        value={draft.draft}
        onChange={(event) => draft.setDraft(event.target.value)}
        onFocus={draft.onFocus}
        onBlur={() => {
          draft.onBlur()
          if (draft.draft !== initial) void onSave(draft.draft)
        }}
      />
    </label>
  )
}

function ExerciseBlock({
  exercise,
  onChange,
}: {
  exercise: WorkoutExercise
  onChange: () => Promise<void>
}) {
  const [error, setError] = useState<string | null>(null)
  const pending = useRef(Promise.resolve())
  const unit = exercise.sets[0]?.unit === 'kg' ? 'kg' : 'lb'

  function enqueue(action: () => Promise<void>) {
    const job = pending.current.then(action, action)
    pending.current = job.then(
      () => undefined,
      () => undefined,
    )
    return job
  }

  async function run(action: () => Promise<void>) {
    setError(null)
    try {
      await action()
      await onChange()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save that set.')
    }
  }

  function save(set: SetRecord, patch: SetPatch) {
    return enqueue(() =>
      run(async () => {
        await updateSet(set.id, patch)
        if (set.kind === 'pyramid' && set.target_reps === 8 && patch.weight !== undefined) {
          const backoff = exercise.sets.find((item) => item.kind === 'backoff' && item.parent_set_id == null)
          if (backoff && backoffShouldFollow(set.weight, backoff.weight)) {
            await updateSet(backoff.id, { weight: patch.weight })
          }
        }
      }),
    )
  }

  const nextPosition = exercise.sets.reduce((max, set) => Math.max(max, set.position), -1) + 1

  return (
    <section className="rounded-3xl border border-line bg-elev p-4 shadow-card">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-medium leading-tight">{exercise.exercise.name}</h2>
          <p className="mt-1 text-sm text-muted">
            {[exercise.exercise.equipment, exercise.exercise.primary_muscles.slice(0, 2).join(', ')]
              .filter(Boolean)
              .join(' · ')}
          </p>
        </div>
        <button
          type="button"
          className="tap shrink-0 text-sm text-muted"
          onClick={() => run(() => deleteWorkoutExercise(exercise.id))}
        >
          Remove
        </button>
      </div>
      <div className="mt-3 flex gap-2" role="group" aria-label="Weight unit">
        {(['lb', 'kg'] as const).map((option) => (
          <button
            key={option}
            type="button"
            aria-pressed={unit === option}
            className={`tap h-10 rounded-full px-4 text-sm ${
              unit === option ? 'bg-ink text-bg' : 'text-muted'
            }`}
            onClick={() => run(() => updateSetUnits(exercise.sets.map((set) => set.id), option))}
          >
            {option}
          </button>
        ))}
      </div>
      <div className="mt-2">
        {exercise.sets.map((set) => (
          <SetRow
            key={set.id}
            set={set}
            onSave={(patch) => save(set, patch)}
            onDelete={() => run(() => deleteSet(set.id))}
            onAddDrop={
              set.kind === 'backoff' && set.parent_set_id == null
                ? () => {
                    const drops = exercise.sets.filter((item) => item.parent_set_id === set.id)
                    return run(() =>
                      addDropSet({
                        workoutExerciseId: exercise.id,
                        parentSetId: set.id,
                        position: nextPosition,
                        weight: nextDropWeight(set.weight, drops),
                        unit: set.unit,
                      }),
                    )
                  }
                : undefined
            }
          />
        ))}
      </div>
      {error ? (
        <div className="mt-3">
          <Notice>{error}</Notice>
        </div>
      ) : null}
      <button
        type="button"
        className="tap mt-2 h-12 w-full rounded-2xl border border-line text-sm"
        onClick={() => run(() => addStraightSet(exercise.id, nextPosition, unit))}
      >
        Add set
      </button>
    </section>
  )
}

function SetRow({
  set,
  onSave,
  onDelete,
  onAddDrop,
}: {
  set: SetRecord
  onSave: (patch: SetPatch) => void
  onDelete: () => void
  onAddDrop?: () => void
}) {
  const reps = useDraft(set.reps == null ? '' : String(set.reps))
  const weight = useDraft(set.weight == null ? '' : String(set.weight))
  const skipBlur = useRef(false)
  const nested = set.parent_set_id != null

  function commit() {
    if (skipBlur.current) return
    const patch = buildSetPatch({
      nextReps: parseOptionalInt(reps.draft),
      nextWeight: parseOptionalNumber(weight.draft),
      reps: set.reps,
      weight: set.weight,
    })
    if (patch) onSave(patch)
  }

  return (
    <div className={nested ? 'ml-3 border-l border-line pl-3' : ''}>
      <div className="mt-3 flex items-center justify-between">
        <p className="text-sm text-muted">{kindLabel(set.kind, set.target_reps, set.rir)}</p>
        <button type="button" className="tap text-xs text-muted" onClick={onDelete}>
          Remove
        </button>
      </div>
      <div className="mt-1.5 grid grid-cols-[1fr_1fr_3.25rem] gap-2">
        <label className="relative">
          <span className="sr-only">Reps</span>
          <input
            inputMode="numeric"
            className="field pr-12 tabular-nums"
            placeholder={set.target_reps ? String(set.target_reps) : 'Reps'}
            aria-label={`${kindLabel(set.kind, set.target_reps, set.rir)} reps`}
            value={reps.draft}
            onChange={(event) => reps.setDraft(event.target.value)}
            onFocus={reps.onFocus}
            onBlur={() => {
              reps.onBlur()
              commit()
            }}
          />
          {set.target_reps != null ? (
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted">
              /{set.target_reps}
            </span>
          ) : null}
        </label>
        <label>
          <span className="sr-only">Weight</span>
          <input
            inputMode="decimal"
            className="field tabular-nums"
            placeholder="Weight"
            aria-label={`${kindLabel(set.kind, set.target_reps, set.rir)} weight in ${set.unit}`}
            value={weight.draft}
            onChange={(event) => weight.setDraft(event.target.value)}
            onFocus={weight.onFocus}
            onBlur={() => {
              weight.onBlur()
              commit()
            }}
          />
        </label>
        <button
          type="button"
          aria-pressed={set.completed}
          aria-label={set.completed ? 'Mark set incomplete' : 'Mark set complete'}
          className={`tap grid h-14 w-[3.25rem] place-items-center rounded-2xl border ${
            set.completed ? 'border-accent bg-accent text-accent-ink' : 'border-line bg-bg text-muted'
          }`}
          onPointerDown={() => {
            skipBlur.current = true
          }}
          onClick={() => {
            const nextReps = repsForToggle(parseOptionalInt(reps.draft), set.target_reps, set.completed)
            const nextWeight = parseOptionalNumber(weight.draft)
            if (nextReps != null) reps.setDraft(String(nextReps))
            const patch = buildSetPatch({
              nextReps,
              nextWeight,
              reps: set.reps,
              weight: set.weight,
              completed: !set.completed,
            })
            skipBlur.current = false
            if (patch) onSave(patch)
          }}
        >
          <CheckIcon />
        </button>
      </div>
      {onAddDrop ? (
        <button type="button" className="tap mt-2 h-12 w-full rounded-2xl text-sm text-muted" onClick={onAddDrop}>
          Add drop
        </button>
      ) : null}
    </div>
  )
}

function CheckIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path d="M4 9.2 7.2 12.5 14 5.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}
