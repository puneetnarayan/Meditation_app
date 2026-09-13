/** Formats a duration in seconds as a clock string, e.g. 65 -> "1:05",
 * 3661 -> "1:01:01". Negative or non-finite input is clamped to 0. */
export function formatSecondsAsClock(totalSeconds: number): string {
  const safeSeconds = Number.isFinite(totalSeconds)
    ? Math.max(0, Math.round(totalSeconds))
    : 0

  const hours = Math.floor(safeSeconds / 3600)
  const minutes = Math.floor((safeSeconds % 3600) / 60)
  const seconds = safeSeconds % 60

  const paddedSeconds = String(seconds).padStart(2, '0')

  if (hours > 0) {
    const paddedMinutes = String(minutes).padStart(2, '0')
    return `${hours}:${paddedMinutes}:${paddedSeconds}`
  }

  return `${minutes}:${paddedSeconds}`
}

/** Formats a total number of minutes as a compact human label, e.g.
 * 45 -> "45 min", 125 -> "2h 5m", 120 -> "2h". Negative or non-finite
 * input is clamped to 0. */
export function formatMinutesAsDuration(totalMinutes: number): string {
  const safeMinutes = Number.isFinite(totalMinutes)
    ? Math.max(0, Math.round(totalMinutes))
    : 0

  const hours = Math.floor(safeMinutes / 60)
  const minutes = safeMinutes % 60

  if (hours === 0) return `${minutes} min`
  if (minutes === 0) return `${hours}h`
  return `${hours}h ${minutes}m`
}
