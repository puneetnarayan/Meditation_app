import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Meditation } from '../../types'
import {
  downloadMeditationAudio,
  getDownloadedEntries,
  getTotalDownloadedBytes,
  isDownloaded,
  isOfflineSupported,
  removeDownload,
  resolvePlaybackUrl,
} from './offlineAudioStore'

class MockCache {
  private store = new Map<string, Response>()

  async put(request: string, response: Response) {
    this.store.set(request, response)
  }

  async match(request: string) {
    return this.store.get(request)
  }

  async delete(request: string) {
    return this.store.delete(request)
  }
}

class MockCacheStorage {
  private named = new Map<string, MockCache>()

  async open(name: string) {
    if (!this.named.has(name)) this.named.set(name, new MockCache())
    return this.named.get(name)!
  }

  async match(request: string, options?: { cacheName?: string }) {
    if (options?.cacheName) {
      return this.named.get(options.cacheName)?.match(request)
    }
    for (const cache of this.named.values()) {
      const result = await cache.match(request)
      if (result) return result
    }
    return undefined
  }
}

function makeMeditation(overrides: Partial<Meditation> = {}): Meditation {
  return {
    id: 'med-fixture',
    title: 'Fixture Meditation',
    description: 'A fixture for tests.',
    categoryId: 'cat-fixture',
    durationSeconds: 600,
    type: 'guided',
    difficulty: 'beginner',
    tags: [],
    isPremium: false,
    isFeatured: false,
    audioUrl: 'https://example.com/audio/fixture.mp3',
    ...overrides,
  }
}

describe('offlineAudioStore', () => {
  beforeEach(() => {
    window.localStorage.clear()
    vi.stubGlobal('caches', new MockCacheStorage())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    window.localStorage.clear()
  })

  it('reports offline support based on the caches global', () => {
    expect(isOfflineSupported()).toBe(true)
    vi.stubGlobal('caches', undefined)
    expect(isOfflineSupported()).toBe(false)
  })

  it('rejects downloading a meditation with no audio', async () => {
    const meditation = makeMeditation({ audioUrl: undefined })
    await expect(downloadMeditationAudio(meditation)).rejects.toThrow(
      /no audio/,
    )
  })

  it('rejects downloading when the fetch fails', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve(new Response('', { status: 404 }))),
    )
    await expect(downloadMeditationAudio(makeMeditation())).rejects.toThrow(
      /404/,
    )
  })

  it('downloads and registers a meditation, tracking its byte size', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() =>
        Promise.resolve(
          new Response('audio-bytes', {
            status: 200,
            headers: { 'content-length': '11' },
          }),
        ),
      ),
    )
    const meditation = makeMeditation()

    await downloadMeditationAudio(meditation)

    expect(isDownloaded(meditation.id)).toBe(true)
    const entries = getDownloadedEntries()
    expect(entries).toHaveLength(1)
    expect(entries[0]).toMatchObject({
      id: meditation.id,
      title: meditation.title,
      audioUrl: meditation.audioUrl,
      byteSize: 11,
    })
    expect(getTotalDownloadedBytes()).toBe(11)
  })

  it('removeDownload clears both the cache entry and the registry', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() =>
        Promise.resolve(new Response('audio-bytes', { status: 200 })),
      ),
    )
    const meditation = makeMeditation()
    await downloadMeditationAudio(meditation)
    expect(isDownloaded(meditation.id)).toBe(true)

    await removeDownload(meditation.id)

    expect(isDownloaded(meditation.id)).toBe(false)
    expect(getDownloadedEntries()).toHaveLength(0)
  })

  it('resolvePlaybackUrl returns the network URL when nothing is downloaded', async () => {
    const meditation = makeMeditation()
    await expect(resolvePlaybackUrl(meditation)).resolves.toBe(
      meditation.audioUrl,
    )
  })

  it('resolvePlaybackUrl returns undefined when there is no audio at all', async () => {
    const meditation = makeMeditation({ audioUrl: undefined })
    await expect(resolvePlaybackUrl(meditation)).resolves.toBeUndefined()
  })

  it('resolvePlaybackUrl returns a blob URL once the meditation is downloaded', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() =>
        Promise.resolve(new Response('audio-bytes', { status: 200 })),
      ),
    )
    const meditation = makeMeditation()
    await downloadMeditationAudio(meditation)

    const resolved = await resolvePlaybackUrl(meditation)
    expect(resolved).toMatch(/^blob:/)
  })
})
