import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { AudioElementLike } from './AudioEngine'
import { AudioEngine } from './AudioEngine'

class FakeAudioElement implements AudioElementLike {
  src = ''
  currentTime = 0
  duration = NaN
  volume = 1
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

function setup(options: ConstructorParameters<typeof AudioEngine>[0] = {}) {
  const element = new FakeAudioElement()
  const onStateChange = vi.fn()
  const onComplete = vi.fn()
  const engine = new AudioEngine({
    createElement: () => element,
    onStateChange,
    onComplete,
    ...options,
  })
  return { element, engine, onStateChange, onComplete }
}

describe('AudioEngine', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('starts idle with default volume', () => {
    const { engine } = setup()
    expect(engine.getState()).toEqual({
      status: 'idle',
      currentTime: 0,
      duration: 0,
      volume: 1,
      errorMessage: null,
    })
  })

  it('applies an initial volume to the underlying element', () => {
    const { engine, element } = setup({ initialVolume: 0.4 })
    expect(element.volume).toBe(0.4)
    expect(engine.getState().volume).toBe(0.4)
  })

  it('transitions idle -> loading -> ready on load and loadedmetadata', () => {
    const { engine, element } = setup()
    engine.load('/audio/track.mp3')

    expect(engine.getState().status).toBe('loading')
    expect(element.src).toBe('/audio/track.mp3')
    expect(element.load).toHaveBeenCalledTimes(1)

    element.duration = 600
    element.dispatch('loadedmetadata')

    expect(engine.getState().status).toBe('ready')
    expect(engine.getState().duration).toBe(600)
  })

  it('also becomes ready on canplay if loadedmetadata never fires', () => {
    const { engine, element } = setup()
    engine.load('/audio/track.mp3')
    element.dispatch('canplay')

    expect(engine.getState().status).toBe('ready')
  })

  it('ignores a redundant load() of the same source once ready', () => {
    const { engine, element } = setup()
    engine.load('/audio/track.mp3')
    element.dispatch('loadedmetadata')
    element.load.mockClear()

    engine.load('/audio/track.mp3')

    expect(element.load).not.toHaveBeenCalled()
    expect(engine.getState().status).toBe('ready')
  })

  it('resets state and reloads when the source changes', () => {
    const { engine, element } = setup()
    engine.load('/audio/one.mp3')
    element.duration = 300
    element.dispatch('loadedmetadata')

    engine.load('/audio/two.mp3')

    expect(element.load).toHaveBeenCalledTimes(2)
    expect(engine.getState().status).toBe('loading')
    expect(engine.getState().duration).toBe(0)
  })

  it('plays once ready, resolving to the playing state', async () => {
    const { engine, element } = setup()
    engine.load('/audio/track.mp3')
    element.dispatch('loadedmetadata')

    engine.play()
    await flushPromises()

    expect(element.play).toHaveBeenCalledTimes(1)
    expect(engine.getState().status).toBe('playing')
  })

  it('enters the error state when play() rejects (e.g. autoplay blocked)', async () => {
    const element = new FakeAudioElement()
    element.play = vi.fn(() => Promise.reject(new Error('NotAllowedError')))
    const onStateChange = vi.fn()
    const engine = new AudioEngine({
      createElement: () => element,
      onStateChange,
    })
    engine.load('/audio/track.mp3')
    element.dispatch('loadedmetadata')

    engine.play()
    await flushPromises()

    const state = engine.getState()
    expect(state.status).toBe('error')
    expect(state.errorMessage).toBeTruthy()
    expect(state.errorMessage).not.toMatch(/NotAllowedError/)
  })

  it('does nothing when play() is called before anything is loaded', () => {
    const { engine, element } = setup()
    engine.play()
    expect(element.play).not.toHaveBeenCalled()
    expect(engine.getState().status).toBe('idle')
  })

  it('pauses while playing and ignores pause() otherwise', async () => {
    const { engine, element } = setup()
    engine.load('/audio/track.mp3')
    element.dispatch('loadedmetadata')
    engine.play()
    await flushPromises()

    engine.pause()
    expect(element.pause).toHaveBeenCalledTimes(1)
    expect(engine.getState().status).toBe('paused')

    engine.pause()
    expect(element.pause).toHaveBeenCalledTimes(1)
  })

  it('resume() is an alias for play()', async () => {
    const { engine, element } = setup()
    engine.load('/audio/track.mp3')
    element.dispatch('loadedmetadata')
    engine.play()
    await flushPromises()
    engine.pause()

    engine.resume()
    await flushPromises()

    expect(engine.getState().status).toBe('playing')
    expect(element.play).toHaveBeenCalledTimes(2)
  })

  it('stop() pauses and resets position back to ready', async () => {
    const { engine, element } = setup()
    engine.load('/audio/track.mp3')
    element.duration = 100
    element.dispatch('loadedmetadata')
    engine.play()
    await flushPromises()
    element.currentTime = 42
    element.dispatch('timeupdate')

    engine.stop()

    expect(element.pause).toHaveBeenCalled()
    expect(element.currentTime).toBe(0)
    expect(engine.getState()).toMatchObject({
      status: 'ready',
      currentTime: 0,
    })
  })

  it('seek() clamps to the known duration', () => {
    const { engine, element } = setup()
    engine.load('/audio/track.mp3')
    element.duration = 100
    element.dispatch('loadedmetadata')

    engine.seek(-10)
    expect(engine.getState().currentTime).toBe(0)

    engine.seek(500)
    expect(engine.getState().currentTime).toBe(100)
    expect(element.currentTime).toBe(100)
  })

  it('seeking backward after completion returns to ready', () => {
    const { engine, element } = setup()
    engine.load('/audio/track.mp3')
    element.duration = 10
    element.dispatch('loadedmetadata')
    element.dispatch('ended')
    expect(engine.getState().status).toBe('completed')

    engine.seek(2)

    expect(engine.getState().status).toBe('ready')
  })

  it('setVolume() clamps between 0 and 1 and updates the element', () => {
    const { engine, element } = setup()
    engine.setVolume(1.5)
    expect(engine.getState().volume).toBe(1)
    expect(element.volume).toBe(1)

    engine.setVolume(-0.2)
    expect(engine.getState().volume).toBe(0)
    expect(element.volume).toBe(0)
  })

  it('tracks currentTime via timeupdate events', () => {
    const { engine, element, onStateChange } = setup()
    engine.load('/audio/track.mp3')
    element.dispatch('loadedmetadata')
    onStateChange.mockClear()

    element.currentTime = 12.5
    element.dispatch('timeupdate')

    expect(engine.getState().currentTime).toBe(12.5)
    expect(onStateChange).toHaveBeenCalled()
  })

  it('reaches completed and calls onComplete exactly once when ended fires', () => {
    const { engine, element, onComplete } = setup()
    engine.load('/audio/track.mp3')
    element.duration = 60
    element.dispatch('loadedmetadata')

    element.dispatch('ended')

    expect(onComplete).toHaveBeenCalledTimes(1)
    const state = engine.getState()
    expect(state.status).toBe('completed')
    expect(state.currentTime).toBe(60)
  })

  it('replays from the start when play() is called again after completion', async () => {
    const { engine, element } = setup()
    engine.load('/audio/track.mp3')
    element.duration = 10
    element.dispatch('loadedmetadata')
    element.dispatch('ended')

    engine.play()
    await flushPromises()

    expect(element.currentTime).toBe(0)
    expect(engine.getState().status).toBe('playing')
  })

  it('surfaces a generic error message on a media error event', () => {
    const { engine, element } = setup()
    engine.load('/audio/broken.mp3')

    element.dispatch('error')

    const state = engine.getState()
    expect(state.status).toBe('error')
    expect(state.errorMessage).toBeTruthy()
  })

  it('destroy() detaches listeners so further events are ignored', () => {
    const { engine, element, onStateChange } = setup()
    engine.load('/audio/track.mp3')
    element.dispatch('loadedmetadata')
    engine.destroy()
    onStateChange.mockClear()

    element.dispatch('timeupdate')
    element.dispatch('ended')

    expect(onStateChange).not.toHaveBeenCalled()
  })
})

function flushPromises(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0))
}
