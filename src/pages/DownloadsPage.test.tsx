import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { addCustomMeditation } from '../services/content/contentStore'
import { downloadMeditationAudio } from '../services/offline/offlineAudioStore'
import { DownloadsPage } from './DownloadsPage'

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
    if (options?.cacheName)
      return this.named.get(options.cacheName)?.match(request)
    for (const cache of this.named.values()) {
      const result = await cache.match(request)
      if (result) return result
    }
    return undefined
  }
}

describe('DownloadsPage', () => {
  beforeEach(() => {
    window.localStorage.clear()
    vi.stubGlobal('caches', new MockCacheStorage())
    vi.stubGlobal(
      'fetch',
      vi.fn(() =>
        Promise.resolve(
          new Response('audio-bytes', {
            status: 200,
            headers: { 'content-length': '2048' },
          }),
        ),
      ),
    )
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    window.localStorage.clear()
  })

  it('shows an empty state when nothing is downloaded', () => {
    render(<DownloadsPage />)
    expect(screen.getByText('No downloads yet')).toBeInTheDocument()
  })

  it('lists a downloaded meditation with its size', async () => {
    const meditation = addCustomMeditation({
      title: 'Downloaded Meditation',
      description: 'Has real audio for this test.',
      categoryId: 'cat-stress',
      durationSeconds: 300,
      type: 'guided',
      difficulty: 'beginner',
      tags: [],
      audioUrl: 'https://example.com/audio/fixture.mp3',
      isPremium: false,
      isFeatured: false,
    })
    await downloadMeditationAudio(meditation)

    render(<DownloadsPage />)

    expect(screen.getByText('Downloaded Meditation')).toBeInTheDocument()
    expect(screen.getByText('Stress · 5:00 · 2 KB')).toBeInTheDocument()
    expect(screen.getByText('1 downloaded · 2 KB used')).toBeInTheDocument()
  })

  it('removes a download and shows the empty state again', async () => {
    const meditation = addCustomMeditation({
      title: 'Downloaded Meditation',
      description: 'Has real audio for this test.',
      categoryId: 'cat-stress',
      durationSeconds: 300,
      type: 'guided',
      difficulty: 'beginner',
      tags: [],
      audioUrl: 'https://example.com/audio/fixture.mp3',
      isPremium: false,
      isFeatured: false,
    })
    await downloadMeditationAudio(meditation)

    const user = userEvent.setup()
    render(<DownloadsPage />)

    await user.click(screen.getByRole('button', { name: 'Remove' }))

    await waitFor(() =>
      expect(screen.getByText('No downloads yet')).toBeInTheDocument(),
    )
  })
})
