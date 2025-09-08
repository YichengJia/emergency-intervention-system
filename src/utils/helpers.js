/**
 * Format a JavaScript Date object into a human-readable string. If no date is
 * provided, the current date and time will be used.
 */
export function formatDate(date, options = {}) {
  const d = date ? new Date(date) : new Date();
  return d.toLocaleString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    ...options
  });
}

/**
 * Return a truncated version of text with ellipsis if it exceeds the maxLength.
 */
export function truncate(text = '', maxLength = 100) {
  return text.length > maxLength ? `${text.slice(0, maxLength)}…` : text;
}