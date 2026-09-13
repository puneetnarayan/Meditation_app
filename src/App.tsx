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
const SettingsPage = lazy(() => import('./pages/SettingsPage'))
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
            <Route path="settings" element={<SettingsPage />} />
            <Route path="player/:id" element={<PlayerPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}

export default App
