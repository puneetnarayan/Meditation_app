import { act, renderHook, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { AudioElementLike } from '../engines/audio/AudioEngine'
import { useAudioEngine } from './useAudioEngine'

class FakeAudioElement implements AudioElementLike {
  src = ''
  currentTime = 0
  duration = 120
  volume = 1
  loop = false
  play = vi.fn(() => Promise.resolve())
  pause = vi.fn()
  load = vi.fn()

  private listeners = new Map<string, Set<EventListener>>()

  addEventListener(type: string, listener: EventListener): void {
    if (!this.listeners.has(type)) this.listeners.set(type, new Set())
    this.listeners.get(type)!.add(listener)
  }

  removeEventListener(type: string, listener: EventListener): void {
    this.listeners.get(type)?.delete(listener)
  }

  dispatch(type: string): void {
    for (const listener of this.listeners.get(type) ?? []) {
      listener(new Event(type))
    }
  }
}

describe('useAudioEngine', () => {
  it('mirrors AudioEngine state transitions into React state', async () => {
    const element = new FakeAudioElement()
    const { result } = renderHook(() =>
      useAudioEngine({ createElement: () => element }),
    )

    expect(result.current.state.status).toBe('idle')

    act(() => {
      result.current.load('/audio/track.mp3')
    })
    expect(result.current.state.status).toBe('loading')

    act(() => {
      element.dispatch('loadedmetadata')
    })
    expect(result.current.state.status).toBe('ready')
    expect(result.current.state.duration).toBe(120)

    act(() => {
      result.current.play()
    })
    await waitFor(() => expect(result.current.state.status).toBe('playing'))
    expect(element.play).toHaveBeenCalledTimes(1)

    act(() => {
      result.current.pause()
    })
    expect(result.current.state.status).toBe('paused')
    expect(element.pause).toHaveBeenCalledTimes(1)
  })

  it('calls onComplete when the underlying element ends', () => {
    const element = new FakeAudioElement()
    const onComplete = vi.fn()
    const { result } = renderHook(() =>
      useAudioEngine({ createElement: () => element, onComplete }),
    )

    act(() => {
      result.current.load('/audio/track.mp3')
    })
    act(() => {
      element.dispatch('ended')
    })

    expect(onComplete).toHaveBeenCalledTimes(1)
  })

  it('cleans up the engine on unmount', () => {
    const element = new FakeAudioElement()
    const { result, unmount } = renderHook(() =>
      useAudioEngine({ createElement: () => element }),
    )

    act(() => {
      result.current.load('/audio/track.mp3')
    })
    unmount()

    expect(element.pause).toHaveBeenCalled()
  })
})
