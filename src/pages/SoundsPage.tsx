import { useState } from 'react'
import { SoundPlayer } from '../components/audio/SoundPlayer'
import { PageContainer } from '../components/common/PageContainer'
import { Select } from '../components/common/Select'
import styles from './SoundsPage.module.css'

const TIMER_OPTIONS = [
  { label: '15 min', minutes: 15 },
  { label: '30 min', minutes: 30 },
  { label: '45 min', minutes: 45 },
  { label: '60 min', minutes: 60 },
]

export function SoundsPage() {
  const [timerMinutes, setTimerMinutes] = useState(0)

  return (
    <PageContainer>
      <h1>Sounds</h1>
      <p>Play a calming sound, with an optional timer to stop it for you.</p>

      <Select
        label="Sleep timer"
        className={styles.timerSelect}
        value={timerMinutes}
        onChange={(event) => setTimerMinutes(Number(event.target.value))}
      >
        <option value={0}>No timer</option>
        {TIMER_OPTIONS.map((option) => (
          <option key={option.minutes} value={option.minutes}>
            {option.label}
          </option>
        ))}
      </Select>

      {/* Remounted whenever the timer duration changes — the underlying
       * timer engine's duration is fixed once created, so a fresh
       * instance (and a fresh, stopped player) is the correct behavior
       * here rather than trying to resize a timer already in progress. */}
      <SoundPlayer key={timerMinutes} timerMinutes={timerMinutes} />
    </PageContainer>
  )
}

export default SoundsPage
