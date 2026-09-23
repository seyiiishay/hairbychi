import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { format, subDays } from "date-fns";
import { Search } from "lucide-react";
import type { Appointment, AppointmentStatus } from "../../data/types";
import { clock, cn, dateKey, duration, longDate, money, parseDateKey, shortDate } from "../../lib/format";
import { useStore } from "../../store/store";
import { refund, setStatus } from "../../store/studio";
import { STATUS_LABEL, StatusBadge } from "../../ui/bits";
import Modal from "../../ui/Modal";
import { Panel, Stat, StudioTitle, inputCls } from "./StudioLayout";

const NEXT_ACTIONS: Partial<Record<AppointmentStatus, { to: AppointmentStatus; label: string; primary?: boolean }[]>> = {
  pending: [
    { to: "confirmed", label: "Confirm", primary: true },
    { to: "cancelled", label: "Decline" },
  ],
  confirmed: [
    { to: "checked-in", label: "Check in", primary: true },
    { to: "no-show", label: "No-show" },
    { to: "cancelled", label: "Cancel" },
  ],
  "checked-in": [
    { to: "in-progress", label: "Start", primary: true },
    { to: "cancelled", label: "Cancel" },
  ],
  "in-progress": [{ to: "completed", label: "Complete", primary: true }],
};

export function StatusActions({ a, size = "sm" }: { a: Appointment; size?: "sm" | "xs" }) {
  const actions = NEXT_ACTIONS[a.status] ?? [];
  return (
    <div className="flex flex-wrap gap-1.5">
      {actions.map((x) => (
        <button
          key={x.to}
          onClick={(e) => {
            e.stopPropagation();
            setStatus(a.ref, x.to);
          }}
          className={cn(
            "rounded-full font-semibold transition",
            size === "sm" ? "min-h-9 px-3.5 text-xs" : "min-h-8 px-3 text-[0.7rem]",
            x.primary ? "bg-ink text-ivory hover:bg-ink-soft" : "border border-line bg-white hover:border-ink",
          )}
        >
          {x.label}
        </button>
      ))}
    </div>
  );
}

