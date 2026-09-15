import { formatInTimeZone } from "date-fns-tz";

// Single business timezone — America/Regina (CST year-round, no DST).
export const DISPLAY_TIMEZONE = "America/Regina";

export function formatDateTime(iso: string, fmt = "EEE, MMM d, yyyy 'at' h:mm a"): string {
  return `${formatInTimeZone(new Date(iso), DISPLAY_TIMEZONE, fmt)} CST`;
}

export function formatDate(iso: string, fmt = "EEE, MMM d, yyyy"): string {
  return formatInTimeZone(new Date(iso), DISPLAY_TIMEZONE, fmt);
}

export function formatTime(iso: string, fmt = "h:mm a"): string {
  return `${formatInTimeZone(new Date(iso), DISPLAY_TIMEZONE, fmt)} CST`;
}

export function formatRange(startIso: string, endIso: string): string {
  return `${formatDateTime(startIso)} – ${formatInTimeZone(new Date(endIso), DISPLAY_TIMEZONE, "h:mm a")} CST`;
}

/** Local calendar date (YYYY-MM-DD) in the display timezone, for grouping slots. */
export function localDateKey(iso: string): string {
  return formatInTimeZone(new Date(iso), DISPLAY_TIMEZONE, "yyyy-MM-dd");
}

export function money(amount: string | number): string {
  const n = typeof amount === "string" ? parseFloat(amount) : amount;
  return `$${n.toFixed(2)} CAD`;
}
