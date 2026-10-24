/**
 * Schedule utilities.
 *
 * Computes time remaining from absolute timestamps to prevent timer drift
 * and maintain accurate countdown across page refreshes.
 */

export type TimeRemaining = {
  days:    number;
  hours:   number;
  minutes: number;
  seconds: number;
  total:   number; // total ms remaining (<= 0 when past)
};

/**
 * Compute time remaining from an ISO scheduled string or timestamp.
 * Returns total <= 0 when the deadline has passed or reached.
 */
export function getTimeRemaining(scheduledAt: string | number): TimeRemaining {
  const target = typeof scheduledAt === 'number'
    ? scheduledAt
    : new Date(scheduledAt).getTime();
  const now = Date.now();

  if (isNaN(target)) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, total: 0 };
  }

  const diff = target - now;

  if (diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, total: diff };
  }

  const totalSec = Math.floor(diff / 1000);
  const days    = Math.floor(totalSec / 86400);
  const hours   = Math.floor((totalSec % 86400) / 3600);
  const minutes = Math.floor((totalSec % 3600)  / 60);
  const seconds = totalSec % 60;

  return { days, hours, minutes, seconds, total: diff };
}

/** Pad single digits with leading zero. */
export function pad(n: number): string {
  return String(Math.max(0, n)).padStart(2, '0');
}

/**
 * Format a scheduled ISO timestamp into a warm, readable string
 * in the visitor's local timezone.
 * Example: "Saturday, October 24 at 7:00 PM"
 */
export function formatScheduledDate(scheduledAt: string): string {
  try {
    const date = new Date(scheduledAt);
    if (isNaN(date.getTime())) return '';

    return new Intl.DateTimeFormat(undefined, {
      weekday: 'long',
      month:   'long',
      day:     'numeric',
      hour:    'numeric',
      minute:  '2-digit',
    }).format(date);
  } catch {
    return '';
  }
}
