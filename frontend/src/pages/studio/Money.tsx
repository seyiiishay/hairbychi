import { useMemo, useState } from "react";
import { format, startOfMonth, subMonths } from "date-fns";
import { cn, money, parseDateKey, shortDate } from "../../lib/format";
import { useStore } from "../../store/store";
import { AppointmentDrawer } from "./Operations";
import type { Appointment } from "../../data/types";
import { Panel, Stat, StudioTitle, inputCls } from "./StudioLayout";

export function PaymentsAdmin() {
  const s = useStore();
  const [kind, setKind] = useState<"all" | "deposit" | "full" | "refund">("all");
  const [open, setOpen] = useState<Appointment | null>(null);
  const rows = s.appointments
    .filter((a) => a.paid > 0)
    .filter((a) => (kind === "refund" ? (a.refunded ?? 0) > 0 : kind === "all" ? true : a.paymentType === kind))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const month = format(new Date(), "yyyy-MM");
  const thisMonth = s.appointments.filter((a) => a.date.startsWith(month));
  const collected = thisMonth.reduce((t, a) => t + a.paid - (a.refunded ?? 0), 0);
  const deposits = s.appointments.filter((a) => a.status === "confirmed" || a.status === "pending").reduce((t, a) => t + a.paid, 0);
  const outstanding = s.appointments.filter((a) => a.status === "confirmed" || a.status === "pending").reduce((t, a) => t + (a.total - a.paid), 0);
  const refunds = thisMonth.reduce((t, a) => t + (a.refunded ?? 0), 0);
  return (
    <>
      <StudioTitle title="Payments" sub="Deposits, balances and refunds. Card data lives with the payment provider only." />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Collected this month" value={money(collected)} />
        <Stat label="Deposits held" value={money(deposits)} hint="Upcoming appointments" />
        <Stat label="Balance due in salon" value={money(outstanding)} hint="Upcoming appointments" />
        <Stat label="Refunds this month" value={money(refunds)} />
      </div>
      <div className="mt-6 mb-4 flex items-center gap-3">
        <select value={kind} onChange={(e) => setKind(e.target.value as typeof kind)} className={cn(inputCls, "w-auto")} aria-label="Payment type">
          <option value="all">All payments</option>
          <option value="deposit">Deposits</option>
          <option value="full">Paid in full</option>
          <option value="refund">With refunds</option>
        </select>
      </div>
      <div className="overflow-x-auto rounded-2xl bg-white ring-1 ring-line/70">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="border-b border-line text-xs tracking-wider text-muted uppercase">
            <tr>
              <th className="px-4 py-3 font-semibold">Booked</th>
              <th className="px-4 py-3 font-semibold">Client</th>
              <th className="px-4 py-3 font-semibold">Type</th>
              <th className="px-4 py-3 font-semibold">Method</th>
              <th className="px-4 py-3 text-right font-semibold">Paid</th>
              <th className="px-4 py-3 text-right font-semibold">Refunded</th>
              <th className="px-4 py-3 text-right font-semibold">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rows.slice(0, 150).map((a) => (
              <tr key={a.ref} className="cursor-pointer hover:bg-cream/60" onClick={() => setOpen(a)}>
                <td className="px-4 py-3 whitespace-nowrap">{shortDate(a.createdAt.slice(0, 10))}</td>
                <td className="px-4 py-3">
                  {a.customer.firstName} {a.customer.lastName}
                  <span className="block font-mono text-[0.7rem] text-muted">{a.ref}</span>
                </td>
                <td className="px-4 py-3">{a.status === "completed" ? "Settled" : a.paymentType === "full" ? "Paid in full" : "Deposit"}</td>
                <td className="px-4 py-3 capitalize">{a.paymentMethod.replace("-", " ")}</td>
                <td className="px-4 py-3 text-right">{money(a.paid)}</td>
                <td className="px-4 py-3 text-right">{a.refunded ? money(a.refunded) : "—"}</td>
                <td className="px-4 py-3 text-right">{money(a.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <AppointmentDrawer appt={open} onClose={() => setOpen(null)} />
    </>
  );
}

/** Single-series horizontal bars with the value labelled on each row (no legend needed). */
function BarList({ rows, format: fmt }: { rows: { label: string; value: number }[]; format: (n: number) => string }) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <ul className="space-y-2.5">
      {rows.map((r) => (
        <li key={r.label} className="group grid grid-cols-[minmax(0,9rem)_1fr_4.5rem] items-center gap-3 text-sm" title={`${r.label}: ${fmt(r.value)}`}>
          <span className="truncate text-ink-soft">{r.label}</span>
          <span className="h-3 rounded-r bg-transparent">
            <span className="block h-full rounded-r-[4px] bg-gold-deep transition group-hover:bg-ink" style={{ width: `${Math.max(1.5, (r.value / max) * 100)}%` }} />
          </span>
          <span className="text-right font-semibold tabular-nums">{fmt(r.value)}</span>
        </li>
      ))}
    </ul>
  );
}

function MonthlyRevenue({ data }: { data: { month: string; value: number }[] }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  const [hover, setHover] = useState<number | null>(null);
  return (
    <div>
      <div className="relative flex h-56 items-end gap-2 border-b border-line pt-6" role="img" aria-label={`Monthly revenue: ${data.map((d) => `${d.month} ${money(d.value)}`).join(", ")}`}>
        {[0.5, 1].map((f) => (
          <span key={f} className="pointer-events-none absolute inset-x-0 border-t border-dashed border-line/70" style={{ bottom: `${f * 88}%` }} aria-hidden />
        ))}
        {data.map((d, i) => (
          <div key={d.month} className="relative flex h-full flex-1 items-end" onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}>
            {hover === i || i === data.length - 1 ? (
              <span className="absolute left-1/2 -translate-x-1/2 rounded-md bg-ink px-2 py-1 text-xs font-semibold whitespace-nowrap text-ivory" style={{ bottom: `calc(${(d.value / max) * 88}% + 6px)` }}>
                {money(d.value)}
              </span>
            ) : null}
            <span className={cn("block w-full rounded-t-[4px] transition", hover === i ? "bg-ink" : "bg-gold-deep")} style={{ height: `${(d.value / max) * 88}%` }} />
          </div>
        ))}
      </div>
      <div className="mt-2 flex gap-2 text-center text-xs text-muted">
        {data.map((d) => (
          <span key={d.month} className="flex-1">
            {d.month}
          </span>
        ))}
      </div>
    </div>
  );
}

export function Reports() {
  const s = useStore();
  const [months, setMonths] = useState(6);
  const data = useMemo(() => {
    const from = startOfMonth(subMonths(new Date(), months - 1));
    const inRange = s.appointments.filter((a) => parseDateKey(a.date) >= from && a.date <= format(new Date(), "yyyy-MM-dd"));
    const completed = inRange.filter((a) => a.status === "completed");
    const monthly = Array.from({ length: months }, (_, i) => {
      const m = subMonths(new Date(), months - 1 - i);
      const key = format(m, "yyyy-MM");
      return { month: format(m, "MMM"), value: completed.filter((a) => a.date.startsWith(key)).reduce((t, a) => t + a.total, 0) };
    });
    const byService = s.services
      .map((svc) => ({ label: svc.name, value: completed.filter((a) => a.serviceId === svc.id).length }))
      .filter((r) => r.value)
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
    const byStylist = s.stylists.map((st) => {
      const mine = completed.filter((a) => a.stylistId === st.id);
      const revenue = mine.reduce((t, a) => t + a.total, 0);
      return { st, bookings: mine.length, revenue, commission: Math.round((revenue * st.commission) / 100) };
    });
    const counts = (st: string) => inRange.filter((a) => a.status === st).length;
    const closed = completed.length + counts("no-show") + counts("cancelled");
    return {
      monthly,
      byService,
      byStylist,
      revenue: completed.reduce((t, a) => t + a.total, 0),
      completed: completed.length,
      avg: completed.length ? completed.reduce((t, a) => t + a.total, 0) / completed.length : 0,
      noShowRate: closed ? (counts("no-show") / closed) * 100 : 0,
      cancelRate: closed ? (counts("cancelled") / closed) * 100 : 0,
      addOnRate: completed.length ? (completed.filter((a) => a.addOnIds.length).length / completed.length) * 100 : 0,
    };
  }, [s.appointments, s.services, s.stylists, months]);

  return (
    <>
      <StudioTitle
        title="Reports"
        sub="Completed appointments only"
        actions={
          <select value={months} onChange={(e) => setMonths(+e.target.value)} className={cn(inputCls, "w-auto")} aria-label="Period">
            <option value={3}>Last 3 months</option>
            <option value={6}>Last 6 months</option>
          </select>
        }
      />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Revenue" value={money(data.revenue)} />
        <Stat label="Completed" value={data.completed} hint={`Avg ticket ${money(data.avg)}`} />
        <Stat label="No-show rate" value={`${data.noShowRate.toFixed(1)}%`} hint={`Cancellations ${data.cancelRate.toFixed(1)}%`} />
        <Stat label="Add-on attach rate" value={`${data.addOnRate.toFixed(0)}%`} hint="Bookings with at least one extra" />
      </div>
      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <Panel title="Revenue by month">
          <MonthlyRevenue data={data.monthly} />
        </Panel>
        <Panel title="Top services (bookings)">
          <BarList rows={data.byService} format={(n) => String(n)} />
        </Panel>
        <Panel title="Stylist performance" className="xl:col-span-2">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-left text-sm">
              <thead className="border-b border-line text-xs tracking-wider text-muted uppercase">
                <tr>
                  <th className="py-2 font-semibold">Stylist</th>
                  <th className="py-2 text-right font-semibold">Completed</th>
                  <th className="py-2 text-right font-semibold">Revenue</th>
                  <th className="py-2 text-right font-semibold">Commission</th>
                  <th className="py-2 text-right font-semibold">Rating</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {data.byStylist.map((r) => (
                  <tr key={r.st.id}>
                    <td className="py-2.5 font-semibold">{r.st.name}</td>
                    <td className="py-2.5 text-right tabular-nums">{r.bookings}</td>
                    <td className="py-2.5 text-right tabular-nums">{money(r.revenue)}</td>
                    <td className="py-2.5 text-right tabular-nums">
                      {money(r.commission)} <span className="text-xs text-muted">({r.st.commission}%)</span>
                    </td>
                    <td className="py-2.5 text-right tabular-nums">{r.st.rating}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      </div>
    </>
  );
}
