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
    return { days: 0, hours: 0, minutes: 0, seconds: 0, total: 0 };
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

/**
 * Format timestamp in Asia/Kolkata (IST, UTC+5:30).
 */
export function formatKolkataDate(scheduledAt: string): string {
  try {
    const date = new Date(scheduledAt);
    if (isNaN(date.getTime())) return '';

    return new Intl.DateTimeFormat('en-IN', {
      timeZone: 'Asia/Kolkata',
      weekday: 'long',
      month:   'long',
      day:     'numeric',
      hour:    'numeric',
      minute:  '2-digit',
      timeZoneName: 'short',
    }).format(date);
  } catch {
    return '';
  }
}

/**
 * Parse date and time entered in Asia/Kolkata (IST) into a UTC ISO string.
 * dateStr: YYYY-MM-DD
 * timeStr: HH:mm (24-hour)
 */
export function kolkataToUTC(dateStr: string, timeStr: string): string | null {
  try {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr) || !/^\d{2}:\d{2}$/.test(timeStr)) {
      return null;
    }
    const isoWithOffset = `${dateStr}T${timeStr}:00+05:30`;
    const d = new Date(isoWithOffset);
    if (isNaN(d.getTime())) return null;
    return d.toISOString();
  } catch {
    return null;
  }
}

/**
 * Convert UTC ISO string into date and time parts in Asia/Kolkata timezone.
 */
export function utcToKolkataParts(isoString: string): { date: string; time: string } | null {
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return null;
    const formatter = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
    const parts = formatter.formatToParts(d);
    const get = (type: string) => parts.find((p) => p.type === type)?.value || '';
    const date = `${get('year')}-${get('month')}-${get('day')}`;
    const time = `${get('hour')}:${get('minute')}`;
    return { date, time };
  } catch {
    return null;
  }
}
