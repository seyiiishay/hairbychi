/**
 * Local-first data store.
 *
 * Everything the site needs (catalogue, bookings, customers, admin settings)
 * lives in one immutable state object persisted to localStorage, so the
 * whole product runs end-to-end as a static site. Each mutation below is a
 * single function, which is the seam to swap for real API calls when the
 * backend grows these endpoints.
 */
import { useSyncExternalStore } from "react";
import { addDays, subDays } from "date-fns";
import {
  ADD_ONS,
  DEFAULT_DISCOUNTS,
  DEFAULT_HOURS,
  DEFAULT_SETTINGS,
  GALLERY,
  REVIEWS,
  SERVICES,
  STYLISTS,
} from "../data/catalog";
import type {
  AddOn,
  Appointment,
  Block,
  ConsultationRequest,
  ContactMessage,
  Discount,
  GalleryItem,
  OutboxMessage,
  Review,
  Service,
  Settings,
  SpecialHours,
  Stylist,
  User,
  WaitlistEntry,
  WeekHours,
} from "../data/types";
import { bookingRef, dateKey, uid } from "../lib/format";

const STORAGE_KEY = "hairbychi:v2";

export interface State {
  services: Service[];
  addOns: AddOn[];
  stylists: Stylist[];
  gallery: GalleryItem[];
  reviews: Review[];
  appointments: Appointment[];
  users: User[];
  sessionUserId: string | null;
  favourites: Record<string, string[]>;
  blocks: Block[];
  hours: WeekHours;
  specialHours: SpecialHours[];
  discounts: Discount[];
  waitlist: WaitlistEntry[];
  messages: ContactMessage[];
  consultations: ConsultationRequest[];
  outbox: OutboxMessage[];
  settings: Settings;
}

/** Demo-grade hash so plaintext passwords never sit in storage. Not a security boundary. */
export function hashPassword(pw: string) {
  let h = 5381;
  for (let i = 0; i < pw.length; i++) h = ((h << 5) + h + pw.charCodeAt(i)) | 0;
  return "h" + (h >>> 0).toString(36);
}

export const DEMO_CUSTOMER = { email: "sarah@example.com", password: "hairbychi" };
export const DEMO_ADMIN = { email: "owner@hairbychi.ca", password: "studio2026" };

// --- seeding -------------------------------------------------------------

function seededRandom(seed: number) {
  return () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
}

const FIRST = ["Sarah", "Michelle", "Rachel", "Amanda", "Keisha", "Tolu", "Grace", "Nia", "Imani", "Zara", "Precious", "Bisi", "Ama", "Chelsea", "Joy", "Tiana"];
const LAST = ["Johnson", "Okafor", "Williams", "Brown", "Mensah", "Adeyemi", "Clarke", "Thomas", "Campbell", "Osei", "Reid", "Bello"];

