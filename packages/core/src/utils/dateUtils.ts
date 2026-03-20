/**
 * Date formatting utilities for @voices/core.
 *
 * Accepts Date, Unix timestamp (ms number), or Firestore Timestamp objects.
 * Using duck-typing for Timestamp to avoid importing firebase in this util.
 */

interface FirestoreTimestamp {
  toDate(): Date
}

function toDate(value: Date | FirestoreTimestamp | number): Date {
  if (value instanceof Date) return value
  if (typeof value === 'number') return new Date(value)
  return value.toDate()
}

const MINUTE = 60
const HOUR = 3600
const DAY = 86400
const WEEK = 604800

/**
 * Returns a human-readable relative time string.
 *
 * relativeTime(Date.now() - 30_000)     → "just now"
 * relativeTime(Date.now() - 120_000)    → "2 min ago"
 * relativeTime(Date.now() - 7_200_000)  → "2 hr ago"
 */
export function relativeTime(value: Date | FirestoreTimestamp | number): string {
  const date = toDate(value)
  const diffSecs = Math.floor((Date.now() - date.getTime()) / 1000)

  if (diffSecs < 60) return 'just now'
  if (diffSecs < HOUR) return `${Math.floor(diffSecs / MINUTE)} min ago`
  if (diffSecs < DAY) return `${Math.floor(diffSecs / HOUR)} hr ago`
  if (diffSecs < WEEK) return `${Math.floor(diffSecs / DAY)}d ago`
  return formatDate(value)
}

/**
 * Returns a formatted date string, e.g. "March 19, 2026".
 */
export function formatDate(value: Date | FirestoreTimestamp | number): string {
  const date = toDate(value)
  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

/**
 * Returns a short date string, e.g. "Mar 19".
 */
export function formatShortDate(value: Date | FirestoreTimestamp | number): string {
  const date = toDate(value)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}
