import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Shell } from '../components/Shell'
import { Notice, Skeleton } from '../components/ui'
import { fetchWorkouts } from '../lib/api'
import type { WorkoutSummary } from '../lib/types'
import { formatMonth, formatShortDate, isCycleDay } from '../lib/format'
import { selectNextSplit } from '../lib/training'
import { labelFor, summaryFor } from './TodayPage'

export function HistoryPage() {
  const navigate = useNavigate()
  const workouts = useQuery({ queryKey: ['workouts'], queryFn: fetchWorkouts })
  const next = selectNextSplit(workouts.data ?? [])
  const groups = new Map<string, WorkoutSummary[]>()
  for (const workout of workouts.data ?? []) {
    const key = formatMonth(workout.performed_on)
    const bucket = groups.get(key) ?? []
    bucket.push(workout)
    groups.set(key, bucket)
  }

  return (
    <Shell highlight={isCycleDay(next) ? next : null}>
      <h1 className="font-display text-4xl tracking-tight">History</h1>
      <p className="mt-2 text-muted">Every session, newest first.</p>
      {workouts.isLoading ? (
        <div className="mt-6 space-y-3">
          <Skeleton className="h-16" />
          <Skeleton className="h-16" />
        </div>
      ) : workouts.isError ? (
        <div className="mt-6">
          <Notice>{(workouts.error as Error).message}</Notice>
        </div>
      ) : (workouts.data ?? []).length === 0 ? (
        <p className="mt-8 text-muted">Finished sessions will collect here.</p>
      ) : (
        <div className="mt-6 space-y-8">
          {[...groups.entries()].map(([month, items]) => (
            <section key={month}>
              <h2 className="text-sm font-medium text-muted">{month}</h2>
              <ul className="mt-1 divide-y divide-line">
                {items.map((workout) => (
                  <li key={workout.id}>
                    <button
                      type="button"
                      className="tap flex w-full items-baseline justify-between gap-4 py-4 text-left"
                      onClick={() => navigate(`/history/${workout.id}`)}
                    >
                      <span>
                        <span className="block text-lg">{labelFor(workout)}</span>
                        <span className="mt-0.5 block text-sm text-muted">{summaryFor(workout)}</span>
                      </span>
                      <span className="shrink-0 text-sm tabular-nums text-muted">
                        {formatShortDate(workout.performed_on)}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </Shell>
  )
}