function seedState(): State {
  const rand = seededRandom(20260928);
  const pick = <T,>(arr: T[]) => arr[Math.floor(rand() * arr.length)];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const users: User[] = [
    {
      id: "u-sarah",
      role: "customer",
      firstName: "Sarah",
      lastName: "Johnson",
      email: DEMO_CUSTOMER.email,
      phone: "(416) 555-0199",
      passwordHash: hashPassword(DEMO_CUSTOMER.password),
      verified: true,
      preferences: { hairType: "4B/4C, medium density", favouriteStylistId: "chioma", notes: "Tender-headed at the nape." },
      points: 420,
      createdAt: subDays(today, 240).toISOString(),
    },
    {
      id: "u-owner",
      role: "admin",
      firstName: "Chioma",
      lastName: "Eze",
      email: DEMO_ADMIN.email,
      phone: "(416) 555-0142",
      passwordHash: hashPassword(DEMO_ADMIN.password),
      verified: true,
      preferences: {},
      points: 0,
      createdAt: subDays(today, 800).toISOString(),
    },
  ];

  const appointments: Appointment[] = [];
  const make = (
    date: Date,
    time: string,
    service: Service,
    stylistId: string,
    status: Appointment["status"],
    customer?: Appointment["customer"],
    addOnIds: string[] = [],
  ) => {
    const addOns = ADD_ONS.filter((a) => addOnIds.includes(a.id));
    const subtotal = service.price + addOns.reduce((s, a) => s + a.price, 0);
    const first = customer?.firstName ?? pick(FIRST);
    const last = customer?.lastName ?? pick(LAST);
    const full = rand() < 0.3;
    appointments.push({
      ref: bookingRef(),
      serviceId: service.id,
      stylistId,
      addOnIds,
      date: dateKey(date),
      time,
      minutes: service.minutes + addOns.reduce((s, a) => s + a.minutes, 0),
      status,
      customer: customer ?? {
        firstName: first,
        lastName: last,
        email: `${first}.${last}`.toLowerCase() + "@example.com",
        phone: `(647) 555-0${100 + Math.floor(rand() * 899)}`,
      },
      answers: { length: "Shoulder", thickness: "Medium", currentStyle: "no" },
      notes: "",
      subtotal,
      discount: 0,
      total: subtotal,
      deposit: service.deposit,
      paid: status === "completed" ? subtotal : full ? subtotal : service.deposit,
      paymentType: full ? "full" : "deposit",
      paymentMethod: pick(["card", "card", "apple-pay", "google-pay"] as const),
      createdAt: subDays(date, 10).toISOString(),
      rescheduleCount: 0,
      source: "online",
      reviewed: status === "completed" && rand() < 0.5,
    });
  };

  const byStylist = (id: string) => SERVICES.filter((s) => s.stylistIds.includes(id) && !s.consultation && s.categoryId !== "addons");
  const startsFor = (stylist: Stylist) => {
    const [h] = stylist.start.split(":").map(Number);
    return [`${String(h).padStart(2, "0")}:00`, `${String(h + 5).padStart(2, "0")}:30`];
  };

  // History: ~5 months of completed work so reports and customers look alive
  for (let back = 185; back >= 1; back--) {
    const day = subDays(today, back);
    if (DEFAULT_HOURS[day.getDay()] === null) continue;
    for (const st of STYLISTS) {
      if (!st.workDays.includes(day.getDay()) || rand() < 0.35) continue;
      const svc = pick(byStylist(st.id));
      const roll = rand();
      const status = roll < 0.06 ? "no-show" : roll < 0.13 ? "cancelled" : "completed";
      make(day, startsFor(st)[0], svc, st.id, status, undefined, rand() < 0.4 ? [pick(svc.addOnIds.length ? svc.addOnIds : ["wash"])] : []);
    }
  }

  // Sarah's own history + upcoming appointment
  const sarah = { firstName: "Sarah", lastName: "Johnson", email: DEMO_CUSTOMER.email, phone: "(416) 555-0199" };
  const svc = (id: string) => SERVICES.find((s) => s.id === id)!;
  make(subDays(today, 58), "10:00", svc("medium-knotless-braids"), "chioma", "completed", sarah, ["boho"]);
  make(subDays(today, 121), "09:00", svc("silk-press"), "amara", "completed", sarah, ["trim"]);
  appointments[appointments.length - 1].reviewed = true;
  appointments[appointments.length - 2].reviewed = false;

  // Upcoming: today's schedule, the next few weeks, and one fully booked Saturday
  const nextWorking = (from: Date, stylist: Stylist) => {
    let d = from;
    for (let i = 0; i < 14; i++) {
      if (stylist.workDays.includes(d.getDay()) && DEFAULT_HOURS[d.getDay()]) return d;
      d = addDays(d, 1);
    }
    return from;
  };
  for (let fwd = 0; fwd <= 30; fwd++) {
    const day = addDays(today, fwd);
    if (DEFAULT_HOURS[day.getDay()] === null) continue;
    for (const st of STYLISTS) {
      if (!st.workDays.includes(day.getDay())) continue;
      const chance = fwd === 0 ? 1 : fwd < 8 ? 0.7 : 0.45;
      if (rand() > chance) continue;
      const svcA = pick(byStylist(st.id));
      const status = fwd === 0 ? "confirmed" : rand() < 0.12 ? "pending" : "confirmed";
      make(day, startsFor(st)[0], svcA, st.id, status);
      if (rand() < 0.5 || fwd === 0) {
        const short = byStylist(st.id).filter((s) => s.minutes <= 150);
        if (short.length) make(day, startsFor(st)[1], pick(short), st.id, status);
      }
    }
  }

  // Sarah's upcoming appointment with Chioma
  const sarahDay = nextWorking(addDays(today, 5), STYLISTS[0]);
  appointments.push({
    ref: "HBC-SJ28K",
    serviceId: "boho-knotless-braids",
    stylistId: "chioma",
    addOnIds: ["wash"],
    date: dateKey(sarahDay),
    time: "14:00",
    minutes: 330 + 30,
    status: "confirmed",
    customer: sarah,
    answers: { length: "Mid-back", thickness: "Medium", currentStyle: "no" },
    notes: "Would love the curls a little looser at the ends.",
    subtotal: 245,
    discount: 0,
    total: 245,
    deposit: 50,
    paid: 50,
    paymentType: "deposit",
    paymentMethod: "apple-pay",
    createdAt: subDays(today, 3).toISOString(),
    rescheduleCount: 0,
    source: "online",
  });
  // Remove anything the seed placed on top of Sarah's slot
  const clash = appointments.filter((a) => a.stylistId === "chioma" && a.date === dateKey(sarahDay) && a.ref !== "HBC-SJ28K");
  for (const c of clash) appointments.splice(appointments.indexOf(c), 1);

  // A fully booked Saturday roughly two weeks out, to demonstrate the waitlist
  let sat = addDays(today, 8);
  while (sat.getDay() !== 6) sat = addDays(sat, 1);
  const satKey = dateKey(sat);
  for (let i = appointments.length - 1; i >= 0; i--) if (appointments[i].date === satKey) appointments.splice(i, 1);
  for (const st of STYLISTS) {
    make(sat, "08:00", svc("small-knotless-braids"), st.id, "confirmed");
    appointments[appointments.length - 1].serviceId = byStylist(st.id)[0].id;
    appointments[appointments.length - 1].minutes = 540;
  }

  return {
    services: SERVICES,
    addOns: ADD_ONS,
    stylists: STYLISTS,
    gallery: GALLERY,
    reviews: REVIEWS,
    appointments,
    users,
    sessionUserId: null,
    favourites: { "u-sarah": ["boho-knotless-braids", "silk-press", "g3"] },
    blocks: [
      { id: "b1", stylistId: null, date: dateKey(addDays(today, 21)), reason: "Studio closed: team training" },
      { id: "b2", stylistId: "amara", date: dateKey(nextWorking(addDays(today, 2), STYLISTS[1])), start: "13:00", end: "14:00", reason: "Lunch" },
    ],
    hours: DEFAULT_HOURS,
    specialHours: [],
    discounts: DEFAULT_DISCOUNTS,
    waitlist: [],
    messages: [
      {
        id: "m1",
        name: "Tolu Adeyemi",
        email: "tolu@example.com",
        phone: "",
        reason: "Bridal enquiry",
        message: "Hi! I'm getting married in May and would love a braided updo trial. Do you travel?",
        createdAt: subDays(today, 1).toISOString(),
        read: false,
      },
    ],
    consultations: [],
    outbox: [],
    settings: DEFAULT_SETTINGS,
  };
}

