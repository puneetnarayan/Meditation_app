import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AppLayout } from './layouts/AppLayout'

const HomePage = lazy(() => import('./pages/HomePage'))
const LibraryPage = lazy(() => import('./pages/LibraryPage'))
const CategoryPage = lazy(() => import('./pages/CategoryPage'))
const MeditationDetailsPage = lazy(
  () => import('./pages/MeditationDetailsPage'),
)
const ProgressPage = lazy(() => import('./pages/ProgressPage'))
const FavoritesPage = lazy(() => import('./pages/FavoritesPage'))
const SoundsPage = lazy(() => import('./pages/SoundsPage'))
const BellTimerPage = lazy(() => import('./pages/BellTimerPage'))
const ProgramsPage = lazy(() => import('./pages/ProgramsPage'))
const ProgramDetailsPage = lazy(() => import('./pages/ProgramDetailsPage'))
const SettingsPage = lazy(() => import('./pages/SettingsPage'))
const OnboardingPage = lazy(() => import('./pages/OnboardingPage'))
const AdminPage = lazy(() => import('./pages/AdminPage'))
const DownloadsPage = lazy(() => import('./pages/DownloadsPage'))
const AnalyticsPage = lazy(() => import('./pages/AnalyticsPage'))
const PlayerPage = lazy(() => import('./pages/PlayerPage'))
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'))

function RouteLoadingFallback() {
  return (
    <p role="status" style={{ padding: 'var(--space-lg)' }}>
      Loading…
    </p>
  )
}

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<RouteLoadingFallback />}>
        <Routes>
          <Route element={<AppLayout />}>
            <Route index element={<HomePage />} />
            <Route path="library" element={<LibraryPage />} />
            <Route path="library/:category" element={<CategoryPage />} />
            <Route path="meditation/:id" element={<MeditationDetailsPage />} />
            <Route path="progress" element={<ProgressPage />} />
            <Route path="favorites" element={<FavoritesPage />} />
            <Route path="sounds" element={<SoundsPage />} />
            <Route path="bell-timer" element={<BellTimerPage />} />
            <Route path="programs" element={<ProgramsPage />} />
            <Route path="programs/:id" element={<ProgramDetailsPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="onboarding" element={<OnboardingPage />} />
            <Route path="admin" element={<AdminPage />} />
            <Route path="downloads" element={<DownloadsPage />} />
            <Route path="analytics" element={<AnalyticsPage />} />
            <Route path="player/:id" element={<PlayerPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}

export default App
