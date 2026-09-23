import { useState, type FormEvent } from "react";
import { Link, NavLink, Navigate, Outlet, useLocation, useParams } from "react-router-dom";
import { Award, CalendarDays, CreditCard, Heart, LayoutGrid, LogOut, MailWarning, User as UserIcon } from "lucide-react";
import type { Appointment } from "../../data/types";
import { clock, cn, longDate, money, monthDay, shortDate } from "../../lib/format";
import { ACTIVE_STATUSES, appointmentsFor, currentUser, favouritesOf, signOut, updateUser, useStore } from "../../store/store";
import AppointmentView from "../../ui/AppointmentView";
import { Button, ButtonLink } from "../../ui/Button";
import { Container, EmptyState, StatusBadge } from "../../ui/bits";
import { HeartButton, ServiceCard, priceLabel } from "../../ui/cards";
import { Input, Select, Textarea } from "../../ui/form";
import Photo from "../../ui/Photo";
import { useToast } from "../../ui/Toast";

const NAV = [
  { to: "/account", label: "Overview", icon: LayoutGrid, end: true },
  { to: "/account/appointments", label: "Appointments", icon: CalendarDays },
  { to: "/account/saved", label: "Saved Looks", icon: Heart },
  { to: "/account/payments", label: "Payments", icon: CreditCard },
  { to: "/account/profile", label: "Profile", icon: UserIcon },
];

const REWARD_AT = 500;

