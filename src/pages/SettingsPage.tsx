import { Input } from '../components/common/Input'
import { PageContainer } from '../components/common/PageContainer'
import { Select } from '../components/common/Select'
import { Switch } from '../components/common/Switch'
import { usePreferences } from '../hooks/usePreferences'
import styles from './SettingsPage.module.css'

const DURATION_OPTIONS: { label: string; seconds: number }[] = [
  { label: '5 min', seconds: 300 },
  { label: '10 min', seconds: 600 },
  { label: '15 min', seconds: 900 },
  { label: '20 min', seconds: 1200 },
  { label: '30 min', seconds: 1800 },
]

export function SettingsPage() {
  const { preferences, updatePreferences } = usePreferences()

  return (
    <PageContainer>
      <h1>Settings</h1>

      <section className={styles.section}>
        <h2>Audio</h2>
        <Input
          label={`Volume (${Math.round(preferences.audioVolume * 100)}%)`}
          type="range"
          min={0}
          max={1}
          step={0.05}
          value={preferences.audioVolume}
          onChange={(event) =>
            updatePreferences({ audioVolume: Number(event.target.value) })
          }
        />
      </section>

      <section className={styles.section}>
        <h2>Appearance</h2>
        <Switch
          label="Reduce motion"
          checked={preferences.reducedMotion}
          onChange={(event) =>
            updatePreferences({ reducedMotion: event.target.checked })
          }
        />
      </section>

      <section className={styles.section}>
        <h2>Meditation preferences</h2>
        <Select
          label="Preferred duration"
          value={preferences.preferredDurationSeconds ?? ''}
          onChange={(event) =>
            updatePreferences({
              preferredDurationSeconds: event.target.value
                ? Number(event.target.value)
                : undefined,
            })
          }
        >
          <option value="">No preference</option>
          {DURATION_OPTIONS.map((option) => (
            <option key={option.seconds} value={option.seconds}>
              {option.label}
            </option>
          ))}
        </Select>
      </section>
    </PageContainer>
  )
}

export default SettingsPage
