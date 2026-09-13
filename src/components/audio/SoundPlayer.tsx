import { useState } from 'react'
import type { Sound } from '../../types'
import { sounds } from '../../data/sounds'
import { useAudioEngine } from '../../hooks/useAudioEngine'
import { useMeditationTimer } from '../../hooks/useMeditationTimer'
import { formatSecondsAsClock } from '../../utils/time'
import { SoundCard } from './SoundCard'
import styles from './SoundPlayer.module.css'

export interface SoundPlayerProps {
  /** 0 means no sleep timer — sound plays until paused. Fixed for the
   * lifetime of this component; the page remounts it (via `key`) when
   * the user picks a different duration, since the underlying timer
   * engine's duration can't change after construction. */
  timerMinutes: number
}

/** The ambient sound list and its shared player: only one sound plays
 * at a time. A sleep timer (reusing MeditationTimer, exactly like a
 * guided session) stops playback automatically when it elapses. */
export function SoundPlayer({ timerMinutes }: SoundPlayerProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const audio = useAudioEngine({ loop: true })

  const hasTimer = timerMinutes > 0
  const timer = useMeditationTimer(hasTimer ? timerMinutes * 60 : Infinity, {
    onComplete: () => {
      audio.stop()
      setSelectedId(null)
    },
  })

  const isRunning = timer.state.status === 'running'

  function handleToggle(sound: Sound) {
    const isCurrent = selectedId === sound.id

    if (isCurrent && isRunning) {
      timer.pause()
      if (sound.audioUrl) audio.pause()
      return
    }

    if (!isCurrent) {
      setSelectedId(sound.id)
      if (sound.audioUrl) audio.load(sound.audioUrl)
    }

    if (isCurrent && timer.state.status === 'paused') {
      timer.resume()
    } else {
      timer.restart()
    }
    if (sound.audioUrl) audio.play()
  }

  return (
    <div className={styles.player}>
      {hasTimer && selectedId && (
        <p className={styles.timerStatus} role="status">
          {formatSecondsAsClock(timer.state.remainingSeconds)} until sounds stop
        </p>
      )}
      <ul className={styles.grid}>
        {sounds.map((sound) => (
          <li key={sound.id}>
            <SoundCard
              sound={sound}
              isPlaying={selectedId === sound.id && isRunning}
              onToggle={() => handleToggle(sound)}
            />
          </li>
        ))}
      </ul>
    </div>
  )
}