function useMine() {
  const s = useStore();
  const user = currentUser(s)!;
  const all = appointmentsFor(s, user.email).sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`));
  const upcoming = all.filter((a) => ACTIVE_STATUSES.includes(a.status));
  const past = all.filter((a) => !ACTIVE_STATUSES.includes(a.status)).reverse();
  return { s, user, all, upcoming, past };
}

export function AccountLayout() {
  const s = useStore();
  const user = currentUser(s);
  const loc = useLocation();
  if (!user) return <Navigate to={`/signin?next=${encodeURIComponent(loc.pathname)}`} replace />;
  if (user.role === "admin") return <Navigate to="/studio" replace />;
  return (
    <div className="bg-cream/60">
      <Container className="py-10 md:py-14">
        {!user.verified ? (
          <div className="mb-8 flex flex-col gap-3 rounded-2xl bg-warning-soft p-4 text-sm text-warning sm:flex-row sm:items-center sm:justify-between">
            <p className="flex items-center gap-2">
              <MailWarning className="size-4 shrink-0" aria-hidden /> Please verify your email ({user.email}) to secure your account.
            </p>
            <button onClick={() => updateUser(user.id, { verified: true })} className="font-semibold underline underline-offset-4">
              I've clicked the link (demo)
            </button>
          </div>
        ) : null}
        <div className="grid gap-8 lg:grid-cols-[230px_1fr] lg:gap-12">
          <nav aria-label="Account" className="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5 lg:mx-0 lg:flex-col lg:gap-1 lg:overflow-visible lg:px-0">
            {NAV.map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                end={n.end}
                className={({ isActive }) =>
                  cn(
                    "flex min-h-11 shrink-0 items-center gap-3 rounded-full px-4 text-sm font-medium transition lg:rounded-xl",
                    isActive ? "bg-ink text-ivory" : "bg-white/70 text-ink-soft ring-1 ring-line hover:text-ink lg:bg-transparent lg:ring-0 lg:hover:bg-white/70",
                  )
                }
              >
                <n.icon className="size-4" aria-hidden /> {n.label}
              </NavLink>
            ))}
            <button onClick={signOut} className="flex min-h-11 shrink-0 items-center gap-3 rounded-full px-4 text-sm font-medium text-muted hover:text-ink lg:mt-6 lg:rounded-xl">
              <LogOut className="size-4" aria-hidden /> Sign out
            </button>
          </nav>
          <div className="min-w-0">
            <Outlet />
          </div>
        </div>
      </Container>
    </div>
  );
}

function ApptRow({ a }: { a: Appointment }) {
  const s = useStore();
  const svc = s.services.find((x) => x.id === a.serviceId)!;
  const stylist = s.stylists.find((x) => x.id === a.stylistId);
  const active = ACTIVE_STATUSES.includes(a.status);
  return (
    <li className="flex items-center gap-4 rounded-2xl bg-white/80 p-3 ring-1 ring-line">
      <Photo art={svc.art} tone={svc.tone} path={`services/${svc.id}`} alt="" className="aspect-square w-16 shrink-0 rounded-xl" />
      <div className="min-w-0 flex-1">
        <p className="truncate font-display text-xl leading-tight">{svc.name}</p>
        <p className="text-xs text-muted">
          {shortDate(a.date)} · {clock(a.time)} · {stylist?.name}
        </p>
        <div className="mt-1">
          <StatusBadge status={a.status} />
        </div>
      </div>
      <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
        <ButtonLink to={`/account/appointments/${a.ref}`} size="sm" variant={active ? "primary" : "secondary"}>
          View
        </ButtonLink>
        {!active ? (
          <ButtonLink to={`/book?service=${a.serviceId}&stylist=${a.stylistId}`} size="sm" variant="secondary" className="hidden sm:inline-flex">
            Book again
          </ButtonLink>
        ) : null}
      </div>
    </li>
  );
}

export function Overview() {
  const { s, user, upcoming, past } = useMine();
  const next = upcoming[0];
  const svc = next ? s.services.find((x) => x.id === next.serviceId) : null;
  const saved = favouritesOf(s);
  const toGo = REWARD_AT - (user.points % REWARD_AT);
  return (
    <div className="space-y-10">
      <h1 className="text-5xl md:text-6xl">
        Welcome back, <em className="text-gold-deep">{user.firstName}.</em>
      </h1>

      {next && svc ? (
        <section aria-labelledby="up-h" className="overflow-hidden rounded-[1.75rem] bg-ink text-ivory">
          <div className="grid sm:grid-cols-[1fr_200px]">
            <div className="p-6 md:p-8">
              <p id="up-h" className="eyebrow !text-gold">
                Upcoming appointment
              </p>
              <p className="mt-4 font-display text-5xl leading-none">{monthDay(next.date)}</p>
              <p className="mt-1 text-lg text-ivory/80">{clock(next.time)}</p>
              <p className="mt-4 text-xl">{svc.name}</p>
              <p className="text-sm text-ivory/70">Stylist: {s.stylists.find((x) => x.id === next.stylistId)?.name}</p>
              <div className="mt-6 flex flex-wrap gap-2">
                <ButtonLink to={`/account/appointments/${next.ref}`} variant="light" size="sm">
                  View appointment
                </ButtonLink>
                <Link to={`/account/appointments/${next.ref}`} className="inline-flex min-h-9 items-center rounded-full border border-ivory/40 px-4 text-[0.8rem] font-semibold hover:bg-ivory/10">
                  Reschedule
                </Link>
                <Link to={`/account/appointments/${next.ref}`} className="inline-flex min-h-9 items-center rounded-full border border-ivory/40 px-4 text-[0.8rem] font-semibold hover:bg-ivory/10">
                  Cancel
                </Link>
              </div>
            </div>
            <Photo art={svc.art} tone={svc.tone} path={`services/${svc.id}`} alt="" className="hidden sm:block" />
          </div>
        </section>
      ) : (
        <EmptyState title="Your next look starts here." body="You don't have any upcoming appointments." action="Book an appointment" to="/book" icon={<CalendarDays className="size-6" />} />
      )}

      <section aria-labelledby="rw-h" className="rounded-[var(--radius-card)] bg-white/80 p-6 ring-1 ring-line">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p id="rw-h" className="flex items-center gap-2 text-sm font-semibold">
              <Award className="size-4 text-gold-deep" aria-hidden /> Beauty Rewards
            </p>
            <p className="mt-2 font-display text-4xl">
              {user.points % REWARD_AT} <span className="text-2xl text-muted">/ {REWARD_AT} points</span>
            </p>
          </div>
          <p className="max-w-[12rem] text-right text-xs text-muted">Earn 1 point for every $1 spent. {REWARD_AT} points = $25 reward.</p>
        </div>
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-sand" role="progressbar" aria-valuemin={0} aria-valuemax={REWARD_AT} aria-valuenow={user.points % REWARD_AT} aria-label="Progress to next reward">
          <div className="h-full rounded-full bg-gradient-to-r from-gold to-rose-deep transition-all duration-1000" style={{ width: `${((user.points % REWARD_AT) / REWARD_AT) * 100}%` }} />
        </div>
        <p className="mt-3 text-sm text-muted">You are {toGo} points away from your next reward.</p>
      </section>

      <section aria-labelledby="prev-h">
        <div className="mb-4 flex items-center justify-between">
          <h2 id="prev-h" className="text-3xl">
            Previous appointments
          </h2>
          <Link to="/account/appointments" className="text-sm font-semibold underline decoration-gold underline-offset-4">
            See all
          </Link>
        </div>
        {past.length ? (
          <ul className="space-y-3">
            {past.slice(0, 3).map((a) => (
              <ApptRow key={a.ref} a={a} />
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted">Once you've visited, your history appears here so you can book the same look again in one tap.</p>
        )}
      </section>

      {saved.length ? (
        <section aria-labelledby="saved-h">
          <div className="mb-4 flex items-center justify-between">
            <h2 id="saved-h" className="text-3xl">
              Saved looks
            </h2>
            <Link to="/account/saved" className="text-sm font-semibold underline decoration-gold underline-offset-4">
              See all
            </Link>
          </div>
          <SavedGrid ids={saved.slice(0, 3)} />
        </section>
      ) : null}
    </div>
  );
}

export function Appointments() {
  const { upcoming, past } = useMine();
  const [tab, setTab] = useState<"upcoming" | "past">("upcoming");
  const list = tab === "upcoming" ? upcoming : past;
  return (
    <div>
      <h1 className="text-5xl">Appointments</h1>
      <div className="mt-6 mb-6 inline-flex rounded-full bg-white/70 p-1 ring-1 ring-line" role="tablist">
        {(["upcoming", "past"] as const).map((t) => (
          <button key={t} role="tab" aria-selected={tab === t} onClick={() => setTab(t)} className={cn("min-h-10 rounded-full px-5 text-sm font-semibold capitalize", tab === t ? "bg-ink text-ivory" : "text-ink-soft")}>
            {t} ({(t === "upcoming" ? upcoming : past).length})
          </button>
        ))}
      </div>
      {list.length ? (
        <ul className="space-y-3">
          {list.map((a) => (
            <ApptRow key={a.ref} a={a} />
          ))}
        </ul>
      ) : tab === "upcoming" ? (
        <EmptyState title="Your next look starts here." body="You don't have any upcoming appointments." action="Book an appointment" to="/book" icon={<CalendarDays className="size-6" />} />
      ) : (
        <p className="text-sm text-muted">No past appointments yet.</p>
      )}
    </div>
  );
}

export function AppointmentDetail() {
  const { ref } = useParams();
  const { all } = useMine();
  const appt = all.find((a) => a.ref === ref);
  if (!appt) return <EmptyState title="Appointment not found." body="It may belong to a different account." action="My appointments" to="/account/appointments" />;
  return (
    <div>
      <Link to="/account/appointments" className="mb-6 inline-flex min-h-11 items-center text-sm font-semibold text-muted hover:text-ink">
        ← All appointments
      </Link>
      <AppointmentView appt={appt} />
    </div>
  );
}

function SavedGrid({ ids }: { ids: string[] }) {
  const s = useStore();
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3">
      {ids.map((id) => {
        const svc = s.services.find((x) => x.id === id);
        if (svc) return <ServiceCard key={id} service={svc} />;
        const g = s.gallery.find((x) => x.id === id);
        if (!g) return null;
        const gs = s.services.find((x) => x.id === g.serviceId);
        return (
          <div key={id}>
            <div className="relative">
              <Photo path={`gallery/${g.id}`} src={g.image} art={g.art} tone={g.tone} alt={g.title} className="aspect-[4/5] rounded-[var(--radius-card)]" />
              <HeartButton id={g.id} label={g.title} className="absolute top-3 right-3" />
            </div>
            <p className="mt-3 font-display text-2xl leading-tight">{g.title}</p>
            {gs ? (
              <Link to={`/book?service=${gs.id}`} className="mt-1 inline-block text-sm font-semibold underline decoration-gold underline-offset-4">
                Book this style · {priceLabel(gs)}
              </Link>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

export function Saved() {
  const s = useStore();
  const ids = favouritesOf(s);
  return (
    <div>
      <h1 className="text-5xl">Saved looks</h1>
      <p className="mt-2 mb-8 text-muted">Tap the ♡ on any style or gallery photo to save it here.</p>
      {ids.length ? <SavedGrid ids={ids} /> : <EmptyState title="Nothing saved yet." body="Browse the gallery and heart the looks you love." action="Explore the gallery" to="/gallery" icon={<Heart className="size-6" />} />}
    </div>
  );
}

export function Payments() {
  const { s, all } = useMine();
  const rows = [...all].filter((a) => a.paid > 0).reverse();
  return (
    <div>
      <h1 className="text-5xl">Payments</h1>
      <p className="mt-2 mb-8 text-muted">Receipts for deposits, payments and refunds. Card details are held by our payment provider, never by us.</p>
      {rows.length ? (
        <div className="overflow-x-auto rounded-[var(--radius-card)] bg-white/80 ring-1 ring-line">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead className="border-b border-line text-xs tracking-wider text-muted uppercase">
              <tr>
                <th className="px-5 py-3 font-semibold">Date</th>
                <th className="px-5 py-3 font-semibold">Service</th>
                <th className="px-5 py-3 font-semibold">Method</th>
                <th className="px-5 py-3 text-right font-semibold">Paid</th>
                <th className="px-5 py-3 text-right font-semibold">Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows.map((a) => (
                <tr key={a.ref}>
                  <td className="px-5 py-4 whitespace-nowrap">{shortDate(a.date)}</td>
                  <td className="px-5 py-4">
                    {s.services.find((x) => x.id === a.serviceId)?.name}
                    <span className="block font-mono text-[0.7rem] text-muted">{a.ref}</span>
                  </td>
                  <td className="px-5 py-4 capitalize">{a.paymentMethod.replace("-", " ")}</td>
                  <td className="px-5 py-4 text-right">
                    {money(a.paid)}
                    {a.refunded ? <span className="block text-xs text-success">−{money(a.refunded)} refunded</span> : null}
                  </td>
                  <td className="px-5 py-4 text-right">{ACTIVE_STATUSES.includes(a.status) ? money(a.total - a.paid) : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-sm text-muted">No payments yet.</p>
      )}
    </div>
  );
}

export function Profile() {
  const s = useStore();
  const user = currentUser(s)!;
  const toast = useToast();
  const [f, setF] = useState({
    firstName: user.firstName,
    lastName: user.lastName,
    phone: user.phone,
    hairType: user.preferences.hairType ?? "",
    favouriteStylistId: user.preferences.favouriteStylistId ?? "",
    notes: user.preferences.notes ?? "",
  });
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value });
  const save = (e: FormEvent) => {
    e.preventDefault();
    updateUser(user.id, {
      firstName: f.firstName,
      lastName: f.lastName,
      phone: f.phone,
      preferences: { hairType: f.hairType, favouriteStylistId: f.favouriteStylistId || undefined, notes: f.notes },
    });
    toast("Profile saved");
  };
  return (
    <div>
      <h1 className="text-5xl">Profile</h1>
      <form onSubmit={save} className="mt-8 grid gap-5 rounded-[var(--radius-card)] bg-white/80 p-6 ring-1 ring-line sm:grid-cols-2 md:p-8">
        <Input label="First name" value={f.firstName} onChange={set("firstName")} required />
        <Input label="Last name" value={f.lastName} onChange={set("lastName")} required />
        <Input label="Email" value={user.email} disabled hint="Contact us to change the email on your account." />
        <Input label="Phone" type="tel" value={f.phone} onChange={set("phone")} />
        <h2 className="mt-4 text-3xl sm:col-span-2">Hair preferences</h2>
        <Input label="Hair type" optional value={f.hairType} onChange={set("hairType")} placeholder="e.g. 4C, high density" />
        <Select label="Favourite stylist" value={f.favouriteStylistId} onChange={set("favouriteStylistId")}>
          <option value="">No preference</option>
          {s.stylists.map((st) => (
            <option key={st.id} value={st.id}>
              {st.name}
            </option>
          ))}
        </Select>
        <Textarea label="Notes for your stylist" optional value={f.notes} onChange={set("notes")} className="sm:col-span-2" placeholder="Sensitivities, preferences, products you love…" />
        <div className="sm:col-span-2">
          <Button type="submit">Save changes</Button>
        </div>
      </form>
      <p className="mt-6 text-xs text-muted">
        Member since {longDate(user.createdAt.slice(0, 10))}. To delete your account and data, <Link to="/contact" className="underline">contact us</Link>.
      </p>
    </div>
  );
}
