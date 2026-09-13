import { act, renderHook, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Meditation } from '../types'
import { useOfflineDownload } from './useOfflineDownload'

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

const meditation: Meditation = {
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
}

describe('useOfflineDownload', () => {
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

  it('starts idle for a meditation that has not been downloaded', () => {
    const { result } = renderHook(() => useOfflineDownload(meditation))
    expect(result.current.status).toBe('idle')
  })

  it('starts downloaded when the meditation was already downloaded', async () => {
    const { result: first } = renderHook(() => useOfflineDownload(meditation))
    await act(async () => {
      await first.current.download()
    })

    const { result: second } = renderHook(() => useOfflineDownload(meditation))
    expect(second.current.status).toBe('downloaded')
  })

  it('transitions idle -> downloading -> downloaded on a successful download', async () => {
    const { result } = renderHook(() => useOfflineDownload(meditation))

    act(() => {
      void result.current.download()
    })
    expect(result.current.status).toBe('downloading')

    await waitFor(() => expect(result.current.status).toBe('downloaded'))
  })

  it('transitions to error with a message when the download fails', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve(new Response('', { status: 500 }))),
    )
    const { result } = renderHook(() => useOfflineDownload(meditation))

    await act(async () => {
      await result.current.download()
    })

    expect(result.current.status).toBe('error')
    expect(result.current.errorMessage).toMatch(/500/)
  })

  it('remove() transitions back to idle', async () => {
    const { result } = renderHook(() => useOfflineDownload(meditation))
    await act(async () => {
      await result.current.download()
    })
    expect(result.current.status).toBe('downloaded')

    await act(async () => {
      await result.current.remove()
    })
    expect(result.current.status).toBe('idle')
  })

  it('does nothing when the meditation is undefined', async () => {
    const { result } = renderHook(() => useOfflineDownload(undefined))
    expect(result.current.status).toBe('idle')

    await act(async () => {
      await result.current.download()
    })
    expect(result.current.status).toBe('idle')
  })
})
