import type { Meditation } from '../../types'
import { readJSON, writeJSON } from '../storage/localStorage'

const CACHE_NAME = 'meditation-app-audio-v1'
const REGISTRY_STORAGE_KEY = 'meditation-app.offline-downloads'

export interface DownloadedAudioEntry {
  id: string
  title: string
  audioUrl: string
  downloadedAt: string
  /** From the response's Content-Length header, when the server sends one. */
  byteSize?: number
}

export function isOfflineSupported(): boolean {
  return typeof caches !== 'undefined'
}

function getRegistry(): DownloadedAudioEntry[] {
  return readJSON<DownloadedAudioEntry[]>(REGISTRY_STORAGE_KEY, [])
}

function saveRegistry(entries: DownloadedAudioEntry[]): void {
  writeJSON(REGISTRY_STORAGE_KEY, entries)
}

export function getDownloadedEntries(): DownloadedAudioEntry[] {
  return getRegistry()
}

export function isDownloaded(id: string): boolean {
  return getRegistry().some((entry) => entry.id === id)
}

export function getTotalDownloadedBytes(): number {
  return getRegistry().reduce(
    (total, entry) => total + (entry.byteSize ?? 0),
    0,
  )
}

/** Explicitly caches one meditation's audio for offline playback. Only
 * ever called from a direct user action (the Download button) — never
 * automatically, per the spec's "deliberate feature, not automatic
 * bulk caching" rule for offline audio. */
export async function downloadMeditationAudio(
  meditation: Meditation,
): Promise<void> {
  if (!meditation.audioUrl) {
    throw new Error('This meditation has no audio to download.')
  }
  if (!isOfflineSupported()) {
    throw new Error('Offline downloads are not supported in this browser.')
  }

  const response = await fetch(meditation.audioUrl)
  if (!response.ok) {
    throw new Error(`Failed to download audio (status ${response.status}).`)
  }

  const cache = await caches.open(CACHE_NAME)
  await cache.put(meditation.audioUrl, response.clone())

  const contentLength = response.headers.get('content-length')
  const byteSize = contentLength ? Number(contentLength) : undefined

  const registry = getRegistry().filter((entry) => entry.id !== meditation.id)
  saveRegistry([
    ...registry,
    {
      id: meditation.id,
      title: meditation.title,
      audioUrl: meditation.audioUrl,
      downloadedAt: new Date().toISOString(),
      byteSize,
    },
  ])
}

export async function removeDownload(id: string): Promise<void> {
  const entry = getRegistry().find((e) => e.id === id)
  if (entry && isOfflineSupported()) {
    const cache = await caches.open(CACHE_NAME)
    await cache.delete(entry.audioUrl)
  }
  saveRegistry(getRegistry().filter((e) => e.id !== id))
}

/** Resolves the URL the player should actually load: a local blob URL
 * from the offline cache when this meditation was downloaded, so
 * playback works without a network request, otherwise the meditation's
 * normal network URL. Callers that get a blob URL back are responsible
 * for revoking it once they're done (e.g. on unmount). */
export async function resolvePlaybackUrl(
  meditation: Meditation,
): Promise<string | undefined> {
  if (!meditation.audioUrl) return undefined
  if (!isOfflineSupported()) return meditation.audioUrl

  const cached = await caches.match(meditation.audioUrl, {
    cacheName: CACHE_NAME,
  })
  if (!cached) return meditation.audioUrl

  const blob = await cached.blob()
  return URL.createObjectURL(blob)
}