// --- store core ----------------------------------------------------------

function load(): State {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...seedState(), ...(JSON.parse(raw) as Partial<State>) };
  } catch {
    /* storage unavailable (private mode) or corrupt: fall back to a fresh seed */
  }
  return seedState();
}

let state: State = load();
const listeners = new Set<() => void>();

function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* quota or privacy mode: keep working in memory */
  }
}

export function getState() {
  return state;
}

export function setState(fn: (s: State) => Partial<State>) {
  state = { ...state, ...fn(state) };
  persist();
  listeners.forEach((l) => l());
}

function subscribe(l: () => void) {
  listeners.add(l);
  const onStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) {
      state = load();
      l();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(l);
    window.removeEventListener("storage", onStorage);
  };
}

export function useStore(): State {
  return useSyncExternalStore(subscribe, getState, getState);
}

export function resetDemo() {
  state = seedState();
  persist();
  listeners.forEach((l) => l());
}

// --- selectors -----------------------------------------------------------

export function currentUser(s: State = state) {
  return s.users.find((u) => u.id === s.sessionUserId) ?? null;
}

export function favouritesOf(s: State) {
  return s.favourites[s.sessionUserId ?? "guest"] ?? [];
}

export function appointmentsFor(s: State, email: string) {
  const e = email.trim().toLowerCase();
  return s.appointments.filter((a) => a.customer.email.toLowerCase() === e);
}

