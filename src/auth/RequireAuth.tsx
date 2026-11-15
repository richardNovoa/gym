import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from './AuthProvider'

export function RequireAuth() {
  const { session, ready, configured } = useAuth()
  const location = useLocation()

  if (!configured) {
    return (
      <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-6">
        <p className="font-display text-4xl text-ink">Gym needs its keys.</p>
        <p className="mt-4 text-lg leading-relaxed text-muted">
          Copy <code className="text-ink">.env.example</code> to <code className="text-ink">.env</code>{' '}
          and set <code className="text-ink">VITE_SUPABASE_URL</code> and{' '}
          <code className="text-ink">VITE_SUPABASE_PUBLISHABLE_KEY</code>, then restart the dev server.
        </p>
      </main>
    )
  }

  if (!ready) {
    return (
      <main className="grid min-h-dvh place-items-center">
        <p className="font-display text-3xl text-ink">Gym</p>
      </main>
    )
  }

  if (!session) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  return <Outlet />
}
