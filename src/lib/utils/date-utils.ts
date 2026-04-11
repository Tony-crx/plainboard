/**
 * Date and time utilities
 */

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

/**
 * Format date to human-readable string
 */
export function formatDate(
  date: Date | string | number,
  format: 'iso' | 'us' | 'eu' | 'relative' | 'full' = 'iso'
): string {
  const d = new Date(date);

  switch (format) {
    case 'iso':
      return d.toISOString();
    case 'us':
      return `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`;
    case 'eu':
      return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
    case 'full':
      return `${DAYS[d.getDay()]}, ${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
    case 'relative':
      return relativeTime(d);
    default:
      return d.toISOString();
  }
}

/**
 * Get relative time string (e.g., "3 hours ago")
 */
export function relativeTime(date: Date | string | number): string {
  const now = new Date();
  const target = new Date(date);
  const diffMs = target.getTime() - now.getTime();
  const diffSec = Math.round(diffMs / 1000);
  const diffMin = Math.round(diffSec / 60);
  const diffHr = Math.round(diffMin / 60);
  const diffDay = Math.round(diffHr / 24);

  if (diffSec < -60) return `${Math.abs(diffMin)} minutes ago`;
  if (diffSec < 0) return 'just now';
  if (diffSec < 60) return 'in a few seconds';
  if (diffMin < 60) return `in ${diffMin} minute${diffMin !== 1 ? 's' : ''}`;
  if (diffHr < 24) return `in ${diffHr} hour${diffHr !== 1 ? 's' : ''}`;
  if (diffDay < 30) return `in ${diffDay} day${diffDay !== 1 ? 's' : ''}`;
  return formatDate(target, 'full');
}

/**
 * Add time units to a date
 */
export function addTime(
  date: Date | string,
  amount: number,
  unit: 'seconds' | 'minutes' | 'hours' | 'days' | 'weeks' | 'months' | 'years'
): Date {
  const d = new Date(date);

  switch (unit) {
    case 'seconds': d.setSeconds(d.getSeconds() + amount); break;
    case 'minutes': d.setMinutes(d.getMinutes() + amount); break;
    case 'hours': d.setHours(d.getHours() + amount); break;
    case 'days': d.setDate(d.getDate() + amount); break;
    case 'weeks': d.setDate(d.getDate() + (amount * 7)); break;
    case 'months': d.setMonth(d.getMonth() + amount); break;
    case 'years': d.setFullYear(d.getFullYear() + amount); break;
  }

  return d;
}

/**
 * Calculate difference between two dates
 */
export function dateDiff(
  from: Date | string,
  to: Date | string,
  unit: 'milliseconds' | 'seconds' | 'minutes' | 'hours' | 'days' = 'days'
): number {
  const fromMs = new Date(from).getTime();
  const toMs = new Date(to).getTime();
  const diffMs = Math.abs(toMs - fromMs);

  switch (unit) {
    case 'milliseconds': return diffMs;
    case 'seconds': return Math.round(diffMs / 1000);
    case 'minutes': return Math.round(diffMs / (1000 * 60));
    case 'hours': return Math.round(diffMs / (1000 * 60 * 60));
    case 'days': return Math.round(diffMs / (1000 * 60 * 60 * 24));
    default: return diffMs;
  }
}

/**
 * Check if a date is in the past
 */
export function isPast(date: Date | string): boolean {
  return new Date(date).getTime() < Date.now();
}

/**
 * Check if a date is in the future
 */
export function isFuture(date: Date | string): boolean {
  return new Date(date).getTime() > Date.now();
}

/**
 * Check if a date is today
 */
export function isToday(date: Date | string): boolean {
  const d = new Date(date);
  const today = new Date();
  return d.toDateString() === today.toDateString();
}

/**
 * Get start of day
 */
export function startOfDay(date: Date | string): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Get end of day
 */
export function endOfDay(date: Date | string): Date {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

/**
 * Get number of days in a month
 */
export function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

/**
 * Get Unix timestamp
 */
export function unixTimestamp(date?: Date): number {
  return Math.floor((date || new Date()).getTime() / 1000);
}

/**
 * Create a cron expression from components
 */
export function toCron(
  minute: number | '*' = '*',
  hour: number | '*' = '*',
  dayOfMonth: number | '*' = '*',
  month: number | '*' = '*',
  dayOfWeek: number | '*' = '*'
): string {
  return `${minute} ${hour} ${dayOfMonth} ${month} ${dayOfWeek}`;
}

/**
 * Parse ISO duration (e.g., PT1H30M)
 */
export function parseDuration(duration: string): { hours: number; minutes: number; seconds: number } {
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return { hours: 0, minutes: 0, seconds: 0 };

  return {
    hours: parseInt(match[1] || '0', 10),
    minutes: parseInt(match[2] || '0', 10),
    seconds: parseInt(match[3] || '0', 10),
  };
}

/**
 * Get current timestamp in ISO format
 */
export function now(): string {
  return new Date().toISOString();
}