export const ACTIVE_STATUSES: Appointment["status"][] = ["pending", "confirmed", "checked-in", "in-progress"];

// --- mutations -----------------------------------------------------------

export function toggleFavourite(id: string) {
  setState((s) => {
    const key = s.sessionUserId ?? "guest";
    const list = s.favourites[key] ?? [];
    return {
      favourites: {
        ...s.favourites,
        [key]: list.includes(id) ? list.filter((x) => x !== id) : [...list, id],
      },
    };
  });
}

export class AuthError extends Error {}

function mergeGuestFavourites(s: State, userId: string) {
  const guest = s.favourites.guest ?? [];
  const mine = s.favourites[userId] ?? [];
  return { ...s.favourites, guest: [], [userId]: Array.from(new Set([...mine, ...guest])) };
}

export function signIn(email: string, password: string) {
  const user = state.users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
  if (!user || user.passwordHash !== hashPassword(password)) {
    throw new AuthError("That email and password don't match our records. Please try again.");
  }
  setState((s) => ({ sessionUserId: user.id, favourites: mergeGuestFavourites(s, user.id) }));
  return user;
}

export function register(input: { firstName: string; lastName: string; email: string; phone: string; password: string }) {
  const email = input.email.trim().toLowerCase();
  if (state.users.some((u) => u.email.toLowerCase() === email)) {
    throw new AuthError("An account with this email already exists. Try signing in instead.");
  }
  const user: User = {
    id: uid("u-"),
    role: "customer",
    firstName: input.firstName.trim(),
    lastName: input.lastName.trim(),
    email,
    phone: input.phone.trim(),
    passwordHash: hashPassword(input.password),
    verified: false,
    preferences: {},
    points: 0,
    createdAt: new Date().toISOString(),
  };
  setState((s) => ({ users: [...s.users, user], sessionUserId: user.id, favourites: mergeGuestFavourites(s, user.id) }));
  return user;
}

export function signOut() {
  setState(() => ({ sessionUserId: null }));
}

export function updateUser(id: string, patch: Partial<User>) {
  setState((s) => ({ users: s.users.map((u) => (u.id === id ? { ...u, ...patch } : u)) }));
}

