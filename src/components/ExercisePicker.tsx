import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createExercise, fetchExercises } from '../lib/api'
import { filterExercises } from '../lib/search'
import type { Exercise } from '../lib/types'
import { splitList } from '../lib/format'
import { Button, Notice, Sheet, TextField } from './ui'

export function ExercisePicker({
  userId,
  suggestions,
  onPick,
  onClose,
  busy,
}: {
  userId: string
  suggestions: string[]
  onPick: (exercise: Exercise) => void
  onClose: () => void
  busy?: boolean
}) {
  const queryClient = useQueryClient()
  const exercises = useQuery({ queryKey: ['exercises'], queryFn: fetchExercises })
  const [query, setQuery] = useState('')
  const [custom, setCustom] = useState(false)
  const [name, setName] = useState('')
  const [equipment, setEquipment] = useState('')
  const [muscles, setMuscles] = useState('')
  const [error, setError] = useState<string | null>(null)

  const create = useMutation({
    mutationFn: () =>
      createExercise(userId, {
        name,
        equipment,
        primaryMuscles: splitList(muscles),
        instructions: [],
      }),
    onSuccess: async (id) => {
      await queryClient.invalidateQueries({ queryKey: ['exercises'] })
      onPick({
        id,
        owner_id: userId,
        source_id: null,
        name: name.trim(),
        force: null,
        level: null,
        mechanic: null,
        equipment: equipment.trim() || null,
        category: 'strength',
        primary_muscles: splitList(muscles),
        secondary_muscles: [],
        instructions: [],
        images: [],
      })
    },
    onError: (err: Error) => setError(err.message),
  })

  const matches = filterExercises(exercises.data ?? [], query, userId)
  const visible = matches.slice(0, query.trim() ? 60 : 24)

  return (
    <Sheet title="Add exercise" onClose={onClose}>
      <input
        className="field"
        placeholder="Search name, muscle, or equipment"
        value={query}
        autoFocus
        aria-label="Search exercises"
        onChange={(event) => setQuery(event.target.value)}
      />
      {suggestions.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {suggestions.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              className="tap h-10 rounded-full border border-line px-3 text-sm capitalize text-muted"
              onClick={() => setQuery(suggestion)}
            >
              {suggestion}
            </button>
          ))}
        </div>
      ) : null}
      {exercises.isError ? (
        <div className="mt-4">
          <Notice>{(exercises.error as Error).message}</Notice>
        </div>
      ) : null}
      <ul className="mt-4 divide-y divide-line">
        {visible.map((exercise) => (
          <li key={exercise.id}>
            <button
              type="button"
              disabled={busy}
              className="tap flex w-full items-center gap-3 py-3 text-left disabled:opacity-50"
              onClick={() => onPick(exercise)}
            >
              <Thumb exercise={exercise} />
              <span className="min-w-0">
                <span className="block truncate text-base">{exercise.name}</span>
                <span className="block truncate text-sm text-muted">
                  {[exercise.equipment, exercise.primary_muscles.slice(0, 2).join(', ')]
                    .filter(Boolean)
                    .join(' · ')}
                </span>
              </span>
            </button>
          </li>
        ))}
      </ul>
      {exercises.data && matches.length === 0 ? (
        <p className="mt-4 text-sm text-muted">Nothing matches that.</p>
      ) : null}
      {exercises.data && exercises.data.length === 0 ? (
        <p className="mt-4 text-sm leading-relaxed text-muted">
          The shared catalog is empty until the seed script runs. You can still add your own.
        </p>
      ) : null}
      {exercises.data && matches.length > visible.length ? (
        <p className="mt-3 text-sm text-muted">
          Showing {visible.length} of {matches.length}. Keep typing to narrow it.
        </p>
      ) : null}

      <div className="mt-6 border-t border-line pt-5">
        {custom ? (
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
                setError('Add at least one muscle so you can find it later.')
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
              placeholder="Dumbbell, barbell, body only"
            />
            <TextField
              label="Primary muscles"
              value={muscles}
              onChange={(event) => setMuscles(event.target.value)}
              placeholder="chest, triceps"
              hint="Separate muscles with commas."
            />
            {error ? <Notice>{error}</Notice> : null}
            <Button type="submit" disabled={create.isPending}>
              {create.isPending ? 'Saving…' : 'Save and add'}
            </Button>
          </form>
        ) : (
          <button type="button" className="tap text-base font-medium text-ink" onClick={() => setCustom(true)}>
            Add a custom exercise
          </button>
        )}
      </div>
    </Sheet>
  )
}

export function Thumb({ exercise }: { exercise: Pick<Exercise, 'name' | 'images'> }) {
  const src = exercise.images[0]
  if (!src) {
    return (
      <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-elev text-sm text-muted">
        {exercise.name.slice(0, 1)}
      </span>
    )
  }
  return (
    <img
      src={src}
      alt=""
      className="h-12 w-12 shrink-0 rounded-xl object-cover"
      onError={(event) => {
        event.currentTarget.style.visibility = 'hidden'
      }}
    />
  )
}
