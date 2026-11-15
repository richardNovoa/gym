import type { ReactNode } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { SPLIT_CYCLE, type CycleDay } from '../lib/training'
import { SPLIT_LABEL } from '../lib/format'
import { useTheme, type ThemeChoice } from '../theme'

const LINKS = [
  { to: '/', label: 'Today', end: true, icon: TodayIcon },
  { to: '/history', label: 'History', end: false, icon: ListIcon },
  { to: '/library', label: 'Library', end: false, icon: BookIcon },
  { to: '/progress', label: 'Progress', end: false, icon: ChartIcon },
]

export function Shell({
  children,
  highlight,
}: {
  children: ReactNode
  highlight?: CycleDay | null
}) {
  return (
    <div className="mx-auto min-h-dvh w-full max-w-6xl lg:grid lg:grid-cols-[16rem_minmax(0,32rem)] lg:justify-center lg:gap-12 lg:px-8">
      <aside className="hidden lg:flex lg:flex-col lg:py-8">
        <Brand />
        <nav className="mt-10 flex flex-col gap-1" aria-label="Primary">
          {LINKS.map((link) => (
            <RailLink key={link.to} {...link} />
          ))}
        </nav>
        <ol className="mt-10 space-y-2" aria-label="Split cycle">
          {SPLIT_CYCLE.map((day, index) => {
            const active = day === highlight
            return (
              <li
                key={day}
                className={`flex items-baseline gap-3 text-sm ${active ? 'text-ink' : 'text-muted'}`}
              >
                <span className="w-4 tabular-nums">{index + 1}</span>
                <span className={active ? 'font-medium' : ''}>{SPLIT_LABEL[day]}</span>
              </li>
            )
          })}
        </ol>
        <div className="mt-auto space-y-4 pt-8">
          <ThemeSwitch />
          <SignOut />
        </div>
      </aside>
      <div className="flex min-h-dvh flex-col">
        <header className="flex items-center justify-between px-5 pb-2 pt-5 lg:hidden">
          <Brand />
          <div className="flex items-center gap-4">
            <ThemeCycle />
            <SignOut />
          </div>
        </header>
        <div className="flex-1 px-5 pb-28 lg:px-0 lg:pb-16 lg:pt-8">{children}</div>
      </div>
      <nav
        className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-bg/95 px-2 backdrop-blur lg:hidden"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        aria-label="Primary"
      >
        <ul className="mx-auto grid max-w-lg grid-cols-4">
          {LINKS.map((link) => (
            <li key={link.to}>
              <NavLink
                to={link.to}
                end={link.end}
                className={({ isActive }) =>
                  `tap flex h-16 flex-col items-center justify-center gap-1 text-xs ${
                    isActive ? 'text-ink' : 'text-muted'
                  }`
                }
              >
                <link.icon />
                {link.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  )
}

function Brand() {
  return <p className="font-display text-2xl tracking-tight">Gym</p>
}

function RailLink({
  to,
  label,
  end,
  icon: Icon,
}: {
  to: string
  label: string
  end: boolean
  icon: () => ReactNode
}) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `flex h-11 items-center gap-3 rounded-xl px-3 text-base ${
          isActive ? 'bg-elev text-ink' : 'text-muted'
        }`
      }
    >
      <Icon />
      {label}
    </NavLink>
  )
}

function SignOut() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  return (
    <button
      type="button"
      className="tap text-sm text-muted"
      onClick={async () => {
        await supabase?.auth.signOut()
        queryClient.clear()
        navigate('/login')
      }}
    >
      Sign out
    </button>
  )
}

function ThemeCycle() {
  const { choice, setChoice } = useTheme()
  const next: Record<ThemeChoice, ThemeChoice> = { system: 'dark', dark: 'light', light: 'system' }
  return (
    <button type="button" className="tap text-sm text-muted" onClick={() => setChoice(next[choice])}>
      {choice}
    </button>
  )
}

function ThemeSwitch() {
  const { choice, setChoice } = useTheme()
  const options: ThemeChoice[] = ['system', 'light', 'dark']
  return (
    <div className="flex gap-1 rounded-full border border-line p-1" role="group" aria-label="Theme">
      {options.map((option) => (
        <button
          key={option}
          type="button"
          aria-pressed={choice === option}
          className={`tap h-9 flex-1 rounded-full text-xs capitalize ${
            choice === option ? 'bg-ink text-bg' : 'text-muted'
          }`}
          onClick={() => setChoice(option)}
        >
          {option}
        </button>
      ))}
    </div>
  )
}

function TodayIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="1.6" />
      <path d="M10 6.5V10l2.5 1.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}

function ListIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d="M5 6h10M5 10h10M5 14h7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}

function BookIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path
        d="M4.5 5.5h5.2c.7 0 1.3.6 1.3 1.3V15c-.5-.4-1.1-.6-1.8-.6H4.5V5.5Z"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <path
        d="M15.5 5.5H10.3c-.7 0-1.3.6-1.3 1.3V15c.5-.4 1.1-.6 1.8-.6h4.7V5.5Z"
        stroke="currentColor"
        strokeWidth="1.6"
      />
    </svg>
  )
}

function ChartIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path
        d="M4 14.5 8 9l3 2.5L16 6"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
