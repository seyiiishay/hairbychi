import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import type { Appointment } from "../../data/types";
import { cn, longDate, money, shortDate } from "../../lib/format";
import { useStore } from "../../store/store";
import { markMessageRead, setConsultationStatus, setReviewStatus } from "../../store/studio";
import { Stars, StatusBadge } from "../../ui/bits";
import Modal from "../../ui/Modal";
import { AppointmentDrawer } from "./Operations";
import { Panel, StudioTitle, inputCls } from "./StudioLayout";

interface Customer {
  email: string;
  name: string;
  phone: string;
  visits: number;
  spend: number;
  last?: string;
  noShows: number;
  appts: Appointment[];
  account: boolean;
}

export function CustomersAdmin() {
  const s = useStore();
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<"recent" | "spend" | "visits">("recent");
  const [open, setOpen] = useState<Customer | null>(null);
  const [appt, setAppt] = useState<Appointment | null>(null);

  const customers = useMemo(() => {
    const map = new Map<string, Customer>();
    for (const a of s.appointments) {
      const e = a.customer.email.toLowerCase();
      const c = map.get(e) ?? { email: e, name: `${a.customer.firstName} ${a.customer.lastName}`, phone: a.customer.phone, visits: 0, spend: 0, noShows: 0, appts: [], account: false };
      c.appts.push(a);
      if (a.status === "completed") {
        c.visits++;
        c.spend += a.total;
        if (!c.last || a.date > c.last) c.last = a.date;
      }
      if (a.status === "no-show") c.noShows++;
      map.set(e, c);
    }
    for (const u of s.users.filter((x) => x.role === "customer")) {
      const c = map.get(u.email.toLowerCase());
      if (c) c.account = true;
      else map.set(u.email, { email: u.email, name: `${u.firstName} ${u.lastName}`, phone: u.phone, visits: 0, spend: 0, noShows: 0, appts: [], account: true });
    }
    return [...map.values()];
  }, [s.appointments, s.users]);

  const list = customers
    .filter((c) => !q || `${c.name} ${c.email} ${c.phone}`.toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) => (sort === "spend" ? b.spend - a.spend : sort === "visits" ? b.visits - a.visits : (b.last ?? "").localeCompare(a.last ?? "")));

  return (
    <>
      <StudioTitle title="Customers" sub={`${customers.length} clients`} />
      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <label className="relative flex-1">
          <span className="sr-only">Search customers</span>
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted" aria-hidden />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, email or phone" className={cn(inputCls, "pl-9")} />
        </label>
        <select value={sort} onChange={(e) => setSort(e.target.value as typeof sort)} className={cn(inputCls, "sm:w-48")} aria-label="Sort">
          <option value="recent">Most recent visit</option>
          <option value="spend">Highest spend</option>
          <option value="visits">Most visits</option>
        </select>
      </div>
      <div className="overflow-x-auto rounded-2xl bg-white ring-1 ring-line/70">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b border-line text-xs tracking-wider text-muted uppercase">
            <tr>
              <th className="px-4 py-3 font-semibold">Client</th>
              <th className="px-4 py-3 font-semibold">Phone</th>
              <th className="px-4 py-3 text-right font-semibold">Visits</th>
              <th className="px-4 py-3 text-right font-semibold">Lifetime spend</th>
              <th className="px-4 py-3 font-semibold">Last visit</th>
              <th className="px-4 py-3 font-semibold">Flags</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {list.slice(0, 150).map((c) => (
              <tr key={c.email} className="cursor-pointer hover:bg-cream/60" onClick={() => setOpen(c)}>
                <td className="px-4 py-3">
                  <button className="text-left font-semibold hover:underline">{c.name}</button>
                  <span className="block text-xs text-muted">{c.email}</span>
                </td>
                <td className="px-4 py-3">{c.phone}</td>
                <td className="px-4 py-3 text-right">{c.visits}</td>
                <td className="px-4 py-3 text-right">{money(c.spend)}</td>
                <td className="px-4 py-3">{c.last ? shortDate(c.last) : "—"}</td>
                <td className="px-4 py-3 text-xs">
                  {c.account ? <span className="mr-1 rounded-full bg-gold-soft px-2 py-0.5">Account</span> : null}
                  {c.noShows ? <span className="rounded-full bg-error-soft px-2 py-0.5 text-error">{c.noShows} no-show{c.noShows > 1 ? "s" : ""}</span> : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {open ? (
        <Modal open onClose={() => setOpen(null)} title={open.name} size="lg">
          <p className="text-sm text-muted">
            {open.email} · {open.phone}
          </p>
          <div className="mt-4 grid grid-cols-3 gap-3 text-center">
            {[
              ["Visits", open.visits],
              ["Spend", money(open.spend)],
              ["No-shows", open.noShows],
            ].map(([l, v]) => (
              <div key={l} className="rounded-xl bg-cream p-3">
                <p className="text-xs text-muted">{l}</p>
                <p className="font-display text-3xl">{v}</p>
              </div>
            ))}
          </div>
          {(() => {
            const user = s.users.find((u) => u.email.toLowerCase() === open.email);
            return user?.preferences.hairType || user?.preferences.notes ? (
              <p className="mt-4 rounded-xl bg-gold-soft/40 p-3 text-sm">
                <strong>Preferences:</strong> {[user.preferences.hairType, user.preferences.notes].filter(Boolean).join(" · ")}
              </p>
            ) : null;
          })()}
          <h3 className="mt-6 mb-2 font-sans text-sm font-semibold">History</h3>
          <ul className="divide-y divide-line text-sm">
            {[...open.appts]
              .sort((a, b) => b.date.localeCompare(a.date))
              .map((a) => (
                <li key={a.ref}>
                  <button onClick={() => setAppt(a)} className="flex w-full items-center justify-between gap-3 py-2.5 text-left hover:underline">
                    <span>
                      {shortDate(a.date)} · {s.services.find((x) => x.id === a.serviceId)?.name}
                    </span>
                    <StatusBadge status={a.status} />
                  </button>
                </li>
              ))}
          </ul>
        </Modal>
      ) : null}
      <AppointmentDrawer appt={appt} onClose={() => setAppt(null)} />
    </>
  );
}

export function ReviewsAdmin() {
  const s = useStore();
  const [tab, setTab] = useState<"pending" | "published" | "hidden">("pending");
  const list = s.reviews.filter((r) => r.status === tab);
  return (
    <>
      <StudioTitle title="Reviews" sub="Approve reviews before they appear on the website" />
      <div className="mb-5 inline-flex rounded-full bg-white p-1 ring-1 ring-line" role="tablist">
        {(["pending", "published", "hidden"] as const).map((t) => (
          <button key={t} role="tab" aria-selected={tab === t} onClick={() => setTab(t)} className={cn("min-h-9 rounded-full px-4 text-sm font-semibold capitalize", tab === t && "bg-ink text-ivory")}>
            {t} ({s.reviews.filter((r) => r.status === t).length})
          </button>
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {list.map((r) => (
          <Panel key={r.id}>
            <div className="flex items-center justify-between">
              <Stars rating={r.rating} />
              <span className="text-xs text-muted">{shortDate(r.date)}</span>
            </div>
            <p className="mt-3 font-display text-xl leading-snug">“{r.text}”</p>
            <p className="mt-3 text-sm">
              <strong>{r.name}</strong> · {s.services.find((x) => x.id === r.serviceId)?.name} with {s.stylists.find((x) => x.id === r.stylistId)?.name}
              {r.withPhoto ? <span className="text-muted"> · photo consent</span> : null}
            </p>
            <div className="mt-4 flex gap-2">
              {r.status !== "published" ? (
                <button onClick={() => setReviewStatus(r.id, "published")} className="min-h-9 rounded-full bg-ink px-4 text-xs font-semibold text-ivory">
                  Publish
                </button>
              ) : null}
              {r.status !== "hidden" ? (
                <button onClick={() => setReviewStatus(r.id, "hidden")} className="min-h-9 rounded-full border border-line px-4 text-xs font-semibold">
                  Hide
                </button>
              ) : null}
            </div>
          </Panel>
        ))}
      </div>
      {!list.length ? <p className="text-sm text-muted">Nothing here.</p> : null}
    </>
  );
}

export function Inbox() {
  const s = useStore();
  return (
    <>
      <StudioTitle title="Inbox" sub="Messages, style consultations and the waitlist" />
      <div className="grid gap-6 xl:grid-cols-2">
        <Panel title={`Consultation requests (${s.consultations.filter((c) => c.status === "new").length} new)`}>
          {s.consultations.length ? (
            <ul className="divide-y divide-line">
              {s.consultations.map((c) => (
                <li key={c.id} className="flex gap-4 py-4">
                  {c.image ? <img src={c.image} alt={`Inspiration from ${c.name}`} className="size-20 shrink-0 rounded-xl object-cover" /> : null}
                  <div className="min-w-0 flex-1 text-sm">
                    <p className="font-semibold">
                      {c.name} <span className="font-normal text-muted">· {c.email}</span>
                    </p>
                    {c.notes ? <p className="mt-1 text-ink-soft">{c.notes}</p> : null}
                    {c.preferredDate ? <p className="mt-1 text-xs text-muted">Ideal date: {longDate(c.preferredDate)}</p> : null}
                    {c.status === "new" ? (
                      <div className="mt-2 flex gap-2">
                        <button onClick={() => setConsultationStatus(c.id, "approved")} className="min-h-8 rounded-full bg-ink px-3 text-xs font-semibold text-ivory">
                          Approve & send booking link
                        </button>
                        <button onClick={() => setConsultationStatus(c.id, "declined")} className="min-h-8 rounded-full border border-line px-3 text-xs font-semibold">
                          Decline
                        </button>
                      </div>
                    ) : (
                      <p className="mt-2 text-xs font-semibold capitalize text-muted">{c.status}</p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted">No consultation requests yet.</p>
          )}
        </Panel>
        <Panel title="Messages">
          <ul className="divide-y divide-line">
            {s.messages.map((m) => (
              <li key={m.id} className="py-4 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-semibold">
                    {!m.read ? <span className="mr-2 inline-block size-2 rounded-full bg-gold" aria-label="Unread" /> : null}
                    {m.name} <span className="font-normal text-muted">· {m.reason}</span>
                  </p>
                  <span className="shrink-0 text-xs text-muted">{shortDate(m.createdAt.slice(0, 10))}</span>
                </div>
                <p className="mt-1 text-ink-soft">{m.message}</p>
                <div className="mt-2 flex gap-3 text-xs font-semibold">
                  <a href={`mailto:${m.email}`} className="underline">
                    Reply by email
                  </a>
                  {!m.read ? (
                    <button onClick={() => markMessageRead(m.id)} className="underline">
                      Mark as read
                    </button>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        </Panel>
        <Panel title="Waitlist" className="xl:col-span-2">
          {s.waitlist.length ? (
            <ul className="divide-y divide-line text-sm">
              {s.waitlist.map((w) => (
                <li key={w.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
                  <span>
                    <strong>{w.name}</strong> · {s.services.find((x) => x.id === w.serviceId)?.name} · {shortDate(w.date)} ({w.timeRange}) · {w.stylistId ? s.stylists.find((x) => x.id === w.stylistId)?.name : "any stylist"}
                  </span>
                  <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-semibold", w.notified ? "bg-success-soft text-success" : "bg-sand")}>{w.notified ? "Notified of opening" : "Waiting"}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted">No one is waiting. When a client joins the waitlist for a full day, they'll appear here and be emailed automatically if a slot opens.</p>
          )}
        </Panel>
      </div>
    </>
  );
}
