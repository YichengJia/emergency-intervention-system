/**
 * Validate that a given string is a valid email address.
 */
export function isValidEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(String(email).toLowerCase());
}

/**
 * Validate that a password meets minimum requirements (e.g. at least 6 characters).
 */
export function isValidPassword(password) {
  return typeof password === 'string' && password.length >= 6;
}

/**
 * Validate that a name is non-empty.
 */
export function isValidName(name) {
  return typeof name === 'string' && name.trim().length > 0;
}