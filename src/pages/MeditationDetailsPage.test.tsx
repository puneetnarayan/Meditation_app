import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { meditations } from '../data/meditations'
import { addCustomMeditation } from '../services/content/contentStore'
import { MeditationDetailsPage } from './MeditationDetailsPage'

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

function renderDetails(id: string) {
  return render(
    <MemoryRouter initialEntries={[`/meditation/${id}`]}>
      <Routes>
        <Route path="/meditation/:id" element={<MeditationDetailsPage />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('MeditationDetailsPage', () => {
  beforeEach(() => {
    window.localStorage.clear()
    vi.stubGlobal('caches', new MockCacheStorage())
    vi.stubGlobal(
      'fetch',
      vi.fn(() =>
        Promise.resolve(new Response('audio-bytes', { status: 200 })),
      ),
    )
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    window.localStorage.clear()
  })

  it('shows a not-found state for an unknown id', () => {
    renderDetails('nope')
    expect(screen.getByText('Meditation not found')).toBeInTheDocument()
  })

  it('says offline listening is unavailable for content with no audio', () => {
    const [meditation] = meditations
    renderDetails(meditation.id)

    expect(
      screen.getByText(
        "Offline listening isn't available for this meditation yet.",
      ),
    ).toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Download for offline' }),
    ).not.toBeInTheDocument()
  })

  it('downloads and then removes a meditation that has audio', async () => {
    const user = userEvent.setup()
    const added = addCustomMeditation({
      title: 'Downloadable Meditation',
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

    renderDetails(added.id)

    const downloadButton = screen.getByRole('button', {
      name: 'Download for offline',
    })
    await user.click(downloadButton)

    await waitFor(() =>
      expect(
        screen.getByText('Downloaded for offline listening'),
      ).toBeInTheDocument(),
    )

    await user.click(screen.getByRole('button', { name: 'Remove download' }))

    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: 'Download for offline' }),
      ).toBeInTheDocument(),
    )
  })

  it('shows an error message when the download fails', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve(new Response('', { status: 500 }))),
    )
    const user = userEvent.setup()
    const added = addCustomMeditation({
      title: 'Failing Download Meditation',
      description: 'Audio that will fail to download.',
      categoryId: 'cat-stress',
      durationSeconds: 300,
      type: 'guided',
      difficulty: 'beginner',
      tags: [],
      audioUrl: 'https://example.com/audio/fails.mp3',
      isPremium: false,
      isFeatured: false,
    })

    renderDetails(added.id)
    await user.click(
      screen.getByRole('button', { name: 'Download for offline' }),
    )

    expect(await screen.findByRole('alert')).toHaveTextContent(/500/)
  })
})