export function AppointmentDrawer({ appt, onClose }: { appt: Appointment | null; onClose: () => void }) {
  const s = useStore();
  const live = appt ? s.appointments.find((a) => a.ref === appt.ref) ?? appt : null;
  const [amount, setAmount] = useState("");
  if (!live) return null;
  const svc = s.services.find((x) => x.id === live.serviceId);
  const addOns = s.addOns.filter((x) => live.addOnIds.includes(x.id));
  const refundable = live.paid - (live.refunded ?? 0);
  return (
    <Modal open onClose={onClose} title={`${live.customer.firstName} ${live.customer.lastName}`} size="lg">
      <div className="flex flex-wrap items-center gap-3">
        <StatusBadge status={live.status} />
        <span className="font-mono text-xs text-muted">{live.ref}</span>
        {live.source === "online" ? <span className="text-xs text-muted">Booked online {shortDate(live.createdAt.slice(0, 10))}</span> : null}
      </div>
      <div className="mt-5 grid gap-6 md:grid-cols-2">
        <dl className="space-y-2 text-sm">
          <div>
            <dt className="text-muted">Service</dt>
            <dd className="font-semibold">{svc?.name}</dd>
          </div>
          {addOns.length ? (
            <div>
              <dt className="text-muted">Add-ons</dt>
              <dd>{addOns.map((a) => a.name).join(", ")}</dd>
            </div>
          ) : null}
          <div>
            <dt className="text-muted">When</dt>
            <dd>
              {longDate(live.date)}, {clock(live.time)} ({duration(live.minutes)})
            </dd>
          </div>
          <div>
            <dt className="text-muted">Stylist</dt>
            <dd>{s.stylists.find((x) => x.id === live.stylistId)?.name}</dd>
          </div>
          <div>
            <dt className="text-muted">Contact</dt>
            <dd>
              <a href={`mailto:${live.customer.email}`} className="underline">
                {live.customer.email}
              </a>
              <br />
              <a href={`tel:${live.customer.phone}`}>{live.customer.phone}</a>
            </dd>
          </div>
        </dl>
        <div className="space-y-4 text-sm">
          <div className="rounded-xl bg-cream p-4">
            <p className="font-semibold">Hair notes</p>
            <p className="mt-1 text-ink-soft">
              Length: {live.answers.length ?? "—"} · Thickness: {live.answers.thickness ?? "—"} · Current style: {live.answers.currentStyle ?? "—"}
              {live.answers.hairCondition ? ` · ${live.answers.hairCondition}` : ""}
            </p>
            {live.notes ? <p className="mt-2 italic">“{live.notes}”</p> : null}
          </div>
          {live.referenceImage ? <img src={live.referenceImage} alt="Client's reference hairstyle" className="max-h-48 rounded-xl object-cover" /> : null}
          <dl className="space-y-1">
            <div className="flex justify-between">
              <dt>Total</dt>
              <dd className="font-semibold">{money(live.total)}</dd>
            </div>
            <div className="flex justify-between text-muted">
              <dt>Paid ({live.paymentMethod.replace("-", " ")})</dt>
              <dd>{money(live.paid)}</dd>
            </div>
            {live.refunded ? (
              <div className="flex justify-between text-muted">
                <dt>Refunded</dt>
                <dd>{money(live.refunded)}</dd>
              </div>
            ) : null}
            <div className="flex justify-between text-muted">
              <dt>Balance due</dt>
              <dd>{money(Math.max(0, live.total - live.paid))}</dd>
            </div>
          </dl>
        </div>
      </div>
      <div className="mt-6 flex flex-col gap-4 border-t border-line pt-5 sm:flex-row sm:items-end sm:justify-between">
        <StatusActions a={live} />
        {refundable > 0 ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const n = Math.min(refundable, Number(amount));
              if (n > 0) refund(live.ref, n);
              setAmount("");
            }}
            className="flex items-end gap-2"
          >
            <label className="text-xs font-semibold">
              Issue refund (max {money(refundable)})
              <input type="number" min={1} max={refundable} value={amount} onChange={(e) => setAmount(e.target.value)} className={cn(inputCls, "mt-1 w-28")} />
            </label>
            <button className="min-h-9 rounded-full border border-ink px-4 text-xs font-semibold">Refund</button>
          </form>
        ) : null}
      </div>
    </Modal>
  );
}

