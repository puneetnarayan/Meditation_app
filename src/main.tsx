import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import './styles/global.css'
import App from './App.tsx'
import { ErrorBoundary } from './components/common/ErrorBoundary.tsx'
import { ToastProvider } from './components/common/Toast.tsx'
import {
  applyDocumentPreferences,
  getPreferences,
} from './services/preferences/preferencesStore'

// Applied before the first render so a persisted reduced-motion
// preference is honored from first paint, not just after Settings mounts.
applyDocumentPreferences(getPreferences())

// No-op outside a production build (registerType: 'autoUpdate' means a
// new service worker activates and reloads the page on its own — no
// "update available" prompt to wire up).
registerSW({ immediate: true })

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <ToastProvider>
        <App />
      </ToastProvider>
    </ErrorBoundary>
  </StrictMode>,
)
