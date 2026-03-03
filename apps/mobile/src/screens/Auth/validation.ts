/**
 * Client-side validation for auth and onboarding forms.
 * Returns null on success, or a user-facing error string on failure.
 */

export function validateEmail(email: string): string | null {
  if (!email.trim()) return 'Email is required.'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Enter a valid email address.'
  return null
}

export function validatePassword(password: string): string | null {
  if (!password) return 'Password is required.'
  if (password.length < 8) return 'Must be at least 8 characters.'
  if (!/[A-Z]/.test(password)) return 'Must contain an uppercase letter.'
  if (!/[a-z]/.test(password)) return 'Must contain a lowercase letter.'
  if (!/[0-9]/.test(password)) return 'Must contain a number.'
  return null
}

export function validateConfirmPassword(password: string, confirm: string): string | null {
  if (!confirm) return 'Please confirm your password.'
  if (confirm !== password) return 'Passwords do not match.'
  return null
}

export function validateDisplayName(name: string): string | null {
  const trimmed = name.trim()
  if (!trimmed) return 'Display name is required.'
  if (trimmed.length < 2) return 'Must be at least 2 characters.'
  if (trimmed.length > 50) return 'Must be 50 characters or fewer.'
  return null
}

export function validateUsername(username: string): string | null {
  if (!username) return 'Username is required.'
  if (username.length < 3) return 'Must be at least 3 characters.'
  if (username.length > 20) return 'Must be 20 characters or fewer.'
  if (!/^[a-z0-9_]+$/.test(username)) return 'Only lowercase letters, numbers, and underscores.'
  return null
}
