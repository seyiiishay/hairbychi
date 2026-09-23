/** Owner / staff mutations. Same seam as store.ts: each becomes an authenticated API call. */
import type { AppointmentStatus, Block, Discount, GalleryItem, Review, Service, Settings, SpecialHours, Stylist, WeekHours } from "../data/types";
import { uid } from "../lib/format";
import { setState } from "./store";

export function setStatus(ref: string, status: AppointmentStatus) {
  setState((s) => {
    const a = s.appointments.find((x) => x.ref === ref);
    if (!a) return {};
    const completing = status === "completed" && a.status !== "completed";
    const email = a.customer.email.toLowerCase();
    return {
      appointments: s.appointments.map((x) => (x.ref === ref ? { ...x, status, paid: completing ? x.total : x.paid } : x)),
      // Beauty Rewards: 1 point per dollar on completion
      users: completing ? s.users.map((u) => (u.email.toLowerCase() === email ? { ...u, points: u.points + a.total } : u)) : s.users,
      outbox: completing
        ? [...s.outbox, { id: uid("e-"), to: a.customer.email, kind: "review-request" as const, subject: "How was your appointment?", sendAt: new Date().toISOString(), ref }]
        : s.outbox,
    };
  });
}

export function refund(ref: string, amount: number) {
  setState((s) => ({ appointments: s.appointments.map((a) => (a.ref === ref ? { ...a, refunded: (a.refunded ?? 0) + amount } : a)) }));
}

export function addBlock(b: Omit<Block, "id">) {
  setState((s) => ({ blocks: [...s.blocks, { ...b, id: uid("b-") }] }));
}
export function removeBlock(id: string) {
  setState((s) => ({ blocks: s.blocks.filter((b) => b.id !== id) }));
}

export function saveService(svc: Service) {
  setState((s) => ({ services: s.services.some((x) => x.id === svc.id) ? s.services.map((x) => (x.id === svc.id ? svc : x)) : [...s.services, svc] }));
}

export function saveStylist(st: Stylist) {
  setState((s) => ({ stylists: s.stylists.some((x) => x.id === st.id) ? s.stylists.map((x) => (x.id === st.id ? st : x)) : [...s.stylists, st] }));
}

export function setReviewStatus(id: string, status: Review["status"]) {
  setState((s) => ({ reviews: s.reviews.map((r) => (r.id === id ? { ...r, status } : r)) }));
}

export function saveDiscount(d: Discount, originalCode?: string) {
  setState((s) => {
    const key = originalCode ?? d.code;
    return { discounts: s.discounts.some((x) => x.code === key) ? s.discounts.map((x) => (x.code === key ? d : x)) : [...s.discounts, d] };
  });
}
export function deleteDiscount(code: string) {
  setState((s) => ({ discounts: s.discounts.filter((d) => d.code !== code) }));
}

export function saveGalleryItem(g: GalleryItem) {
  setState((s) => ({ gallery: s.gallery.some((x) => x.id === g.id) ? s.gallery.map((x) => (x.id === g.id ? g : x)) : [g, ...s.gallery] }));
}
export function removeGalleryItem(id: string) {
  setState((s) => ({ gallery: s.gallery.filter((g) => g.id !== id) }));
}

export function saveHours(hours: WeekHours) {
  setState(() => ({ hours }));
}
export function addSpecialHours(h: Omit<SpecialHours, "id">) {
  setState((s) => ({ specialHours: [...s.specialHours.filter((x) => x.date !== h.date), { ...h, id: uid("sh-") }] }));
}
export function removeSpecialHours(id: string) {
  setState((s) => ({ specialHours: s.specialHours.filter((x) => x.id !== id) }));
}

export function saveSettings(settings: Settings) {
  setState(() => ({ settings }));
}

export function markMessageRead(id: string) {
  setState((s) => ({ messages: s.messages.map((m) => (m.id === id ? { ...m, read: true } : m)) }));
}
export function setConsultationStatus(id: string, status: "approved" | "declined") {
  setState((s) => ({ consultations: s.consultations.map((c) => (c.id === id ? { ...c, status } : c)) }));
}
