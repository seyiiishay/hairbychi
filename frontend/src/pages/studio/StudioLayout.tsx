import { useEffect, useState, type ReactNode } from "react";
import { Link, NavLink, Navigate, Outlet, useLocation } from "react-router-dom";
import {
  BarChart3,
  CalendarDays,
  ClipboardList,
  CreditCard,
  ExternalLink,
  Image,
  Inbox,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquare,
  Scissors,
  Settings,
  Tag,
  Users,
  UserSquare2,
  X,
} from "lucide-react";
import { cn } from "../../lib/format";
import { currentUser, signOut, useStore } from "../../store/store";
import Logo from "../../ui/Logo";

const NAV = [
  { to: "/studio", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/studio/calendar", label: "Calendar", icon: CalendarDays },
  { to: "/studio/appointments", label: "Appointments", icon: ClipboardList },
  { to: "/studio/inbox", label: "Inbox", icon: Inbox, badge: true },
  { to: "/studio/customers", label: "Customers", icon: Users },
  { to: "/studio/services", label: "Services", icon: Scissors },
  { to: "/studio/staff", label: "Staff", icon: UserSquare2 },
  { to: "/studio/payments", label: "Payments", icon: CreditCard },
  { to: "/studio/reviews", label: "Reviews", icon: MessageSquare },
  { to: "/studio/discounts", label: "Discounts", icon: Tag },
  { to: "/studio/gallery", label: "Gallery", icon: Image },
  { to: "/studio/reports", label: "Reports", icon: BarChart3 },
  { to: "/studio/settings", label: "Settings", icon: Settings },
];

export default function StudioLayout() {
  const s = useStore();
  const user = currentUser(s);
  const loc = useLocation();
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [loc.pathname]);
  if (!user || user.role !== "admin") return <Navigate to={`/studio/login?next=${encodeURIComponent(loc.pathname)}`} replace />;
  const inbox = s.messages.filter((m) => !m.read).length + s.consultations.filter((c) => c.status === "new").length;

  const nav = (
    <nav aria-label="Studio" className="flex flex-col gap-0.5">
      {NAV.map((n) => (
        <NavLink
          key={n.to}
          to={n.to}
          end={n.end}
          className={({ isActive }) =>
            cn(
              "flex min-h-10 items-center gap-3 rounded-xl px-3 text-sm transition",
              isActive ? "bg-ivory/10 font-semibold text-ivory" : "text-ivory/65 hover:bg-ivory/5 hover:text-ivory",
            )
          }
        >
          <n.icon className="size-4" aria-hidden /> {n.label}
          {n.badge && inbox ? <span className="ml-auto rounded-full bg-gold px-2 text-[0.7rem] font-semibold text-ink">{inbox}</span> : null}
        </NavLink>
      ))}
    </nav>
  );

  return (
    <div className="min-h-screen bg-[#f6f3ee] lg:grid lg:grid-cols-[250px_1fr]">
      <aside className="sticky top-0 hidden h-screen flex-col bg-ink p-5 lg:flex">
        <Logo light to="/studio" />
        <p className="mt-1 mb-8 pl-12 text-[0.65rem] tracking-[0.3em] text-gold uppercase">Studio</p>
        {nav}
        <div className="mt-auto space-y-1 border-t border-ivory/10 pt-4 text-sm">
          <Link to="/" className="flex min-h-10 items-center gap-3 rounded-xl px-3 text-ivory/65 hover:text-ivory">
            <ExternalLink className="size-4" aria-hidden /> View website
          </Link>
          <button onClick={signOut} className="flex min-h-10 w-full items-center gap-3 rounded-xl px-3 text-ivory/65 hover:text-ivory">
            <LogOut className="size-4" aria-hidden /> Sign out
          </button>
        </div>
      </aside>

      <header className="sticky top-0 z-30 flex h-16 items-center justify-between bg-ink px-4 lg:hidden">
        <Logo light to="/studio" />
        <button onClick={() => setOpen((o) => !o)} className="grid size-10 place-items-center rounded-full text-ivory" aria-label={open ? "Close menu" : "Open menu"} aria-expanded={open}>
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </header>
      {open ? <div className="fixed inset-x-0 top-16 bottom-0 z-30 overflow-y-auto bg-ink p-4 lg:hidden">{nav}</div> : null}

      <main className="min-w-0 p-4 md:p-8 lg:p-10">
        <Outlet />
      </main>
    </div>
  );
}

export function StudioTitle({ title, sub, actions }: { title: string; sub?: string; actions?: ReactNode }) {
  return (
    <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div>
        <h1 className="text-4xl md:text-5xl">{title}</h1>
        {sub ? <p className="mt-1 text-sm text-muted">{sub}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}

export function Panel({ title, children, className, action }: { title?: string; children: ReactNode; className?: string; action?: ReactNode }) {
  return (
    <section className={cn("rounded-2xl bg-white p-5 shadow-[0_1px_2px_rgba(28,24,22,0.05)] ring-1 ring-line/70 md:p-6", className)}>
      {title ? (
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="font-sans text-base font-semibold tracking-normal">{title}</h2>
          {action}
        </div>
      ) : null}
      {children}
    </section>
  );
}

export function Stat({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <div className="rounded-2xl bg-white p-5 ring-1 ring-line/70">
      <p className="text-xs font-semibold tracking-wider text-muted uppercase">{label}</p>
      <p className="mt-2 font-display text-5xl leading-none">{value}</p>
      {hint ? <p className="mt-2 text-xs text-muted">{hint}</p> : null}
    </div>
  );
}

export const inputCls = "w-full rounded-lg border border-line bg-white px-3 py-2 text-sm focus:border-gold focus:outline-none focus:ring-3 focus:ring-gold/15";

export function SmallField({ label, children, className }: { label: string; children: ReactNode; className?: string }) {
  return (
    <label className={cn("flex flex-col gap-1.5 text-xs font-semibold text-ink-soft", className)}>
      {label}
      {children}
    </label>
  );
}
