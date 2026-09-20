import { renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { useWakeLock } from './useWakeLock'

function makeMockWakeLock() {
  const release = vi.fn(() => Promise.resolve())
  const sentinel = { release }
  const request = vi.fn(() => Promise.resolve(sentinel))
  return { request, release, sentinel }
}

describe('useWakeLock', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('requests a wake lock when active', async () => {
    const { request } = makeMockWakeLock()
    vi.stubGlobal('navigator', { ...navigator, wakeLock: { request } })

    renderHook(() => useWakeLock(true))
    await vi.waitFor(() => expect(request).toHaveBeenCalledWith('screen'))
  })

  it('does not request a wake lock when inactive', () => {
    const { request } = makeMockWakeLock()
    vi.stubGlobal('navigator', { ...navigator, wakeLock: { request } })

    renderHook(() => useWakeLock(false))
    expect(request).not.toHaveBeenCalled()
  })

  it('releases the wake lock on unmount', async () => {
    const { request, release } = makeMockWakeLock()
    vi.stubGlobal('navigator', { ...navigator, wakeLock: { request } })

    const { unmount } = renderHook(() => useWakeLock(true))
    await vi.waitFor(() => expect(request).toHaveBeenCalled())

    unmount()
    await vi.waitFor(() => expect(release).toHaveBeenCalled())
  })

  it('releases the wake lock when active turns false', async () => {
    const { request, release } = makeMockWakeLock()
    vi.stubGlobal('navigator', { ...navigator, wakeLock: { request } })

    const { rerender } = renderHook(({ active }) => useWakeLock(active), {
      initialProps: { active: true },
    })
    await vi.waitFor(() => expect(request).toHaveBeenCalled())

    rerender({ active: false })
    await vi.waitFor(() => expect(release).toHaveBeenCalled())
  })

  it('does not throw when the Wake Lock API is unsupported', () => {
    vi.stubGlobal('navigator', { userAgent: navigator.userAgent })
    expect(() => renderHook(() => useWakeLock(true))).not.toThrow()
  })

  it('does not throw when the request is rejected (e.g. denied)', async () => {
    const request = vi.fn(() => Promise.reject(new Error('denied')))
    vi.stubGlobal('navigator', { ...navigator, wakeLock: { request } })

    renderHook(() => useWakeLock(true))
    await vi.waitFor(() => expect(request).toHaveBeenCalled())
  })
})
