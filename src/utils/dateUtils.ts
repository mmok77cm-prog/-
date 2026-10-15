/**
 * Date and time utilities for live real-time timestamping and formatting in Arabic.
 */

/**
 * Returns formatted date and time according to real current local time.
 * Example: "2026-10-15 · 01:05 م"
 */
export function getLiveTimestamp(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  
  let hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const period = hours >= 12 ? 'م' : 'ص';
  hours = hours % 12;
  hours = hours ? hours : 12; // 0 becomes 12
  const formattedHours = String(hours).padStart(2, '0');

  return `${y}-${m}-${d} · ${formattedHours}:${minutes} ${period}`;
}

/**
 * Returns current date string in YYYY-MM-DD format.
 */
export function getLiveDateOnly(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Returns live clock string with seconds for live indicators.
 * Example: "01:05:23 م"
 */
export function getLiveTimeString(date: Date = new Date()): string {
  let hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  const period = hours >= 12 ? 'م' : 'ص';
  hours = hours % 12;
  hours = hours ? hours : 12;
  const formattedHours = String(hours).padStart(2, '0');

  return `${formattedHours}:${minutes}:${seconds} ${period}`;
}

/**
 * Generates dynamic timestamp relative to current date (e.g. 2 days ago at 10:30 AM).
 */
export function getRelativePastTimestamp(daysAgo: number, timeStr: string): string {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d} · ${timeStr}`;
}

/**
 * Generates dynamic date relative to current date (e.g. 3 days ago).
 */
export function getRelativePastDate(daysAgo: number): string {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
