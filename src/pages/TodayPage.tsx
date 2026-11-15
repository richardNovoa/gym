import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'
import { Shell } from '../components/Shell'
import { Button, Notice, Skeleton } from '../components/ui'
import { createCardioWorkout, createWorkout, fetchProfile, fetchWorkouts } from '../lib/api'
import {
  SPLIT_BLURB,
  SPLIT_LABEL,
  cycleIndex,
  firstName,
  formatDuration,
  formatShortDate,
  formatWeekday,
  greeting,
  isCycleDay,
} from '../lib/format'
import { SPLIT_CYCLE, selectNextSplit, type CycleDay } from '../lib/training'
import type { WorkoutSummary } from '../lib/types'

export function TodayPage() {
  const { user } = useAuth()
  const userId = user?.id ?? ''
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const workouts = useQuery({ queryKey: ['workouts'], queryFn: fetchWorkouts })
  const profile = useQuery({
    queryKey: ['profile', userId],
    queryFn: () => fetchProfile(userId),
    enabled: Boolean(userId),
  })

  const list = workouts.data ?? []
  const next = selectNextSplit(list)
  const open = list.find((workout) => workout.ended_at == null && workout.split !== 'rest')
  const highlight: CycleDay = open && isCycleDay(open.split) ? open.split : next
  const name = firstName(profile.data?.name)

  const start = useMutation({
    mutationFn: async () => {
      if (next === 'rest') {
        await createWorkout({ userId, split: 'rest', name: 'Rest', finish: true })
        return { kind: 'rest' as const }
      }
      if (next === 'cardio') {
        const id = await createCardioWorkout(userId)
        return { kind: 'cardio' as const, id }
      }
      const id = await createWorkout({ userId, split: next, name: SPLIT_LABEL[next] })
      return { kind: 'strength' as const, id }
    },
    onSuccess: async (result) => {
      await queryClient.invalidateQueries({ queryKey: ['workouts'] })
      if (result.kind === 'cardio') navigate(`/cardio/${result.id}`)
      if (result.kind === 'strength') navigate(`/workout/${result.id}`)
    },
  })

  return (
    <Shell highlight={highlight}>
      <p className="text-sm text-muted">{formatWeekday()}</p>
      <h1 className="mt-1 font-display text-4xl leading-none tracking-tight">
        {greeting()}
        {name ? `, ${name}` : ''}
      </h1>

      {workouts.isLoading ? (
        <div className="mt-8 space-y-3">
          <Skeleton className="h-40" />
          <Skeleton className="h-16" />
        </div>
      ) : workouts.isError ? (
        <div className="mt-8">
          <Notice>{(workouts.error as Error).message}</Notice>
        </div>
      ) : (
        <>
          {open ? (
            <section className="mt-8 rounded-3xl border border-line bg-elev p-5 shadow-card">
              <p className="text-sm text-muted">In progress</p>
              <h2 className="mt-1 font-display text-4xl leading-none">{labelFor(open)}</h2>
              <p className="mt-3 text-muted">{summaryFor(open)}</p>
              <div className="mt-5">
                <Button onClick={() => navigate(pathFor(open))}>Resume</Button>
              </div>
            </section>
          ) : (
            <section className="mt-8">
              <div className="flex items-center gap-2" aria-hidden="true">
                {SPLIT_CYCLE.map((day) => (
                  <span
                    key={day}
                    className={`h-1.5 flex-1 rounded-full ${day === next ? 'bg-accent' : 'bg-line'}`}
                  />
                ))}
              </div>
              <p className="mt-4 text-sm text-muted">
                Day {cycleIndex(next)} of {SPLIT_CYCLE.length}
              </p>
              <h2 className="mt-1 font-display text-5xl leading-[0.95] tracking-tight">
                {SPLIT_LABEL[next]}
              </h2>
              <p className="mt-3 max-w-sm text-lg text-muted">{SPLIT_BLURB[next]}</p>
              {start.isError ? (
                <div className="mt-4">
                  <Notice>{(start.error as Error).message}</Notice>
                </div>
              ) : null}
              <div className="mt-6">
                <Button
                  variant={next === 'rest' ? 'ink' : 'primary'}
                  disabled={start.isPending || !userId}
                  onClick={() => start.mutate()}
                >
                  {start.isPending
                    ? 'Starting…'
                    : next === 'rest'
                      ? 'Log rest day'
                      : next === 'cardio'
                        ? 'Start cardio'
                        : 'Start workout'}
                </Button>
              </div>
            </section>
          )}

          <section className="mt-10">
            <h3 className="text-sm font-medium text-muted">Recent</h3>
            {list.length === 0 ? (
              <p className="mt-3 text-muted">The cycle starts at cardio. Nothing is logged yet.</p>
            ) : (
              <ul className="mt-2 divide-y divide-line">
                {list.slice(0, 5).map((workout) => (
                  <li key={workout.id}>
                    <button
                      type="button"
                      className="tap flex w-full items-baseline justify-between gap-4 py-3 text-left"
                      onClick={() => navigate(`/history/${workout.id}`)}
                    >
                      <span>
                        <span className="block">{labelFor(workout)}</span>
                        <span className="block text-sm text-muted">{summaryFor(workout)}</span>
                      </span>
                      <span className="shrink-0 text-sm text-muted">
                        {formatShortDate(workout.performed_on)}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </Shell>
  )
}

export function labelFor(workout: WorkoutSummary): string {
  if (workout.split) return SPLIT_LABEL[workout.split]
  return workout.name || 'Workout'
}

export function summaryFor(workout: WorkoutSummary): string {
  if (workout.split === 'rest') return 'Rest day'
  if (workout.cardio) {
    const bits = [workout.cardio.activity]
    if (workout.cardio.duration_seconds != null) bits.push(formatDuration(workout.cardio.duration_seconds))
    if (workout.cardio.distance != null) bits.push(`${workout.cardio.distance} ${workout.cardio.distance_unit}`)
    return bits.join(' · ')
  }
  if (workout.exercises.length === 0) return workout.ended_at ? 'No exercises' : 'Just started'
  const names = workout.exercises.slice(0, 3).map((exercise) => exercise.name)
  const extra = workout.exercises.length - names.length
  return extra > 0 ? `${names.join(', ')} +${extra}` : names.join(', ')
}

export function pathFor(workout: WorkoutSummary): string {
  if (workout.split === 'cardio') return `/cardio/${workout.id}`
  if (workout.split === 'rest' || workout.split === 'other') return `/history/${workout.id}`
  return `/workout/${workout.id}`
}
