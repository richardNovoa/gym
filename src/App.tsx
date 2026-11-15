import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './auth/AuthProvider'
import { RequireAuth } from './auth/RequireAuth'
import { AuthPage } from './pages/AuthPage'
import { CardioPage } from './pages/CardioPage'
import { HistoryDetailPage } from './pages/HistoryDetailPage'
import { HistoryPage } from './pages/HistoryPage'
import { LibraryPage } from './pages/LibraryPage'
import { ProgressPage } from './pages/ProgressPage'
import { TodayPage } from './pages/TodayPage'
import { WorkoutLoggerPage } from './pages/WorkoutLoggerPage'
import { ThemeProvider } from './theme'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 15_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

export default function App() {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <Routes>
              <Route path="/login" element={<AuthPage />} />
              <Route element={<RequireAuth />}>
                <Route path="/" element={<TodayPage />} />
                <Route path="/history" element={<HistoryPage />} />
                <Route path="/history/:id" element={<HistoryDetailPage />} />
                <Route path="/library" element={<LibraryPage />} />
                <Route path="/progress" element={<ProgressPage />} />
                <Route path="/workout/:id" element={<WorkoutLoggerPage />} />
                <Route path="/cardio/:id" element={<CardioPage />} />
              </Route>
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  )
}