export function Dashboard() {
  const s = useStore();
  const [open, setOpen] = useState<Appointment | null>(null);
  const today = dateKey(new Date());
  const todays = s.appointments.filter((a) => a.date === today && a.status !== "cancelled").sort((a, b) => a.time.localeCompare(b.time));
  // When the studio is closed today, preview the next working day instead of an empty panel
  const nextDay = todays.length ? today : s.appointments.filter((a) => a.date > today && a.status !== "cancelled").map((a) => a.date).sort()[0];
  const schedule = nextDay === today ? todays : s.appointments.filter((a) => a.date === nextDay && a.status !== "cancelled").sort((a, b) => a.time.localeCompare(b.time));
  const expected = todays.filter((a) => a.status !== "no-show").reduce((t, a) => t + a.total, 0);
  const pending = s.appointments.filter((a) => a.status === "pending");
  const weekAgo = subDays(new Date(), 7).toISOString();
  const firstSeen = new Map<string, string>();
  for (const a of s.appointments) {
    const e = a.customer.email.toLowerCase();
    if (!firstSeen.has(e) || a.createdAt < firstSeen.get(e)!) firstSeen.set(e, a.createdAt);
  }
  const newCustomers = [...firstSeen.values()].filter((d) => d >= weekAgo).length;
  const inbox = s.messages.filter((m) => !m.read).length + s.consultations.filter((c) => c.status === "new").length;
  const pendingReviews = s.reviews.filter((r) => r.status === "pending").length;

  return (
    <>
      <StudioTitle title={`Good ${new Date().getHours() < 12 ? "morning" : new Date().getHours() < 17 ? "afternoon" : "evening"}, Chioma`} sub={longDate(today)} />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Today's appointments" value={todays.length} />
        <Stat label="Expected revenue" value={money(expected)} hint="Today, before no-shows" />
        <Stat label="Pending bookings" value={pending.length} hint="Awaiting confirmation" />
        <Stat label="New customers" value={newCustomers} hint="Last 7 days" />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <Panel
          title={nextDay === today || !nextDay ? "Today's schedule" : `Studio closed today · ${format(parseDateKey(nextDay), "EEEE")}'s schedule`}
          action={
            <Link to="/studio/calendar" className="text-xs font-semibold underline">
              Open calendar
            </Link>
          }
        >
          {schedule.length ? (
            <ul className="divide-y divide-line">
              {schedule.map((a) => (
                <li key={a.ref} className="flex flex-col gap-3 py-3.5 sm:flex-row sm:items-center">
                  <button onClick={() => setOpen(a)} className="flex flex-1 items-center gap-4 text-left">
                    <span className="w-20 shrink-0 font-display text-xl">{clock(a.time)}</span>
                    <span className="min-w-0">
                      <span className="block truncate font-semibold">
                        {a.customer.firstName} {a.customer.lastName[0]}. · {s.services.find((x) => x.id === a.serviceId)?.name}
                      </span>
                      <span className="text-xs text-muted">
                        {s.stylists.find((x) => x.id === a.stylistId)?.name} · {duration(a.minutes)} · <StatusLabel status={a.status} />
                      </span>
                    </span>
                  </button>
                  <StatusActions a={a} size="xs" />
                </li>
              ))}
            </ul>
          ) : (
            <p className="py-6 text-sm text-muted">No appointments today. Enjoy the quiet.</p>
          )}
        </Panel>
        <div className="space-y-6">
          <Panel title="Needs attention">
            <ul className="space-y-3 text-sm">
              <li className="flex justify-between">
                <Link to="/studio/appointments?status=pending" className="underline-offset-4 hover:underline">
                  Pending bookings to confirm
                </Link>
                <strong>{pending.length}</strong>
              </li>
              <li className="flex justify-between">
                <Link to="/studio/inbox" className="underline-offset-4 hover:underline">
                  Messages & consultation requests
                </Link>
                <strong>{inbox}</strong>
              </li>
              <li className="flex justify-between">
                <Link to="/studio/reviews" className="underline-offset-4 hover:underline">
                  Reviews awaiting approval
                </Link>
                <strong>{pendingReviews}</strong>
              </li>
              <li className="flex justify-between">
                <Link to="/studio/inbox" className="underline-offset-4 hover:underline">
                  Clients on the waitlist
                </Link>
                <strong>{s.waitlist.filter((w) => !w.notified).length}</strong>
              </li>
            </ul>
          </Panel>
          <Panel title="Coming up">
            <ul className="space-y-2.5 text-sm">
              {s.appointments
                .filter((a) => a.date > today && (a.status === "confirmed" || a.status === "pending"))
                .sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`))
                .slice(0, 5)
                .map((a) => (
                  <li key={a.ref}>
                    <button onClick={() => setOpen(a)} className="flex w-full justify-between gap-3 text-left hover:underline">
                      <span className="truncate">
                        {a.customer.firstName} · {s.services.find((x) => x.id === a.serviceId)?.name}
                      </span>
                      <span className="shrink-0 text-muted">
                        {shortDate(a.date).replace(/, \d{4}/, "")} {clock(a.time)}
                      </span>
                    </button>
                  </li>
                ))}
            </ul>
          </Panel>
        </div>
      </div>
      <AppointmentDrawer appt={open} onClose={() => setOpen(null)} />
    </>
  );
}

function StatusLabel({ status }: { status: AppointmentStatus }) {
  return <span className="font-semibold">{STATUS_LABEL[status]}</span>;
}

export function AppointmentsAdmin() {
  const s = useStore();
  const initial = new URLSearchParams(location.search).get("status") ?? "all";
  const [status, setStatusFilter] = useState(initial);
  const [range, setRange] = useState<"upcoming" | "today" | "past" | "all">(initial === "pending" ? "all" : "upcoming");
  const [stylist, setStylist] = useState("all");
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<Appointment | null>(null);
  const today = dateKey(new Date());
  const list = useMemo(
    () =>
      s.appointments
        .filter((a) => status === "all" || a.status === status)
        .filter((a) => stylist === "all" || a.stylistId === stylist)
        .filter((a) => (range === "upcoming" ? a.date >= today : range === "today" ? a.date === today : range === "past" ? a.date < today : true))
        .filter((a) => !q || `${a.customer.firstName} ${a.customer.lastName} ${a.customer.email} ${a.ref}`.toLowerCase().includes(q.toLowerCase()))
        .sort((a, b) => (range === "past" ? -1 : 1) * `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`)),
    [s.appointments, status, stylist, range, q, today],
  );
  return (
    <>
      <StudioTitle title="Appointments" sub={`${list.length} shown`} />
      <div className="mb-4 grid gap-3 md:grid-cols-[1.5fr_1fr_1fr_1fr]">
        <label className="relative">
          <span className="sr-only">Search</span>
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted" aria-hidden />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, email or reference" className={cn(inputCls, "pl-9")} />
        </label>
        <select value={range} onChange={(e) => setRange(e.target.value as typeof range)} className={inputCls} aria-label="Date range">
          <option value="upcoming">Upcoming</option>
          <option value="today">Today</option>
          <option value="past">Past</option>
          <option value="all">All dates</option>
        </select>
        <select value={status} onChange={(e) => setStatusFilter(e.target.value)} className={inputCls} aria-label="Status">
          <option value="all">All statuses</option>
          {Object.entries(STATUS_LABEL).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>
        <select value={stylist} onChange={(e) => setStylist(e.target.value)} className={inputCls} aria-label="Stylist">
          <option value="all">All stylists</option>
          {s.stylists.map((st) => (
            <option key={st.id} value={st.id}>
              {st.name}
            </option>
          ))}
        </select>
      </div>
      <div className="overflow-x-auto rounded-2xl bg-white ring-1 ring-line/70">
        <table className="w-full min-w-[820px] text-left text-sm">
          <thead className="border-b border-line text-xs tracking-wider text-muted uppercase">
            <tr>
              <th className="px-4 py-3 font-semibold">When</th>
              <th className="px-4 py-3 font-semibold">Client</th>
              <th className="px-4 py-3 font-semibold">Service</th>
              <th className="px-4 py-3 font-semibold">Stylist</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 text-right font-semibold">Total</th>
              <th className="px-4 py-3 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {list.slice(0, 200).map((a) => (
              <tr key={a.ref} onClick={() => setOpen(a)} className="cursor-pointer hover:bg-cream/60">
                <td className="px-4 py-3 whitespace-nowrap">
                  {shortDate(a.date)}
                  <span className="block text-xs text-muted">{clock(a.time)}</span>
                </td>
                <td className="px-4 py-3">
                  <button className="text-left font-semibold hover:underline" onClick={() => setOpen(a)}>
                    {a.customer.firstName} {a.customer.lastName}
                  </button>
                  <span className="block font-mono text-[0.7rem] text-muted">{a.ref}</span>
                </td>
                <td className="px-4 py-3">{s.services.find((x) => x.id === a.serviceId)?.name}</td>
                <td className="px-4 py-3">{s.stylists.find((x) => x.id === a.stylistId)?.name}</td>
                <td className="px-4 py-3">
                  <StatusBadge status={a.status} />
                </td>
                <td className="px-4 py-3 text-right">{money(a.total)}</td>
                <td className="px-4 py-3">
                  <StatusActions a={a} size="xs" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!list.length ? <p className="p-8 text-center text-sm text-muted">No appointments match these filters.</p> : null}
      </div>
      <AppointmentDrawer appt={open} onClose={() => setOpen(null)} />
    </>
  );
}
