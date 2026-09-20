import { useState } from 'react'
import { Button } from '../components/common/Button'
import { IconButton } from '../components/common/IconButton'
import { Input } from '../components/common/Input'
import { PageContainer } from '../components/common/PageContainer'
import { Switch } from '../components/common/Switch'
import { playBellTone } from '../engines/bell/bellTone'
import { useBellTimer } from '../hooks/useBellTimer'
import { useWakeLock } from '../hooks/useWakeLock'
import { ProgressBar } from '../components/progress/ProgressBar'
import { formatSecondsAsClock } from '../utils/time'
import styles from './BellTimerPage.module.css'

const MIN_BELLS = 1
const MAX_BELLS = 999
const DEFAULT_BELLS = 10

function clampBellCount(value: number): number {
  if (!Number.isFinite(value)) return MIN_BELLS
  return Math.min(MAX_BELLS, Math.max(MIN_BELLS, Math.round(value)))
}

/** A silent-sitting interval bell timer: rings a synthesized bell after
 * a short delay, then again every minute, independent of any specific
 * meditation content — the bell tone is generated via the Web Audio
 * API, so this always has sound even where no meditation in the
 * catalog has real hosted audio. */
export function BellTimerPage() {
  const [totalBells, setTotalBells] = useState(DEFAULT_BELLS)
  const [soundOn, setSoundOn] = useState(true)

  const timer = useBellTimer(totalBells, {
    onBell: () => {
      if (soundOn) playBellTone()
    },
  })

  useWakeLock(timer.state.status === 'running')

  const { state } = timer
  const isRunning = state.status === 'running'
  const isPaused = state.status === 'paused'
  const isCompleted = state.status === 'completed'
  const isIdle = state.status === 'idle'
  const canEditBellCount = isIdle

  function handlePrimaryAction() {
    if (isRunning) {
      timer.pause()
    } else if (isPaused) {
      timer.resume()
    } else {
      timer.start()
    }
  }

  return (
    <PageContainer>
      <div className={styles.timer}>
        <header>
          <h1>Bell Timer</h1>
          <p>A gentle bell at one-minute intervals for silent sitting.</p>
        </header>

        <div className={styles.countdown}>
          {formatSecondsAsClock(state.remainingSeconds)}
        </div>
        <p className={styles.status} role="status">
          {isCompleted
            ? 'Completed'
            : isPaused
              ? 'Paused'
              : isRunning
                ? 'Running'
                : 'Ready to start'}
        </p>

        <div className={styles.progressSection}>
          <ProgressBar
            value={state.rungBells}
            max={state.totalBells}
            label="Bells rung"
          />
          <p className={styles.progressLabel}>
            Bell {state.rungBells} / {state.totalBells}
          </p>
        </div>

        <div className={styles.bellsRow}>
          <IconButton
            icon="−"
            label="Fewer bells"
            onClick={() =>
              setTotalBells((current) => clampBellCount(current - 1))
            }
            disabled={!canEditBellCount}
          />
          <Input
            label="Number of bells"
            type="number"
            min={MIN_BELLS}
            max={MAX_BELLS}
            value={totalBells}
            onChange={(event) =>
              setTotalBells(clampBellCount(Number(event.target.value)))
            }
            disabled={!canEditBellCount}
          />
          <IconButton
            icon="+"
            label="More bells"
            onClick={() =>
              setTotalBells((current) => clampBellCount(current + 1))
            }
            disabled={!canEditBellCount}
          />
        </div>

        <div className={styles.actions}>
          <Button onClick={handlePrimaryAction}>
            {isPaused ? 'Resume' : isRunning ? 'Pause' : 'Start'}
          </Button>
          <Button
            variant="secondary"
            onClick={() => timer.stop()}
            disabled={isIdle}
          >
            Stop
          </Button>
        </div>

        <Switch
          label="Bell sound"
          checked={soundOn}
          onChange={(event) => setSoundOn(event.target.checked)}
        />

        <p className={styles.note}>
          First bell after 5 seconds, then one bell every 60 seconds.
        </p>
      </div>
    </PageContainer>
  )
}

export default BellTimerPage
