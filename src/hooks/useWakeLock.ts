import { useEffect, useRef } from 'react'

/** Requests a screen wake lock while `active` is true, so a long,
 * mostly-untouched bell timer session doesn't let the device sleep
 * mid-sit. Best-effort only: unsupported browsers and a denied request
 * (e.g. low battery) are silently ignored rather than surfaced as
 * errors, since the timer itself works fine either way. */
export function useWakeLock(active: boolean): void {
  const sentinelRef = useRef<WakeLockSentinel | null>(null)

  useEffect(() => {
    if (!active) return
    if (typeof navigator === 'undefined' || !('wakeLock' in navigator)) return

    let cancelled = false

    async function requestLock() {
      try {
        const sentinel = await navigator.wakeLock.request('screen')
        if (cancelled) {
          await sentinel.release()
          return
        }
        sentinelRef.current = sentinel
      } catch {
        // Denied or unsupported — the timer still works without it.
      }
    }

    void requestLock()

    // A wake lock is released automatically when the tab is hidden, so
    // it needs re-requesting once it becomes visible again.
    function handleVisibilityChange() {
      if (document.visibilityState === 'visible') void requestLock()
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      cancelled = true
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      sentinelRef.current?.release().catch(() => {})
      sentinelRef.current = null
    }
  }, [active])
}
