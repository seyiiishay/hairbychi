import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { CalendarDays, Heart, Menu, User, X } from "lucide-react";
import { SALON } from "../data/catalog";
import { cn } from "../lib/format";
import { currentUser, useStore } from "../store/store";
import { ButtonLink } from "./Button";
import Logo, { SocialIcon } from "./Logo";

const NAV = [
  { to: "/", label: "Home" },
  { to: "/services", label: "Services" },
  { to: "/gallery", label: "Gallery" },
  { to: "/about", label: "About" },
  { to: "/contact", label: "Contact" },
];

function ScrollToTop() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (hash) {
      requestAnimationFrame(() => document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: "smooth" }));
      return;
    }
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
  }, [pathname, hash]);
  return null;
}

function Header() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { pathname } = useLocation();
  const user = currentUser(useStore());
  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 12);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
  }, [open]);

  const accountTo = user ? (user.role === "admin" ? "/studio" : "/account") : "/signin";
  const accountLabel = user ? (user.role === "admin" ? "Studio" : `Hi, ${user.firstName}`) : "Sign In";

  return (
    <header className={cn("sticky top-0 z-40 transition-all duration-500", scrolled ? "bg-ivory/90 shadow-[0_1px_0_var(--color-line)] backdrop-blur-md" : "bg-ivory")}>
      <a href="#main" className="sr-only rounded-full bg-ink px-4 py-2 text-ivory focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-50">
        Skip to content
      </a>
      <div className="mx-auto flex h-18 max-w-7xl items-center justify-between gap-6 px-5 md:h-20 md:px-10">
        <Logo />
        <nav aria-label="Main" className="hidden items-center gap-8 lg:flex">
          {NAV.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.to === "/"}
              className={({ isActive }) =>
                cn(
                  "relative py-2 text-sm font-medium text-ink-soft transition hover:text-ink",
                  "after:absolute after:inset-x-0 after:-bottom-0.5 after:h-px after:origin-left after:scale-x-0 after:bg-gold after:transition-transform hover:after:scale-x-100",
                  isActive && "text-ink after:scale-x-100",
                )
              }
            >
              {n.label}
            </NavLink>
          ))}
        </nav>
        <div className="flex items-center gap-2 md:gap-4">
          <Link to={accountTo} className="hidden items-center gap-2 text-sm font-medium text-ink-soft hover:text-ink sm:inline-flex">
            <User className="size-4" aria-hidden /> {accountLabel}
          </Link>
          <ButtonLink to="/book" size="md" className="hidden sm:inline-flex">
            Book Appointment
          </ButtonLink>
          <button
            className="grid size-11 place-items-center rounded-full border border-line lg:hidden"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? "Close menu" : "Open menu"}
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>
      {open ? (
        <div id="mobile-menu" className="fixed inset-x-0 top-18 bottom-0 z-40 flex animate-fade-up flex-col bg-ivory px-6 pt-6 pb-28 lg:hidden">
          <nav aria-label="Mobile" className="flex flex-col">
            {[...NAV, { to: "/stylists", label: "Stylists" }, { to: "/reviews", label: "Reviews" }, { to: "/faq", label: "FAQ" }].map((n, i) => (
              <NavLink
                key={n.to}
                to={n.to}
                end={n.to === "/"}
                className={({ isActive }) => cn("border-b border-line py-4 font-display text-4xl", isActive ? "text-gold-deep" : "text-ink")}
                style={{ animation: `fade-up .6s ${i * 40}ms both` }}
              >
                {n.label}
              </NavLink>
            ))}
          </nav>
          <div className="mt-auto flex flex-col gap-3">
            <ButtonLink to={accountTo} variant="secondary" size="lg">
              {accountLabel}
            </ButtonLink>
            <ButtonLink to="/book" size="lg" arrow>
              Book Appointment
            </ButtonLink>
          </div>
        </div>
      ) : null}
    </header>
  );
}

