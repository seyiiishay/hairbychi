import { format } from "date-fns";

export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function money(amount: number, opts: { cents?: boolean } = {}) {
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
    currencyDisplay: "narrowSymbol",
    minimumFractionDigits: opts.cents ? 2 : 0,
    maximumFractionDigits: opts.cents ? 2 : 0,
  }).format(amount);
}

/** 300 → "5 hrs", 150 → "2.5 hrs", 45 → "45 min", 100 → "1 hr 40 min" */
export function duration(minutes: number, long = false) {
  const unit = (n: number) => (long ? (n === 1 ? " hour" : " hours") : n === 1 ? " hr" : " hrs");
  if (minutes < 60) return `${minutes} min`;
  const h = minutes / 60;
  if (Number.isInteger(h)) return `${h}${unit(h)}`;
  if (minutes % 30 === 0) return `${h.toFixed(1)}${unit(2)}`;
  return `${Math.floor(h)}${unit(Math.floor(h))} ${minutes % 60} min`;
}

// --- date keys: appointments are stored as salon-local wall-clock strings ---

export function dateKey(d: Date) {
  return format(d, "yyyy-MM-dd");
}

export function parseDateKey(key: string) {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/** "2026-09-28" + "10:30" → Date (local) */
export function atTime(key: string, hhmm: string) {
  const d = parseDateKey(key);
  const [h, m] = hhmm.split(":").map(Number);
  d.setHours(h, m, 0, 0);
  return d;
}

export function toMinutes(hhmm: string) {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

export function fromMinutes(total: number) {
  const h = Math.floor(total / 60);
  const m = total % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/** "13:00" → "1:00 PM" */
export function clock(hhmm: string) {
  const [h, m] = hhmm.split(":").map(Number);
  const suffix = h >= 12 ? "PM" : "AM";
  const hr = h % 12 === 0 ? 12 : h % 12;
  return `${hr}:${String(m).padStart(2, "0")} ${suffix}`;
}

export function longDate(key: string) {
  return format(parseDateKey(key), "EEEE, MMMM d, yyyy");
}

export function shortDate(key: string) {
  return format(parseDateKey(key), "MMM d, yyyy");
}

export function monthDay(key: string) {
  return format(parseDateKey(key), "MMMM d");
}

export function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function uid(prefix = "") {
  return prefix + Math.random().toString(36).slice(2, 10);
}

/** Human-friendly booking reference, e.g. HBC-7K2QX */
export function bookingRef() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < 5; i++) s += alphabet[Math.floor(Math.random() * alphabet.length)];
  return `HBC-${s}`;
}
