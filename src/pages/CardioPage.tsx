import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'
import { Notice } from '../components/ui'
import { useDraft } from '../components/useDraft'
import { ensureCardioSession, fetchWorkout, saveCardio, updateWorkout } from '../lib/api'
import { formatLongDate } from '../lib/format'

const ACTIVITIES = ['Run', 'Row', 'Bike', 'Walk', 'Swim']

export function CardioPage() {
  const { id = '' } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const workout = useQuery({
    queryKey: ['workout', id],
    enabled: Boolean(id && user),
    queryFn: async () => {
      const current = await fetchWorkout(id)
      if (current && !current.cardio && user) {
        await ensureCardioSession(id, user.id)
        return fetchWorkout(id)
      }
      return current
    },
  })

  const finish = useMutation({
    mutationFn: () => updateWorkout(id, { ended_at: new Date().toISOString() }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['workouts'] })
      navigate('/')
    },
  })

  if (workout.isLoading) {
    return (
      <main className="grid min-h-dvh place-items-center">
        <p className="font-display text-3xl">Loading cardio</p>
      </main>
    )
  }

  if (workout.isError || !workout.data?.cardio) {
    return (
      <main className="mx-auto max-w-lg px-5 py-10">
        <Notice>{workout.isError ? (workout.error as Error).message : 'This session has no cardio entry.'}</Notice>
        <Link to="/" className="mt-4 inline-block text-muted">
          Back to today
        </Link>
      </main>
    )
  }

  const detail = workout.data
  const cardio = detail.cardio
  if (!cardio) return null

  return (
    <main className="mx-auto min-h-dvh w-full max-w-lg px-5 pb-16">
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
      <p className="text-sm text-muted">{formatLongDate(detail.performed_on)}</p>
      <h1 className="font-display text-5xl leading-none tracking-tight">Cardio</h1>
      {finish.isError ? (
        <div className="mt-4">
          <Notice>{(finish.error as Error).message}</Notice>
        </div>
      ) : null}
      <CardioForm
        sessionId={cardio.id}
        activity={cardio.activity}
        durationSeconds={cardio.duration_seconds}
        distance={cardio.distance}
        distanceUnit={cardio.distance_unit}
        notes={cardio.notes ?? ''}
        onSaved={() => queryClient.invalidateQueries({ queryKey: ['workout', id] })}
      />
    </main>
  )
}

