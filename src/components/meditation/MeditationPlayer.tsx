import { useEffect, useRef, useState } from 'react'
import type { Meditation } from '../../types'
import { useMeditationTimer } from '../../hooks/useMeditationTimer'
import { useAudioEngine } from '../../hooks/useAudioEngine'
import { trackEvent } from '../../services/analytics/analyticsStore'
import { resolvePlaybackUrl } from '../../services/offline/offlineAudioStore'
import { recordSession } from '../../services/progress/sessionStore'
import { getPreferences } from '../../services/preferences/preferencesStore'
import { recordPlayed } from '../../services/recentlyPlayed/recentlyPlayedStore'
import { formatSecondsAsClock } from '../../utils/time'
import { toTitleCase } from '../../utils/text'
import { Button } from '../common/Button'
import { IconButton } from '../common/IconButton'
import { ProgressBar } from '../progress/ProgressBar'
import styles from './MeditationPlayer.module.css'

export interface MeditationPlayerProps {
  meditation: Meditation
  /** Called after the user ends the session (via the End control). */
  onExit?: () => void
  /** Called once the session finishes naturally (the full duration
   * elapsed) — distinct from onExit, which only fires on manual End. */
  onComplete?: () => void
  /** Called when a fresh session begins (not on resume from pause) —
   * lets a caller with extra context (e.g. PlayerPage knowing this is
   * a program day) react to the exact moment playback starts. */
  onStart?: () => void
}

export function MeditationPlayer({
  meditation,
  onExit,
  onComplete,
  onStart,
}: MeditationPlayerProps) {
  const { audioUrl } = meditation

  // When the current attempt began, for recording a session. Cleared once
  // recorded so a later "End" click (e.g. right after natural completion)
  // doesn't record it a second time.
  const startedAtRef = useRef<Date | null>(null)

  const timer = useMeditationTimer(meditation.durationSeconds, {
    onComplete: () => {
      if (audioUrl) audio.stop()
      if (startedAtRef.current) {
        recordSession({
          meditationId: meditation.id,
          startedAt: startedAtRef.current,
          durationSeconds: meditation.durationSeconds,
          elapsedSeconds: meditation.durationSeconds,
        })
        startedAtRef.current = null
      }
      trackEvent('meditation_completed', { meditationId: meditation.id })
      onComplete?.()
    },
  })

  const [initialVolume] = useState(() => getPreferences().audioVolume)
  const audio = useAudioEngine({ initialVolume })

  // Tracks a blob URL created from a cached offline download, if any,
  // so it can be revoked once the player no longer needs it — blob
  // URLs otherwise leak for the page's lifetime.
  const objectUrlRef = useRef<string | undefined>(undefined)

  useEffect(() => {
    if (!audioUrl) return
    let cancelled = false

    resolvePlaybackUrl(meditation).then((resolvedUrl) => {
      if (cancelled || !resolvedUrl) return
      if (resolvedUrl.startsWith('blob:')) objectUrlRef.current = resolvedUrl
      audio.load(resolvedUrl)
    })

    return () => {
      cancelled = true
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current)
        objectUrlRef.current = undefined
      }
    }
    // Only (re)load when the audio source itself changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audioUrl])

  const isRunning = timer.state.status === 'running'
  const isCompleted = timer.state.status === 'completed'
  const audioLoading = Boolean(audioUrl) && audio.state.status === 'loading'
  const audioError = Boolean(audioUrl) && audio.state.status === 'error'

  function handlePlayPause() {
    if (isRunning) {
      timer.pause()
      if (audioUrl) audio.pause()
      trackEvent('meditation_paused', { meditationId: meditation.id })
      return
    }

    if (timer.state.status === 'paused') {
      timer.resume()
    } else {
      startedAtRef.current = new Date()
      recordPlayed(meditation.id)
      trackEvent('meditation_started', { meditationId: meditation.id })
      onStart?.()
      timer.start()
    }
    if (audioUrl) audio.play()
  }

  function handleRestart() {
    startedAtRef.current = new Date()
    timer.restart()
    if (audioUrl) {
      audio.seek(0)
      audio.play()
    }
  }

  function handleEnd() {
    const elapsedSeconds = timer.state.elapsedSeconds
    timer.end()
    if (audioUrl) audio.stop()

    if (startedAtRef.current && elapsedSeconds > 0) {
      recordSession({
        meditationId: meditation.id,
        startedAt: startedAtRef.current,
        durationSeconds: meditation.durationSeconds,
        elapsedSeconds,
      })
    }
    startedAtRef.current = null

    onExit?.()
  }

  function handleRetryAudio() {
    if (!audioUrl) return
    resolvePlaybackUrl(meditation).then((resolvedUrl) => {
      if (!resolvedUrl) return
      if (resolvedUrl.startsWith('blob:')) objectUrlRef.current = resolvedUrl
      audio.load(resolvedUrl)
    })
  }

  return (
    <div className={styles.player}>
      <header>
        <h1>{meditation.title}</h1>
        <p>{meditation.description}</p>
        <p className={styles.meta}>
          {formatSecondsAsClock(meditation.durationSeconds)} ·{' '}
          {toTitleCase(meditation.type)}
        </p>
      </header>

      {audioUrl && audioError && (
        <div
          className={[styles.audioNotice, styles.audioNoticeError].join(' ')}
          role="alert"
        >
          <span>{audio.state.errorMessage ?? 'Audio is unavailable.'}</span>
          <Button variant="secondary" size="sm" onClick={handleRetryAudio}>
            Retry
          </Button>
        </div>
      )}

      {audioUrl && audioLoading && (
        <p className={styles.audioNotice} role="status">
          Loading audio…
        </p>
      )}

      <div className={styles.progressSection}>
        <ProgressBar
          value={timer.state.elapsedSeconds}
          max={meditation.durationSeconds}
          label="Session progress"
        />
        <p className={styles.remaining}>
          {formatSecondsAsClock(timer.state.remainingSeconds)} remaining
        </p>
      </div>

      {isCompleted && (
        <p className={styles.status} role="status">
          Session complete
        </p>
      )}

      <div className={styles.controls}>
        <IconButton icon="↺" label="Restart" onClick={handleRestart} />
        <IconButton
          icon={isRunning ? '⏸' : '▶'}
          label={isRunning ? 'Pause' : 'Play'}
          variant="primary"
          size="lg"
          onClick={handlePlayPause}
          disabled={audioLoading}
        />
        <IconButton icon="■" label="End" onClick={handleEnd} />
      </div>
    </div>
  )
}