function queueEmails(a: Appointment, kind: "new" | "reschedule" | "cancel"): OutboxMessage[] {
  const now = new Date().toISOString();
  const start = new Date(`${a.date}T${a.time}:00`);
  const base = { to: a.customer.email, ref: a.ref };
  if (kind === "cancel") {
    return [{ ...base, id: uid("e-"), kind: "cancellation", subject: "Your appointment has been cancelled", sendAt: now }];
  }
  return [
    {
      ...base,
      id: uid("e-"),
      kind: kind === "new" ? "confirmation" : "reschedule",
      subject: kind === "new" ? "Your appointment is confirmed" : "Your appointment has been moved",
      sendAt: now,
    },
    {
      ...base,
      id: uid("e-"),
      kind: "reminder-24h",
      subject: "Reminder: your appointment is tomorrow",
      sendAt: new Date(start.getTime() - 24 * 3600e3).toISOString(),
    },
    {
      ...base,
      id: uid("e-"),
      kind: "reminder-2h",
      subject: "We look forward to seeing you today",
      sendAt: new Date(start.getTime() - 2 * 3600e3).toISOString(),
    },
  ];
}

export function createAppointment(a: Appointment) {
  setState((s) => ({
    appointments: [...s.appointments, a],
    outbox: [...s.outbox, ...queueEmails(a, "new")],
    discounts: a.discountCode
      ? s.discounts.map((d) => (d.code === a.discountCode ? { ...d, uses: d.uses + 1 } : d))
      : s.discounts,
  }));
}

export function updateAppointment(ref: string, patch: Partial<Appointment>) {
  setState((s) => ({ appointments: s.appointments.map((a) => (a.ref === ref ? { ...a, ...patch } : a)) }));
}

/** Freed slots notify matching waitlist entries (simulated email). */
function notifyWaitlist(s: State, freed: Appointment): Pick<State, "waitlist" | "outbox"> {
  const matches = s.waitlist.filter(
    (w) => !w.notified && w.date === freed.date && (w.stylistId === null || w.stylistId === freed.stylistId),
  );
  return {
    waitlist: s.waitlist.map((w) => (matches.includes(w) ? { ...w, notified: true } : w)),
    outbox: [
      ...s.outbox,
      ...matches.map((w) => ({
        id: uid("e-"),
        to: w.email,
        kind: "waitlist" as const,
        subject: "Good news: a time just opened up",
        sendAt: new Date().toISOString(),
      })),
    ],
  };
}

export function cancelAppointment(ref: string, opts: { refund: number }) {
  setState((s) => {
    const a = s.appointments.find((x) => x.ref === ref);
    if (!a) return {};
    const cancelled = { ...a, status: "cancelled" as const, refunded: opts.refund };
    const wl = notifyWaitlist(s, a);
    return {
      appointments: s.appointments.map((x) => (x.ref === ref ? cancelled : x)),
      waitlist: wl.waitlist,
      outbox: [...wl.outbox, ...queueEmails(cancelled, "cancel")],
    };
  });
}

export function rescheduleAppointment(ref: string, date: string, time: string, stylistId: string) {
  setState((s) => {
    const a = s.appointments.find((x) => x.ref === ref);
    if (!a) return {};
    const moved = { ...a, date, time, stylistId, rescheduleCount: a.rescheduleCount + 1 };
    const wl = notifyWaitlist(s, a);
    return {
      appointments: s.appointments.map((x) => (x.ref === ref ? moved : x)),
      waitlist: wl.waitlist,
      outbox: [...wl.outbox, ...queueEmails(moved, "reschedule")],
    };
  });
}

export function addReview(r: Review) {
  setState((s) => ({
    reviews: [r, ...s.reviews],
    appointments: s.appointments.map((a) => (a.ref === r.appointmentRef ? { ...a, reviewed: true } : a)),
  }));
}

export function joinWaitlist(w: WaitlistEntry) {
  setState((s) => ({ waitlist: [...s.waitlist, w] }));
}

export function sendMessage(m: ContactMessage) {
  setState((s) => ({ messages: [m, ...s.messages] }));
}

export function requestConsultation(c: ConsultationRequest) {
  setState((s) => ({ consultations: [c, ...s.consultations] }));
}
