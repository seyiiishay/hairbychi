import { format } from "date-fns";
import { SALON } from "../data/catalog";
import type { Appointment } from "../data/types";
import { atTime } from "./format";

const stamp = (d: Date) => format(d, "yyyyMMdd'T'HHmmss");

export function googleCalendarUrl(a: Appointment, title: string) {
  const start = atTime(a.date, a.time);
  const end = new Date(start.getTime() + a.minutes * 60e3);
  const q = new URLSearchParams({
    action: "TEMPLATE",
    text: `${title} at ${SALON.name}`,
    dates: `${stamp(start)}/${stamp(end)}`,
    location: SALON.address,
    details: `Booking reference ${a.ref}`,
  });
  return `https://calendar.google.com/calendar/render?${q}`;
}

/** Downloads an .ics file that works with Apple Calendar, Outlook and Google. */
export function downloadIcs(a: Appointment, title: string) {
  const start = atTime(a.date, a.time);
  const end = new Date(start.getTime() + a.minutes * 60e3);
  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Hair by Chi//Booking//EN",
    "BEGIN:VEVENT",
    `UID:${a.ref}@hairbychi`,
    `DTSTAMP:${stamp(new Date())}`,
    `DTSTART:${stamp(start)}`,
    `DTEND:${stamp(end)}`,
    `SUMMARY:${title} at ${SALON.name}`,
    `LOCATION:${SALON.address.replace(/,/g, "\\,")}`,
    `DESCRIPTION:Booking reference ${a.ref}`,
    "BEGIN:VALARM",
    "TRIGGER:-PT24H",
    "ACTION:DISPLAY",
    "DESCRIPTION:Hair appointment tomorrow",
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
  const url = URL.createObjectURL(new Blob([ics], { type: "text/calendar" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = `hair-by-chi-${a.ref}.ics`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
