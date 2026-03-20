/** Form validation helpers for auth pages. */

export interface FieldError {
  email?: string
  password?: string
  confirmPassword?: string
}

/** Basic email format check. */
export function validateEmail(email: string): string | undefined {
  if (!email.trim()) return 'Email is required.'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Enter a valid email address.'
  return undefined
}

/** Password must be at least 8 characters. */
export function validatePassword(password: string): string | undefined {
  if (!password) return 'Password is required.'
  if (password.length < 8) return 'Password must be at least 8 characters.'
  return undefined
}

/** Confirm password must match. */
export function validateConfirmPassword(
  password: string,
  confirmPassword: string,
): string | undefined {
  if (!confirmPassword) return 'Please confirm your password.'
  if (password !== confirmPassword) return 'Passwords do not match.'
  return undefined
}

export function validateLoginForm(
  email: string,
  password: string,
): FieldError {
  const errors: FieldError = {}
  const emailErr = validateEmail(email)
  const passwordErr = validatePassword(password)
  if (emailErr) errors.email = emailErr
  if (passwordErr) errors.password = passwordErr
  return errors
}

export function validateSignUpForm(
  email: string,
  password: string,
  confirmPassword: string,
): FieldError {
  const errors: FieldError = {}
  const emailErr = validateEmail(email)
  const passwordErr = validatePassword(password)
  const confirmErr = validateConfirmPassword(password, confirmPassword)
  if (emailErr) errors.email = emailErr
  if (passwordErr) errors.password = passwordErr
  if (confirmErr) errors.confirmPassword = confirmErr
  return errors
}

/** True when the FieldError object has no entries. */
export function isValid(errors: FieldError): boolean {
  return Object.keys(errors).length === 0
}
