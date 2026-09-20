/** A soft three-partial bell chord (fundamental + fifth + octave, each
 * with its own decay) synthesized directly via the Web Audio API — no
 * audio file needed, so the bell timer always has sound regardless of
 * whether any meditation content has real hosted audio. */
const BELL_DURATION_SECONDS = 2.1
const BELL_PARTIALS: { frequency: number; level: number }[] = [
  { frequency: 440, level: 0.5 },
  { frequency: 660, level: 0.25 },
  { frequency: 880, level: 0.1 },
]

let sharedContext: AudioContext | undefined

function resolveAudioContext(): AudioContext | undefined {
  if (typeof window === 'undefined') return undefined
  const AudioContextClass =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext
  if (!AudioContextClass) return undefined

  sharedContext ??= new AudioContextClass()
  if (sharedContext.state === 'suspended') {
    void sharedContext.resume()
  }
  return sharedContext
}

/** Plays one bell chord immediately. A no-op wherever the Web Audio API
 * isn't available, rather than throwing. */
export function playBellTone(): void {
  const context = resolveAudioContext()
  if (!context) return

  const now = context.currentTime
  const masterGain = context.createGain()
  masterGain.gain.setValueAtTime(0.0001, now)
  masterGain.gain.exponentialRampToValueAtTime(0.22, now + 0.02)
  masterGain.gain.exponentialRampToValueAtTime(
    0.0001,
    now + BELL_DURATION_SECONDS,
  )
  masterGain.connect(context.destination)

  for (const { frequency, level } of BELL_PARTIALS) {
    const oscillator = context.createOscillator()
    const gain = context.createGain()
    oscillator.type = 'sine'
    oscillator.frequency.value = frequency
    gain.gain.value = level
    oscillator.connect(gain)
    gain.connect(masterGain)
    oscillator.start(now)
    oscillator.stop(now + BELL_DURATION_SECONDS)
  }
}
