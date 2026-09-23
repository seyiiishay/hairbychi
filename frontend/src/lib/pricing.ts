import type { Appointment, Service } from "../data/types";
import type { State } from "../store/store";
import { appointmentsFor } from "../store/store";
import { atTime } from "./format";

export interface Quote {
  lines: { label: string; amount: number }[];
  subtotal: number;
  discount: number;
  discountCode?: string;
  discountError?: string;
  total: number;
  deposit: number;
  dueNow: number;
  remaining: number;
  minutes: number;
}

export function quote(
  s: State,
  service: Service,
  addOnIds: string[],
  opts: { code?: string; email?: string; paymentType?: "deposit" | "full" } = {},
): Quote {
  const addOns = s.addOns.filter((a) => addOnIds.includes(a.id));
  const lines = [
    { label: service.consultation ? `${service.name} (from, finalised at consultation)` : service.name, amount: service.price },
    ...addOns.map((a) => ({ label: a.name, amount: a.price })),
  ];
  const subtotal = lines.reduce((t, l) => t + l.amount, 0);

  let discount = 0;
  let discountError: string | undefined;
  let discountCode: string | undefined;
  const code = opts.code?.trim().toUpperCase();
  if (code) {
    const d = s.discounts.find((x) => x.code === code);
    const returning = opts.email ? appointmentsFor(s, opts.email).some((a) => a.status === "completed") : false;
    if (!d || !d.active) discountError = "That code isn't valid right now. Check the spelling and try again.";
    else if (d.firstVisitOnly && returning) discountError = `${d.code} is for first visits only. Welcome back, though!`;
    else {
      discountCode = d.code;
      discount = d.type === "percent" ? Math.round((subtotal * d.value) / 100) : Math.min(d.value, subtotal);
    }
  }
  const total = subtotal - discount;
  const deposit = Math.min(service.deposit, total);
  const dueNow = opts.paymentType === "full" ? total : deposit;
  return {
    lines,
    subtotal,
    discount,
    discountCode,
    discountError,
    total,
    deposit,
    dueNow,
    remaining: total - dueNow,
    minutes: service.minutes + addOns.reduce((t, a) => t + a.minutes, 0),
  };
}

/** What happens to the money if the client cancels now, per the policy. */
export function cancellationOutcome(s: State, a: Appointment) {
  const hours = (atTime(a.date, a.time).getTime() - Date.now()) / 3600e3;
  const late = hours < s.settings.cancellationHours;
  const forfeited = late ? Math.min(a.deposit, a.paid) : 0;
  return { late, hours, refund: a.paid - forfeited, forfeited };
}
