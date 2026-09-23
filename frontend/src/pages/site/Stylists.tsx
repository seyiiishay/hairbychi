import { useParams } from "react-router-dom";
import { addDays } from "date-fns";
import { Award, CalendarDays } from "lucide-react";
import { slotsOn } from "../../lib/availability";
import { clock, dateKey, parseDateKey } from "../../lib/format";
import { useStore } from "../../store/store";
import { ButtonLink } from "../../ui/Button";
import { Container, EmptyState, PageHeader, Reveal, SectionHeading, Stars } from "../../ui/bits";
import { ReviewCard, ServiceCard, StylistCard } from "../../ui/cards";
import Photo from "../../ui/Photo";
import { format } from "date-fns";

const DAY = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function Stylists() {
  const s = useStore();
  return (
    <>
      <PageHeader eyebrow="The team" title={<>Specialists for <em className="text-gold-deep">every texture</em></>} sub="Choose the stylist whose craft matches your look, or let us pair you with the first available." />
      <Container className="py-14 md:py-20">
        <div className="grid grid-cols-2 gap-x-4 gap-y-12 md:gap-x-6 lg:grid-cols-4">
          {s.stylists
            .filter((x) => x.active)
            .map((st, i) => (
              <Reveal key={st.id} delay={i * 70}>
                <StylistCard stylist={st} />
                <ButtonLink to={`/book?stylist=${st.id}`} variant="secondary" size="sm" className="mt-4 w-full">
                  Book with {st.name}
                </ButtonLink>
              </Reveal>
            ))}
        </div>
      </Container>
    </>
  );
}

export function StylistProfile() {
  const { id } = useParams();
  const s = useStore();
  const st = s.stylists.find((x) => x.id === id);
  if (!st) {
    return (
      <Container className="py-24">
        <EmptyState title="Stylist not found." body="They may have moved on. Meet the current team instead." action="Our stylists" to="/stylists" />
      </Container>
    );
  }
  const services = s.services.filter((x) => x.stylistIds.includes(st.id) && x.active);
  const reviews = s.reviews.filter((r) => r.stylistId === st.id && r.status === "published");
  const portfolio = s.gallery.filter((g) => services.some((x) => x.id === g.serviceId)).slice(0, 6);

  // Next few openings for their shortest service: a quick availability peek
  const probe = [...services].filter((x) => !x.consultation).sort((a, b) => a.minutes - b.minutes)[0];
  const openings: { date: string; time: string }[] = [];
  if (probe) {
    for (let i = 0; i < 21 && openings.length < 4; i++) {
      const key = dateKey(addDays(new Date(), i));
      const slot = slotsOn(s, probe, st.id, key, probe.minutes)[0];
      if (slot) openings.push({ date: key, time: slot.time });
    }
  }

  return (
    <>
      <Container className="grid gap-10 py-10 md:py-16 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
        <Photo path={`stylists/${st.id}`} src={st.image} art={st.art} tone={st.tone} alt={`Portrait of ${st.name}`} className="aspect-[4/5] rounded-t-[14rem] rounded-b-[var(--radius-card)]" />
        <div className="lg:py-8">
          <p className="eyebrow">{st.title}</p>
          <h1 className="mt-3 text-6xl md:text-8xl">
            Meet <em className="text-gold-deep">{st.name}</em>
          </h1>
          <p className="mt-4 inline-flex items-center gap-2 text-sm">
            <Stars rating={st.rating} size="md" /> <strong>{st.rating}</strong> <span className="text-muted">· {st.appointments}+ appointments</span>
          </p>
          <p className="mt-6 max-w-xl text-[1.05rem] leading-relaxed text-ink-soft">{st.bio}</p>
          <blockquote className="mt-6 border-l-2 border-gold pl-5 font-display text-2xl italic">“{st.quote}”</blockquote>

          <dl className="mt-8 grid max-w-xl grid-cols-2 gap-5 border-t border-line pt-6 text-sm">
            <div>
              <dt className="flex items-center gap-2 text-muted">
                <Award className="size-4" aria-hidden /> Experience
              </dt>
              <dd className="mt-1 font-semibold">{st.years} years</dd>
            </div>
            <div>
              <dt className="flex items-center gap-2 text-muted">
                <CalendarDays className="size-4" aria-hidden /> Works
              </dt>
              <dd className="mt-1 font-semibold">
                {st.workDays.filter((d) => s.hours[d]).map((d) => DAY[d]).join(", ")}
              </dd>
            </div>
            <div className="col-span-2">
              <dt className="text-muted">Specialties</dt>
              <dd className="mt-2 flex flex-wrap gap-2">
                {st.specialties.map((x) => (
                  <span key={x} className="rounded-full bg-sand px-3 py-1 text-xs">
                    {x}
                  </span>
                ))}
              </dd>
            </div>
          </dl>

          {openings.length ? (
            <div className="mt-8">
              <p className="text-sm font-semibold">Next openings</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {openings.map((o) => (
                  <ButtonLink key={o.date} to={`/book?stylist=${st.id}&date=${o.date}`} variant="secondary" size="sm">
                    {format(parseDateKey(o.date), "EEE MMM d")} · {clock(o.time)}
                  </ButtonLink>
                ))}
              </div>
            </div>
          ) : null}
          <ButtonLink to={`/book?stylist=${st.id}`} size="lg" arrow className="mt-8">
            Book with {st.name}
          </ButtonLink>
        </div>
      </Container>

      {portfolio.length ? (
        <section className="bg-cream py-16 md:py-20">
          <Container>
            <SectionHeading eyebrow="Portfolio" title={`${st.name}'s recent work`} />
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-5">
              {portfolio.map((g) => (
                <Photo key={g.id} path={`gallery/${g.id}`} src={g.image} art={g.art} tone={g.tone} alt={g.title} className="aspect-[4/5] rounded-[var(--radius-card)]" />
              ))}
            </div>
          </Container>
        </section>
      ) : null}

      <section className="py-16 md:py-20">
        <Container>
          <SectionHeading eyebrow="Services" title={`Book ${st.name} for`} />
          <div className="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
            {services.map((x) => (
              <ServiceCard key={x.id} service={x} />
            ))}
          </div>
        </Container>
      </section>

      {reviews.length ? (
        <section className="bg-rose-soft/50 py-16 md:py-20">
          <Container>
            <SectionHeading eyebrow="Reviews" title={`What clients say about ${st.name}`} />
            <div className="grid gap-5 md:grid-cols-3">
              {reviews.slice(0, 3).map((r) => (
                <ReviewCard key={r.id} review={r} service={s.services.find((x) => x.id === r.serviceId)} />
              ))}
            </div>
          </Container>
        </section>
      ) : null}
    </>
  );
}
