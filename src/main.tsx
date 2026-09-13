import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/global.css'
import App from './App.tsx'
import {
  applyDocumentPreferences,
  getPreferences,
} from './services/preferences/preferencesStore'

// Applied before the first render so a persisted reduced-motion
// preference is honored from first paint, not just after Settings mounts.
applyDocumentPreferences(getPreferences())

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