function CardioForm({
  sessionId,
  activity,
  durationSeconds,
  distance,
  distanceUnit,
  notes,
  onSaved,
}: {
  sessionId: string
  activity: string
  durationSeconds: number | null
  distance: number | null
  distanceUnit: string
  notes: string
  onSaved: () => void
}) {
  const known = ACTIVITIES.includes(activity)
  const [choice, setChoice] = useState(known ? activity : 'Other')
  const [custom, setCustom] = useState(known ? '' : activity)
  const minutes = useDraft(durationSeconds == null ? '' : String(Math.floor(durationSeconds / 60)))
  const seconds = useDraft(durationSeconds == null ? '' : String(durationSeconds % 60))
  const distanceDraft = useDraft(distance == null ? '' : String(distance))
  const notesDraft = useDraft(notes)
  const [unit, setUnit] = useState(distanceUnit === 'km' ? 'km' : 'mi')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setUnit(distanceUnit === 'km' ? 'km' : 'mi')
  }, [distanceUnit])

  async function persist(patch: Parameters<typeof saveCardio>[1]) {
    setError(null)
    try {
      await saveCardio(sessionId, patch)
      onSaved()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save.')
    }
  }

  function durationPatch() {
    const mins = Number(minutes.draft || 0)
    const secs = Number(seconds.draft || 0)
    if (!minutes.draft && !seconds.draft) return null
    if (!Number.isFinite(mins) || !Number.isFinite(secs)) return null
    return Math.max(0, Math.round(mins) * 60 + Math.round(secs))
  }

  const activityValue = choice === 'Other' ? custom.trim() || 'Other' : choice

  return (
    <div className="mt-8 space-y-6">
      <div>
        <p className="text-sm text-muted">Activity</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {[...ACTIVITIES, 'Other'].map((item) => (
            <button
              key={item}
              type="button"
              aria-pressed={choice === item}
              className={`tap h-12 rounded-full px-4 ${choice === item ? 'bg-ink text-bg' : 'border border-line text-muted'}`}
              onClick={() => {
                setChoice(item)
                const next = item === 'Other' ? custom.trim() || 'Other' : item
                void persist({ activity: next })
              }}
            >
              {item}
            </button>
          ))}
        </div>
        {choice === 'Other' ? (
          <input
            className="field mt-3"
            placeholder="What did you do?"
            aria-label="Custom activity"
            value={custom}
            onChange={(event) => setCustom(event.target.value)}
            onBlur={() => persist({ activity: custom.trim() || 'Other' })}
          />
        ) : null}
      </div>

      <div>
        <p className="text-sm text-muted">Duration</p>
        <div className="mt-2 grid grid-cols-2 gap-3">
          <label>
            <span className="sr-only">Minutes</span>
            <input
              inputMode="numeric"
              className="field tabular-nums"
              placeholder="Minutes"
              aria-label="Minutes"
              value={minutes.draft}
              onChange={(event) => minutes.setDraft(event.target.value)}
              onFocus={minutes.onFocus}
              onBlur={() => {
                minutes.onBlur()
                void persist({ activity: activityValue, duration_seconds: durationPatch() })
              }}
            />
          </label>
          <label>
            <span className="sr-only">Seconds</span>
            <input
              inputMode="numeric"
              className="field tabular-nums"
              placeholder="Seconds"
              aria-label="Seconds"
              value={seconds.draft}
              onChange={(event) => seconds.setDraft(event.target.value)}
              onFocus={seconds.onFocus}
              onBlur={() => {
                seconds.onBlur()
                void persist({ activity: activityValue, duration_seconds: durationPatch() })
              }}
            />
          </label>
        </div>
      </div>

      <div>
        <p className="text-sm text-muted">Distance</p>
        <div className="mt-2 grid grid-cols-[1fr_auto] gap-3">
          <input
            inputMode="decimal"
            className="field tabular-nums"
            placeholder="0.0"
            aria-label="Distance"
            value={distanceDraft.draft}
            onChange={(event) => distanceDraft.setDraft(event.target.value)}
            onFocus={distanceDraft.onFocus}
            onBlur={() => {
              distanceDraft.onBlur()
              const trimmed = distanceDraft.draft.trim()
              const parsed = trimmed ? Number(trimmed) : null
              void persist({
                distance: parsed != null && Number.isFinite(parsed) ? parsed : null,
                distance_unit: unit,
              })
            }}
          />
          <div className="flex rounded-2xl border border-line p-1">
            {(['mi', 'km'] as const).map((option) => (
              <button
                key={option}
                type="button"
                aria-pressed={unit === option}
                className={`tap h-12 rounded-xl px-4 ${unit === option ? 'bg-ink text-bg' : 'text-muted'}`}
                onClick={() => {
                  setUnit(option)
                  const trimmed = distanceDraft.draft.trim()
                  const parsed = trimmed ? Number(trimmed) : null
                  void persist({
                    distance_unit: option,
                    distance: parsed != null && Number.isFinite(parsed) ? parsed : null,
                  })
                }}
              >
                {option}
              </button>
            ))}
          </div>
        </div>
      </div>

      <label className="block">
        <span className="text-sm text-muted">Notes</span>
        <textarea
          className="mt-2 min-h-24 w-full rounded-2xl border border-line bg-elev px-4 py-3 outline-none focus:border-transparent focus:shadow-[0_0_0_2px_var(--accent)]"
          value={notesDraft.draft}
          onChange={(event) => notesDraft.setDraft(event.target.value)}
          onFocus={notesDraft.onFocus}
          onBlur={() => {
            notesDraft.onBlur()
            if (notesDraft.draft !== notes) void persist({ notes: notesDraft.draft })
          }}
        />
      </label>
      {error ? <Notice>{error}</Notice> : null}
    </div>
  )
}
