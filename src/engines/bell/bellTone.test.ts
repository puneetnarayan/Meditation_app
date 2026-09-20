import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { playBellTone as PlayBellTone } from './bellTone'

class MockGainParam {
  setValueAtTime = vi.fn()
  exponentialRampToValueAtTime = vi.fn()
}

class MockGainNode {
  gain = new MockGainParam()
  connect = vi.fn()
}

class MockOscillatorNode {
  type = ''
  frequency = { value: 0 }
  connect = vi.fn()
  start = vi.fn()
  stop = vi.fn()
}

class MockAudioContext {
  state: 'running' | 'suspended' = 'running'
  currentTime = 0
  destination = {}
  resume = vi.fn()
  createGain = vi.fn(() => new MockGainNode())
  createOscillator = vi.fn(() => new MockOscillatorNode())
}

// bellTone.ts keeps a module-level AudioContext singleton (by design —
// one shared context for the app's lifetime, not one per call). That
// means each test needs its own fresh module instance to avoid leaking
// state between cases, hence resetModules + a dynamic import per test.
async function loadPlayBellTone(): Promise<typeof PlayBellTone> {
  vi.resetModules()
  const module = await import('./bellTone')
  return module.playBellTone
}

describe('playBellTone', () => {
  let mockContext: MockAudioContext
  let AudioContextSpy: ReturnType<typeof vi.fn>

  beforeEach(() => {
    mockContext = new MockAudioContext()
    AudioContextSpy = vi.fn(function AudioContextCtor() {
      return mockContext
    })
    vi.stubGlobal('AudioContext', AudioContextSpy)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('creates a master gain envelope and three sine partials', async () => {
    const playBellTone = await loadPlayBellTone()
    playBellTone()

    expect(mockContext.createGain).toHaveBeenCalledTimes(1 + 3) // master + one per partial
    expect(mockContext.createOscillator).toHaveBeenCalledTimes(3)
  })

  it('starts and stops every oscillator as a sine wave', async () => {
    const playBellTone = await loadPlayBellTone()
    playBellTone()

    const oscillators = mockContext.createOscillator.mock.results.map(
      (result) => result.value as MockOscillatorNode,
    )
    expect(oscillators).toHaveLength(3)
    for (const oscillator of oscillators) {
      expect(oscillator.type).toBe('sine')
      expect(oscillator.start).toHaveBeenCalledTimes(1)
      expect(oscillator.stop).toHaveBeenCalledTimes(1)
    }
  })

  it('reuses the same AudioContext across multiple calls', async () => {
    const playBellTone = await loadPlayBellTone()
    playBellTone()
    playBellTone()

    expect(AudioContextSpy).toHaveBeenCalledTimes(1)
  })

  it('resumes a suspended context before playing', async () => {
    mockContext.state = 'suspended'
    const playBellTone = await loadPlayBellTone()
    playBellTone()

    expect(mockContext.resume).toHaveBeenCalled()
  })

  it('does nothing when the Web Audio API is unavailable', async () => {
    vi.stubGlobal('AudioContext', undefined)
    const playBellTone = await loadPlayBellTone()

    expect(() => playBellTone()).not.toThrow()
  })
})