/** Sticky bottom action bar on phones: the booking button is always a thumb away. */
function MobileBar() {
  const { pathname } = useLocation();
  // Booking has its own footer bar; service pages show a price + book bar instead
  if (pathname.startsWith("/book") || /^\/services\/[^/]+$/.test(pathname)) return null;
  return (
    <nav aria-label="Quick actions" className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-ivory/95 px-4 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] backdrop-blur-md md:hidden">
      <div className="flex items-center gap-2">
        <Link to="/account/saved" className="flex min-h-12 flex-1 flex-col items-center justify-center text-[0.7rem] text-ink-soft">
          <Heart className="size-5" aria-hidden /> Saved
        </Link>
        <Link to="/account/appointments" className="flex min-h-12 flex-1 flex-col items-center justify-center text-[0.7rem] text-ink-soft">
          <CalendarDays className="size-5" aria-hidden /> Bookings
        </Link>
        <ButtonLink to="/book" size="lg" className="flex-[2.2]">
          Book Now
        </ButtonLink>
      </div>
    </nav>
  );
}

function Footer() {
  const cols = [
    { title: "Explore", links: [["Services", "/services"], ["Gallery", "/gallery"], ["About", "/about"], ["Stylists", "/stylists"], ["Find My Style", "/find-my-style"]] },
    { title: "Help", links: [["FAQ", "/faq"], ["Contact", "/contact"], ["Policies", "/policies"], ["Cancellation Policy", "/policies#cancellation"]] },
    { title: "Account", links: [["Sign In", "/signin"], ["My Bookings", "/account/appointments"], ["Saved Looks", "/account/saved"], ["Reviews", "/reviews"]] },
  ];
  return (
    <footer className="bg-ink pb-28 text-ivory/80 md:pb-0">
      <div className="mx-auto grid max-w-7xl gap-12 px-5 py-16 md:grid-cols-[1.4fr_repeat(4,1fr)] md:px-10 md:py-20">
        <div>
          <Logo light />
          <p className="mt-5 max-w-xs text-sm leading-relaxed text-ivory/60">
            {SALON.tagline} A calm Toronto studio for braids, installs, silk presses and healthy-hair care.
          </p>
          <address className="mt-5 text-sm not-italic leading-relaxed text-ivory/60">
            {SALON.address}
            <br />
            <a href={`tel:${SALON.phone}`} className="hover:text-gold">
              {SALON.phone}
            </a>
          </address>
        </div>
        {cols.map((c) => (
          <div key={c.title}>
            <h2 className="mb-4 font-sans text-xs font-semibold tracking-[0.25em] text-gold uppercase">{c.title}</h2>
            <ul className="space-y-3 text-sm">
              {c.links.map(([label, to]) => (
                <li key={label}>
                  <Link to={to} className="transition hover:text-ivory">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
        <div>
          <h2 className="mb-4 font-sans text-xs font-semibold tracking-[0.25em] text-gold uppercase">Follow</h2>
          <ul className="space-y-3 text-sm">
            {(["instagram", "tiktok", "facebook"] as const).map((n) => (
              <li key={n}>
                <a href={SALON[n]} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2.5 capitalize transition hover:text-ivory">
                  <SocialIcon name={n} className="size-4" /> {n === "tiktok" ? "TikTok" : n}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="border-t border-ivory/10">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-5 py-6 text-xs text-ivory/50 md:flex-row md:items-center md:justify-between md:px-10">
          <p>© {new Date().getFullYear()} Hair by Chi. All rights reserved.</p>
          <div className="flex gap-5">
            <Link to="/policies#privacy" className="hover:text-ivory">
              Privacy Policy
            </Link>
            <Link to="/policies#terms" className="hover:text-ivory">
              Terms
            </Link>
            <Link to="/studio/login" className="hover:text-ivory">
              Studio login
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default function SiteLayout() {
  return (
    <>
      <ScrollToTop />
      <Header />
      <main id="main">
        <Outlet />
      </main>
      <Footer />
      <MobileBar />
    </>
  );
}
