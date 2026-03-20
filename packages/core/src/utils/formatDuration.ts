/**
 * Formats a duration in milliseconds to a human-readable MM:SS or H:MM:SS string.
 *
 * formatDuration(182000)  → "3:02"
 * formatDuration(3723000) → "1:02:03"
 */
export function formatDuration(ms: number): string {
  const totalSecs = Math.max(0, Math.floor(ms / 1000))
  const hours = Math.floor(totalSecs / 3600)
  const mins = Math.floor((totalSecs % 3600) / 60)
  const secs = totalSecs % 60

  const mm = String(mins).padStart(hours > 0 ? 2 : 1, '0')
  const ss = String(secs).padStart(2, '0')

  return hours > 0 ? `${hours}:${mm}:${ss}` : `${mm}:${ss}`
}
