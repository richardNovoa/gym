import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../auth/AuthProvider'
import { Thumb } from '../components/ExercisePicker'
import { Shell } from '../components/Shell'
import { Button, Notice, Sheet, TextArea, TextField } from '../components/ui'
import { createExercise, deleteExercise, fetchExercises, fetchWorkouts } from '../lib/api'
import { isCycleDay, splitList } from '../lib/format'
import { filterExercises } from '../lib/search'
import { selectNextSplit } from '../lib/training'
import type { Exercise } from '../lib/types'

const CHIPS = ['chest', 'back', 'shoulders', 'biceps', 'quadriceps', 'barbell', 'dumbbell']

export function LibraryPage() {
  const { user } = useAuth()
  const userId = user?.id ?? ''
  const queryClient = useQueryClient()
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState<Exercise | null>(null)
  const [adding, setAdding] = useState(false)
  const exercises = useQuery({ queryKey: ['exercises'], queryFn: fetchExercises })
  const workouts = useQuery({ queryKey: ['workouts'], queryFn: fetchWorkouts })
  const next = selectNextSplit(workouts.data ?? [])
  const matches = filterExercises(exercises.data ?? [], query, userId)
  const visible = matches.slice(0, query.trim() ? 80 : 30)

  return (
    <Shell highlight={isCycleDay(next) ? next : null}>
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl tracking-tight">Library</h1>
          <p className="mt-2 text-muted">Search by name, muscle, or equipment.</p>
        </div>
      </div>
      <input
        className="field mt-5"
        placeholder="Bench, lats, dumbbell…"
        aria-label="Search exercises"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
      />
      <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
        {CHIPS.map((chip) => (
          <button
            key={chip}
            type="button"
            className="tap h-10 shrink-0 rounded-full border border-line px-3 text-sm capitalize text-muted"
            onClick={() => setQuery(chip)}
          >
            {chip}
          </button>
        ))}
      </div>

      {exercises.isLoading ? (
        <p className="mt-8 text-muted">Loading exercises…</p>
      ) : exercises.isError ? (
        <div className="mt-6">
          <Notice>{(exercises.error as Error).message}</Notice>
        </div>
      ) : (
        <>
          {(exercises.data ?? []).length === 0 ? (
            <p className="mt-6 text-muted">
              The shared catalog is empty. Run the seed script, or add an exercise of your own.
            </p>
          ) : null}
          <ul className="mt-4 divide-y divide-line">
            {visible.map((exercise) => (
              <li key={exercise.id}>
                <button
                  type="button"
                  className="tap flex w-full items-center gap-3 py-3 text-left"
                  onClick={() => setOpen(exercise)}
                >
                  <Thumb exercise={exercise} />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      <span className="truncate text-base">{exercise.name}</span>
                      {exercise.owner_id === userId ? (
                        <span className="rounded-full bg-accent px-2 py-0.5 text-xs text-accent-ink">Yours</span>
                      ) : null}
                    </span>
                    <span className="block truncate text-sm text-muted">
                      {[exercise.equipment, exercise.primary_muscles.slice(0, 3).join(', ')]
                        .filter(Boolean)
                        .join(' · ')}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
          {matches.length === 0 && (exercises.data ?? []).length > 0 ? (
            <p className="mt-4 text-muted">Nothing matches that.</p>
          ) : null}
          {matches.length > visible.length ? (
            <p className="mt-3 text-sm text-muted">
              Showing {visible.length} of {matches.length}.
            </p>
          ) : null}
        </>
      )}

      <button
        type="button"
        className="tap mt-6 h-14 w-full rounded-2xl bg-ink text-lg font-medium text-bg"
        onClick={() => setAdding(true)}
      >
        Add custom exercise
      </button>

      {open ? (
        <ExerciseDetail
          exercise={open}
          owned={open.owner_id === userId}
          onClose={() => setOpen(null)}
          onDeleted={async () => {
            setOpen(null)
            await queryClient.invalidateQueries({ queryKey: ['exercises'] })
          }}
        />
      ) : null}
      {adding ? (
        <AddExercise
          userId={userId}
          onClose={() => setAdding(false)}
          onCreated={async () => {
            setAdding(false)
            await queryClient.invalidateQueries({ queryKey: ['exercises'] })
          }}
        />
      ) : null}
    </Shell>
  )
}

function ExerciseDetail({
  exercise,
  owned,
  onClose,
  onDeleted,
}: {
  exercise: Exercise
  owned: boolean
  onClose: () => void
  onDeleted: () => Promise<void>
}) {
  const remove = useMutation({
    mutationFn: () => deleteExercise(exercise.id),
    onSuccess: onDeleted,
  })
  return (
    <Sheet title={exercise.name} onClose={onClose}>
      {exercise.images[0] ? (
        <img src={exercise.images[0]} alt="" className="mb-4 h-48 w-full rounded-2xl object-cover" />
      ) : null}
      <p className="text-sm text-muted">
        {[exercise.level, exercise.equipment, exercise.mechanic, exercise.force].filter(Boolean).join(' · ')}
      </p>
      <p className="mt-3">
        <span className="text-muted">Primary. </span>
        {exercise.primary_muscles.join(', ') || '—'}
      </p>
      {exercise.secondary_muscles.length > 0 ? (
        <p className="mt-1">
          <span className="text-muted">Secondary. </span>
          {exercise.secondary_muscles.join(', ')}
        </p>
      ) : null}
      {exercise.instructions.length > 0 ? (
        <ol className="mt-4 list-decimal space-y-2 pl-5 text-base leading-relaxed">
          {exercise.instructions.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      ) : null}
      {owned ? (
        <div className="mt-6">
          {remove.isError ? <Notice>{(remove.error as Error).message}</Notice> : null}
          <Button variant="ghost" disabled={remove.isPending} onClick={() => remove.mutate()}>
            {remove.isPending ? 'Removing…' : 'Delete this exercise'}
          </Button>
        </div>
      ) : null}
    </Sheet>
  )
}

function AddExercise({
  userId,
  onClose,
  onCreated,
}: {
  userId: string
  onClose: () => void
  onCreated: () => Promise<void>
}) {
  const [name, setName] = useState('')
  const [equipment, setEquipment] = useState('')
  const [muscles, setMuscles] = useState('')
  const [instructions, setInstructions] = useState('')
  const [error, setError] = useState<string | null>(null)
  const create = useMutation({
    mutationFn: () =>
      createExercise(userId, {
        name,
        equipment,
        primaryMuscles: splitList(muscles),
        instructions: instructions
          .split('\n')
          .map((line) => line.trim())
          .filter(Boolean),
      }),
    onSuccess: onCreated,
    onError: (err: Error) => setError(err.message),
  })

  return (
    <Sheet title="Custom exercise" onClose={onClose}>
      <form
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault()
          setError(null)
          if (!name.trim()) {
            setError('Name the exercise.')
            return
          }
          if (splitList(muscles).length === 0) {
            setError('Add at least one muscle.')
            return
          }
          create.mutate()
        }}
      >
        <TextField label="Name" value={name} onChange={(event) => setName(event.target.value)} required />
        <TextField
          label="Equipment"
          value={equipment}
          onChange={(event) => setEquipment(event.target.value)}
          placeholder="Dumbbell"
        />
        <TextField
          label="Primary muscles"
          value={muscles}
          onChange={(event) => setMuscles(event.target.value)}
          placeholder="chest, triceps"
          hint="Separate muscles with commas."
        />
        <TextArea
          label="Instructions"
          value={instructions}
          onChange={(event) => setInstructions(event.target.value)}
          placeholder="One step per line"
        />
        {error ? <Notice>{error}</Notice> : null}
        <Button type="submit" disabled={create.isPending}>
          {create.isPending ? 'Saving…' : 'Save exercise'}
        </Button>
      </form>
    </Sheet>
  )
}
