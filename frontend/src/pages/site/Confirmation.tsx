import { Link, useParams } from "react-router-dom";
import { CalendarPlus, Check, Eye, Info, Mail, Navigation } from "lucide-react";
import { SALON } from "../../data/catalog";
import { downloadIcs, googleCalendarUrl } from "../../lib/calendarFile";
import { clock, duration, longDate, money } from "../../lib/format";
import { currentUser, useStore } from "../../store/store";
import { Button, ButtonLink } from "../../ui/Button";
import { Container, EmptyState } from "../../ui/bits";
import Photo from "../../ui/Photo";

export default function Confirmation() {
  const { ref } = useParams();
  const s = useStore();
  const appt = s.appointments.find((a) => a.ref === ref);
  if (!appt) {
    return (
      <Container className="py-24">
        <EmptyState title="We couldn't find that booking." body="Check the reference in your confirmation email, or sign in to see your appointments." action="Sign in" to="/signin" />
      </Container>
    );
  }
  const svc = s.services.find((x) => x.id === appt.serviceId)!;
  const stylist = s.stylists.find((x) => x.id === appt.stylistId);
  const user = currentUser(s);
  const mine = user && user.email.toLowerCase() === appt.customer.email.toLowerCase();
  const viewTo = mine ? `/account/appointments/${appt.ref}` : `/appointment/${appt.ref}?email=${encodeURIComponent(appt.customer.email)}`;
  const washed = appt.addOnIds.includes("wash");
  const pending = appt.status === "pending";

  return (
    <div className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[520px] bg-gradient-to-b from-gold-soft/60 to-transparent" aria-hidden />
      <Container className="relative max-w-3xl py-16 text-center md:py-24">
        <div className="mx-auto grid size-20 animate-fade-up place-items-center rounded-full bg-ink text-gold shadow-xl">
          <Check className="size-9" strokeWidth={2.2} aria-hidden />
        </div>
        <h1 className="mt-8 animate-fade-up text-6xl [animation-delay:100ms] md:text-7xl">{pending ? "Request received!" : "You're booked!"}</h1>
        <p className="mt-3 animate-fade-up text-lg text-muted [animation-delay:180ms]">
          {pending ? "Your stylist will review your consultation request and confirm within 24 hours." : "We can't wait to see you."}
        </p>
        <p className="mt-2 inline-flex items-center gap-2 text-sm text-muted">
          <Mail className="size-4" aria-hidden /> Confirmation sent to {appt.customer.email}
        </p>

        <div className="mt-10 animate-fade-up overflow-hidden rounded-[1.75rem] bg-white text-left shadow-[0_40px_80px_-40px_rgba(28,24,22,0.35)] ring-1 ring-line [animation-delay:260ms]">
          <div className="grid sm:grid-cols-[200px_1fr]">
            <Photo art={svc.art} tone={svc.tone} path={`services/${svc.id}`} src={svc.image} alt={svc.name} className="aspect-[16/9] sm:aspect-auto" />
            <div className="p-6 md:p-8">
              <p className="font-mono text-xs tracking-widest text-muted">{appt.ref}</p>
              <h2 className="mt-2 text-4xl leading-tight">{svc.name}</h2>
              <dl className="mt-5 grid grid-cols-2 gap-x-6 gap-y-4 text-sm">
                <div>
                  <dt className="text-muted">Date</dt>
                  <dd className="font-semibold">{longDate(appt.date)}</dd>
                </div>
                <div>
                  <dt className="text-muted">Time</dt>
                  <dd className="font-semibold">
                    {clock(appt.time)} · {duration(appt.minutes)}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted">Stylist</dt>
                  <dd className="font-semibold">{stylist?.name}</dd>
                </div>
                <div>
                  <dt className="text-muted">Paid today</dt>
                  <dd className="font-semibold">
                    {money(appt.paid)} <span className="font-normal text-muted">· {money(appt.total - appt.paid)} at salon</span>
                  </dd>
                </div>
                <div className="col-span-2">
                  <dt className="text-muted">Salon address</dt>
                  <dd className="font-semibold">{SALON.address}</dd>
                </div>
              </dl>
            </div>
          </div>
        </div>

        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Button onClick={() => downloadIcs(appt, svc.name)} size="lg">
            <CalendarPlus className="size-4" aria-hidden /> Add to Calendar
          </Button>
          <ButtonLink to={viewTo} variant="secondary" size="lg">
            <Eye className="size-4" aria-hidden /> View Appointment
          </ButtonLink>
          <a href={SALON.mapsUrl} target="_blank" rel="noreferrer" className="inline-flex min-h-13 items-center justify-center gap-2 rounded-full border border-ink/80 px-8 text-[0.95rem] font-semibold hover:bg-ink hover:text-ivory">
            <Navigation className="size-4" aria-hidden /> Get Directions
          </a>
        </div>
        <a href={googleCalendarUrl(appt, svc.name)} target="_blank" rel="noreferrer" className="mt-4 inline-block text-sm text-muted underline underline-offset-4">
          Or add to Google Calendar
        </a>

        <div className="mt-12 flex gap-3 rounded-2xl bg-cream p-5 text-left text-sm leading-relaxed ring-1 ring-line">
          <Info className="mt-0.5 size-5 shrink-0 text-gold-deep" aria-hidden />
          <div>
            <p className="font-semibold">Before you arrive</p>
            <p className="mt-1 text-ink-soft">
              {washed ? "You've added our wash & blow dry, so come as you are. We'll take care of the prep." : svc.prep} We'll send reminders 24 hours and 2 hours before.
            </p>
          </div>
        </div>
        {!user ? (
          <p className="mt-8 text-sm text-muted">
            <Link to={`/register?email=${encodeURIComponent(appt.customer.email)}`} className="font-semibold text-ink underline decoration-gold underline-offset-4">
              Create an account
            </Link>{" "}
            to manage bookings, save looks and earn Beauty Rewards.
          </p>
        ) : null}
      </Container>
    </div>
  );
}
