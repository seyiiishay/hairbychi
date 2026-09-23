import { addDays } from "date-fns";
import type { Appointment, Service, Stylist } from "../data/types";
import type { State } from "../store/store";
import { ACTIVE_STATUSES } from "../store/store";
import { atTime, dateKey, fromMinutes, parseDateKey, toMinutes } from "./format";

export interface Slot {
  time: string;
  stylistId: string;
}

/** Opening hours for a date, honouring special hours (holidays, late openings). */
export function salonHoursOn(s: State, key: string) {
  const special = s.specialHours.find((h) => h.date === key);
  if (special) return special.hours;
  return s.hours[parseDateKey(key).getDay()] ?? null;
}

export function stylistsFor(s: State, service: Service) {
  return s.stylists.filter((st) => st.active && service.stylistIds.includes(st.id));
}

function busyRanges(s: State, stylistId: string, key: string, ignoreRef?: string) {
  const ranges: Array<[number, number]> = [];
  const buffer = s.settings.bufferMinutes;
  for (const a of s.appointments) {
    if (a.date !== key || a.stylistId !== stylistId || a.ref === ignoreRef) continue;
    if (!ACTIVE_STATUSES.includes(a.status) && a.status !== "completed") continue;
    const start = toMinutes(a.time);
    ranges.push([start, start + a.minutes + buffer]);
  }
  for (const b of s.blocks) {
    if (b.date !== key || (b.stylistId !== null && b.stylistId !== stylistId)) continue;
    ranges.push(b.start && b.end ? [toMinutes(b.start), toMinutes(b.end)] : [0, 24 * 60]);
  }
  return ranges;
}

function stylistWindow(s: State, st: Stylist, key: string): [number, number] | null {
  const hours = salonHoursOn(s, key);
  if (!hours || !st.workDays.includes(parseDateKey(key).getDay())) return null;
  const open = Math.max(toMinutes(hours.open), toMinutes(st.start));
  const close = Math.min(toMinutes(hours.close), toMinutes(st.end));
  return close > open ? [open, close] : null;
}

/**
 * Bookable start times on a date for a total duration.
 * With stylistId "any", each time is assigned to the first free stylist.
 */
export function slotsOn(
  s: State,
  service: Service,
  stylistId: string | "any",
  key: string,
  minutes: number,
  opts: { ignoreRef?: string; now?: Date } = {},
): Slot[] {
  const now = opts.now ?? new Date();
  const earliest = now.getTime() + s.settings.leadHours * 3600e3;
  const candidates = stylistId === "any" ? stylistsFor(s, service) : s.stylists.filter((st) => st.id === stylistId);
  const byTime = new Map<string, string>();
  for (const st of candidates) {
    const win = stylistWindow(s, st, key);
    if (!win) continue;
    const busy = busyRanges(s, st.id, key, opts.ignoreRef);
    for (let t = win[0]; t + minutes <= win[1]; t += s.settings.slotMinutes) {
      if (atTime(key, fromMinutes(t)).getTime() < earliest) continue;
      const end = t + minutes;
      if (busy.some(([b0, b1]) => t < b1 && end > b0)) continue;
      const time = fromMinutes(t);
      if (!byTime.has(time)) byTime.set(time, st.id);
    }
  }
  return [...byTime.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([time, id]) => ({ time, stylistId: id }));
}

export type DayStatus = "available" | "limited" | "full" | "closed" | "past";

export function dayStatus(s: State, service: Service, stylistId: string | "any", key: string, minutes: number): DayStatus {
  const today = dateKey(new Date());
  if (key < today) return "past";
  if (key > dateKey(addDays(new Date(), s.settings.bookingWindowDays))) return "closed";
  const hours = salonHoursOn(s, key);
  const staff = stylistId === "any" ? stylistsFor(s, service) : s.stylists.filter((st) => st.id === stylistId);
  if (!hours || !staff.some((st) => stylistWindow(s, st, key))) return "closed";
  const n = slotsOn(s, service, stylistId, key, minutes).length;
  if (n === 0) return "full";
  return n <= 3 ? "limited" : "available";
}

export function nextAvailable(s: State, service: Service, stylistId: string | "any", fromKey: string, minutes: number) {
  let d = parseDateKey(fromKey);
  for (let i = 0; i < s.settings.bookingWindowDays; i++) {
    d = addDays(d, 1);
    const key = dateKey(d);
    const slots = slotsOn(s, service, stylistId, key, minutes);
    if (slots.length) return { date: key, slots };
  }
  return null;
}

/** Is this exact slot still free? Used right before payment to catch races. */
export function isSlotFree(s: State, service: Service, a: Pick<Appointment, "stylistId" | "date" | "time" | "minutes">, ignoreRef?: string) {
  return slotsOn(s, service, a.stylistId, a.date, a.minutes, { ignoreRef }).some((x) => x.time === a.time);
}

export function hoursUntil(a: Pick<Appointment, "date" | "time">) {
  return (atTime(a.date, a.time).getTime() - Date.now()) / 3600e3;
}
