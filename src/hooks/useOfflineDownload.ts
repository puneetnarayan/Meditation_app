import { useState } from 'react'
import type { Meditation } from '../types'
import {
  downloadMeditationAudio,
  isDownloaded,
  isOfflineSupported,
  removeDownload,
} from '../services/offline/offlineAudioStore'

export type OfflineDownloadStatus =
  'idle' | 'downloading' | 'downloaded' | 'error'

export interface UseOfflineDownloadResult {
  status: OfflineDownloadStatus
  errorMessage: string | undefined
  isSupported: boolean
  download: () => Promise<void>
  remove: () => Promise<void>
}

/** Accepts a possibly-undefined meditation so pages can call this
 * unconditionally (Rules of Hooks) even before they know whether the
 * meditation exists — see MeditationDetailsPage's not-found branch. */
export function useOfflineDownload(
  meditation: Meditation | undefined,
): UseOfflineDownloadResult {
  const [status, setStatus] = useState<OfflineDownloadStatus>(() =>
    meditation && isDownloaded(meditation.id) ? 'downloaded' : 'idle',
  )
  const [errorMessage, setErrorMessage] = useState<string>()

  async function download() {
    if (!meditation) return
    setStatus('downloading')
    setErrorMessage(undefined)
    try {
      await downloadMeditationAudio(meditation)
      setStatus('downloaded')
    } catch (error) {
      setStatus('error')
      setErrorMessage(
        error instanceof Error ? error.message : 'Download failed.',
      )
    }
  }

  async function remove() {
    if (!meditation) return
    await removeDownload(meditation.id)
    setStatus('idle')
  }

  return {
    status,
    errorMessage,
    isSupported: isOfflineSupported(),
    download,
    remove,
  }
}
