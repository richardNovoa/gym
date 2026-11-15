import { useState, type FormEvent } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../auth/AuthProvider'
import { useTheme, type ThemeChoice } from '../theme'
import { Button, Notice, TextField } from '../components/ui'

export function AuthPage() {
  const { session, configured } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const from = (location.state as { from?: string } | null)?.from || '/'
  const [mode, setMode] = useState<'sign-in' | 'sign-up'>('sign-in')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  if (!configured || !supabase) {
    return (
      <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-6">
        <p className="font-display text-4xl">Gym needs its keys.</p>
        <p className="mt-4 text-lg text-muted">
          Add VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY to <code>.env</code>.
        </p>
      </main>
    )
  }

  if (session) return <Navigate to={from} replace />

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    if (!supabase) return
    setError(null)
    setNotice(null)
    setPending(true)
    try {
      if (mode === 'sign-up') {
        if (!name.trim()) {
          setError('Add your name.')
          return
        }
        const { data, error: signError } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: { data: { name: name.trim() } },
        })
        if (signError) throw signError
        if (data.user && data.user.identities && data.user.identities.length === 0) {
          setError('An account with that email already exists. Sign in.')
          setMode('sign-in')
          return
        }
        if (!data.session) {
          setNotice('Check your email to confirm the account, then sign in.')
          setMode('sign-in')
          return
        }
        navigate(from)
        return
      }
      const { error: signError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      })
      if (signError) throw signError
      navigate(from)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setPending(false)
    }
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center px-6 py-12">
      <div className="mb-10 flex items-center justify-between">
        <p className="font-display text-2xl">Gym</p>
        <AuthTheme />
      </div>
      <h1 className="font-display text-5xl leading-[0.95] tracking-tight">
        {mode === 'sign-in' ? 'Welcome back.' : 'Start the log.'}
      </h1>
      <p className="mt-4 text-lg text-muted">
        Cardio, chest and back, shoulders and arms, legs, then a rest day.
      </p>
      <form className="mt-8 space-y-4" onSubmit={onSubmit}>
        {mode === 'sign-up' ? (
          <TextField
            label="Name"
            autoComplete="name"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
        ) : null}
        <TextField
          label="Email"
          type="email"
          autoComplete="email"
          inputMode="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
        <TextField
          label="Password"
          type="password"
          autoComplete={mode === 'sign-in' ? 'current-password' : 'new-password'}
          minLength={6}
          required
          hint="At least 6 characters."
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
        {error ? <Notice>{error}</Notice> : null}
        {notice ? <Notice tone="info">{notice}</Notice> : null}
        <Button type="submit" disabled={pending}>
          {pending ? 'Working…' : mode === 'sign-in' ? 'Sign in' : 'Create account'}
        </Button>
      </form>
      <button
        type="button"
        className="tap mt-6 text-left text-base text-muted"
        onClick={() => {
          setMode(mode === 'sign-in' ? 'sign-up' : 'sign-in')
          setError(null)
          setNotice(null)
        }}
      >
        {mode === 'sign-in' ? 'New here? Create an account' : 'Already training? Sign in'}
      </button>
    </main>
  )
}

function AuthTheme() {
  const { choice, setChoice } = useTheme()
  const next: Record<ThemeChoice, ThemeChoice> = { system: 'dark', dark: 'light', light: 'system' }
  return (
    <button type="button" className="tap text-sm text-muted" onClick={() => setChoice(next[choice])}>
      Theme: {choice}
    </button>
  )
}
