import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Button, Notice } from '../components/ui'
import { deleteWorkout, fetchWorkout } from '../lib/api'
import { SPLIT_LABEL, formatLongDate, formatNumber, formatDuration, kindLabel } from '../lib/format'

export function HistoryDetailPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [confirming, setConfirming] = useState(false)
  const workout = useQuery({
    queryKey: ['workout', id],
    queryFn: () => fetchWorkout(id),
    enabled: Boolean(id),
  })
  const remove = useMutation({
    mutationFn: () => deleteWorkout(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['workouts'] })
      navigate('/history')
    },
  })

  if (workout.isLoading) {
    return (
      <main className="grid min-h-dvh place-items-center">
        <p className="font-display text-3xl">Loading</p>
      </main>
    )
  }

  if (workout.isError || !workout.data) {
    return (
      <main className="mx-auto max-w-lg px-5 py-10">
        <Notice>{workout.isError ? (workout.error as Error).message : 'That session is gone.'}</Notice>
        <Link to="/history" className="mt-4 inline-block text-muted">
          Back to history
        </Link>
      </main>
    )
  }

  const detail = workout.data
  const title = detail.split ? SPLIT_LABEL[detail.split] : detail.name || 'Workout'
  const editable = detail.split !== 'rest' && detail.split !== 'other'
  const editHref = detail.split === 'cardio' ? `/cardio/${detail.id}` : `/workout/${detail.id}`

  return (
    <main className="mx-auto min-h-dvh w-full max-w-lg px-5 pb-16">
      <header className="flex items-center justify-between py-4">
        <Link to="/history" className="tap text-sm text-muted">
          History
        </Link>
        {editable ? (
          <Link to={editHref} className="tap text-sm font-medium">
            {detail.ended_at ? 'Edit' : 'Continue'}
          </Link>
        ) : null}
      </header>
      <p className="text-sm text-muted">{formatLongDate(detail.performed_on)}</p>
      <h1 className="font-display text-5xl leading-[0.95] tracking-tight">{title}</h1>
      {detail.notes ? <p className="mt-4 whitespace-pre-wrap text-muted">{detail.notes}</p> : null}

      {detail.cardio ? (
        <section className="mt-8 rounded-3xl border border-line bg-elev p-5">
          <h2 className="text-xl">{detail.cardio.activity}</h2>
          <p className="mt-2 text-muted">
            {formatDuration(detail.cardio.duration_seconds)}
            {detail.cardio.distance != null
              ? ` · ${formatNumber(detail.cardio.distance)} ${detail.cardio.distance_unit}`
              : ''}
          </p>
          {detail.cardio.notes ? <p className="mt-3 whitespace-pre-wrap">{detail.cardio.notes}</p> : null}
        </section>
      ) : null}

      <div className="mt-6 space-y-4">
        {detail.exercises.map((exercise) => (
          <section key={exercise.id} className="rounded-3xl border border-line bg-elev p-4">
            <h2 className="text-lg font-medium">{exercise.exercise.name}</h2>
            <ul className="mt-3 space-y-2">
              {exercise.sets.map((set) => (
                <li
                  key={set.id}
                  className={`flex items-baseline justify-between gap-3 text-base tabular-nums ${
                    set.parent_set_id ? 'ml-4 text-muted' : ''
                  }`}
                >
                  <span>{kindLabel(set.kind, set.target_reps, set.rir)}</span>
                  <span>
                    {set.weight == null ? '—' : `${formatNumber(set.weight)} ${set.unit}`}
                    {' · '}
                    {set.reps == null ? '—' : set.reps}
                    {set.target_reps != null ? `/${set.target_reps}` : ''}
                    {set.completed ? '' : ' · open'}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      <div className="mt-8">
        {confirming ? (
          <div className="space-y-3">
            <p className="text-sm text-muted">Delete this session permanently?</p>
            {remove.isError ? <Notice>{(remove.error as Error).message}</Notice> : null}
            <Button variant="ink" disabled={remove.isPending} onClick={() => remove.mutate()}>
              {remove.isPending ? 'Deleting…' : 'Delete session'}
            </Button>
            <Button variant="ghost" onClick={() => setConfirming(false)}>
              Keep it
            </Button>
          </div>
        ) : (
          <button type="button" className="tap text-sm text-danger" onClick={() => setConfirming(true)}>
            Delete session
          </button>
        )}
      </div>
    </main>
  )
}
