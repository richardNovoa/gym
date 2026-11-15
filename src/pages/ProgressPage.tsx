import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Shell } from '../components/Shell'
import { Notice } from '../components/ui'
import { fetchProgress, fetchWorkouts } from '../lib/api'
import { format1rm, formatNumber, formatShortDate, isCycleDay } from '../lib/format'
import {
  bestEstimated1rm,
  dailyBestEstimates,
  heaviestWeight,
  selectNextSplit,
  type DailyEstimate,
} from '../lib/training'

export function ProgressPage() {
  const progress = useQuery({ queryKey: ['progress'], queryFn: fetchProgress })
  const workouts = useQuery({ queryKey: ['workouts'], queryFn: fetchWorkouts })
  const next = selectNextSplit(workouts.data ?? [])
  const exercises = useMemo(() => {
    const map = new Map<string, string>()
    for (const entry of progress.data ?? []) map.set(entry.exerciseId, entry.exerciseName)
    return [...map.entries()]
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [progress.data])
  const [exerciseId, setExerciseId] = useState<string | null>(null)
  const selected = exerciseId ?? exercises[0]?.id ?? null
  const rows = (progress.data ?? []).filter((entry) => entry.exerciseId === selected)
  const units = [...new Set(rows.map((row) => row.unit))]
  const defaultUnit = units.includes('lb') ? 'lb' : units[0] ?? 'lb'
  const [unit, setUnit] = useState<string | null>(null)
  const activeUnit = unit && units.includes(unit) ? unit : defaultUnit
  const series = dailyBestEstimates(rows, activeUnit)
  const best = bestEstimated1rm(rows, activeUnit)
  const heavy = heaviestWeight(rows, activeUnit)
  const chartData = series.map((point) => ({
    ...point,
    label: formatShortDate(point.date),
    rounded: Math.round(point.estimate),
  }))

  return (
    <Shell highlight={isCycleDay(next) ? next : null}>
      <h1 className="font-display text-4xl tracking-tight">Progress</h1>
      <p className="mt-2 text-muted">Estimated 1RM uses Epley: weight × (1 + reps / 30).</p>
      {progress.isLoading ? (
        <p className="mt-8 text-muted">Crunching the log…</p>
      ) : progress.isError ? (
        <div className="mt-6">
          <Notice>{(progress.error as Error).message}</Notice>
        </div>
      ) : exercises.length === 0 ? (
        <p className="mt-8 text-muted">Complete a few sets and the estimates will show up here.</p>
      ) : (
        <div className="mt-6">
          <label className="block">
            <span className="text-sm text-muted">Exercise</span>
            <select
              className="field mt-2"
              value={selected ?? ''}
              onChange={(event) => {
                setExerciseId(event.target.value)
                setUnit(null)
              }}
            >
              {exercises.map((exercise) => (
                <option key={exercise.id} value={exercise.id}>
                  {exercise.name}
                </option>
              ))}
            </select>
          </label>

          {units.length > 1 ? (
            <div className="mt-4 flex gap-2" role="group" aria-label="Unit">
              {units.map((option) => (
                <button
                  key={option}
                  type="button"
                  aria-pressed={activeUnit === option}
                  className={`tap h-10 rounded-full px-4 text-sm ${
                    activeUnit === option ? 'bg-ink text-bg' : 'text-muted'
                  }`}
                  onClick={() => setUnit(option)}
                >
                  {option}
                </button>
              ))}
            </div>
          ) : null}

          {best ? (
            <div className="mt-6">
              <p className="text-sm text-muted">Estimated 1RM</p>
              <p className="font-display text-6xl leading-none tabular-nums tracking-tight">
                {format1rm(best.estimate)}
                <span className="ml-2 font-sans text-2xl text-muted">{activeUnit}</span>
              </p>
              <p className="mt-3 text-muted">
                From {formatNumber(best.weight)} × {best.reps}.
                {heavy != null ? ` Heaviest load is ${formatNumber(heavy)} ${activeUnit}.` : ''}
              </p>
            </div>
          ) : (
            <p className="mt-6 text-muted">No completed sets in {activeUnit} yet.</p>
          )}

          {chartData.length > 0 ? (
            <div className="mt-6 h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 12, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid stroke="var(--line)" vertical={false} />
                  <XAxis
                    dataKey="label"
                    tick={{ fill: 'var(--muted)', fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    dataKey="rounded"
                    domain={[
                      (min: number) => Math.max(0, Math.floor(min - Math.max(10, min * 0.08))),
                      (max: number) => Math.ceil(max + Math.max(10, max * 0.08)),
                    ]}
                    tick={{ fill: 'var(--muted)', fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                    width={36}
                  />
                  <Tooltip content={<ChartTip unit={activeUnit} />} />
                  <Line
                    type="monotone"
                    dataKey="rounded"
                    stroke="var(--chart)"
                    strokeWidth={2.5}
                    dot={{ r: 4, stroke: 'var(--chart)', fill: 'var(--chart)' }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : null}

          {series.length > 0 ? (
            <ul className="mt-4 divide-y divide-line">
              {[...series].reverse().map((point) => (
                <li key={point.date} className="flex items-baseline justify-between py-3 tabular-nums">
                  <span className="text-muted">{formatShortDate(point.date)}</span>
                  <span>
                    {formatNumber(point.weight)} × {point.reps}
                    <span className="ml-3 text-muted">{format1rm(point.estimate)}</span>
                  </span>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      )}
    </Shell>
  )
}

function ChartTip({
  active,
  payload,
  unit,
}: {
  active?: boolean
  payload?: { payload: DailyEstimate & { label: string } }[]
  unit: string
}) {
  const point = payload?.[0]?.payload
  if (!active || !point) return null
  return (
    <div className="rounded-xl bg-ink px-3 py-2 text-sm text-bg">
      <p className="font-medium">
        {format1rm(point.estimate)} {unit}
      </p>
      <p>
        {formatNumber(point.weight)} × {point.reps}
      </p>
      <p>{point.label}</p>
    </div>
  )
}
