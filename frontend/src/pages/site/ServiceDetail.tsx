import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Check, ChevronRight, Clock, Info, Sparkles, ZoomIn } from "lucide-react";
import { CATEGORIES } from "../../data/catalog";
import type { ArtKey, Tone } from "../../data/types";
import { cn, duration, money } from "../../lib/format";
import { useStore } from "../../store/store";
import { ButtonLink } from "../../ui/Button";
import { Container, EmptyState, Reveal, SectionHeading, Stars } from "../../ui/bits";
import { HeartButton, ReviewCard, ServiceCard, priceLabel } from "../../ui/cards";
import Modal from "../../ui/Modal";
import Photo from "../../ui/Photo";

export default function ServiceDetail() {
  const { id } = useParams();
  const s = useStore();
  const svc = s.services.find((x) => x.id === id);
  const [lightbox, setLightbox] = useState<number | null>(null);

  if (!svc) {
    return (
      <Container className="py-24">
        <EmptyState title="We couldn't find that style." body="It may have been renamed or retired. Browse our current services instead." action="View services" to="/services" />
      </Container>
    );
  }

  const category = CATEGORIES.find((c) => c.id === svc.categoryId)!;
  const looks = s.gallery.filter((g) => g.serviceId === svc.id);
  const shots: { art: ArtKey; tone: Tone; path?: string; src?: string; alt: string }[] = [
    { art: svc.art, tone: svc.tone, path: `services/${svc.id}`, src: svc.image, alt: `${svc.name}, front view` },
    ...looks.map((g) => ({ art: g.art, tone: g.tone, path: `gallery/${g.id}`, src: g.image, alt: g.title })),
    { art: svc.art, tone: "sand" as Tone, path: `services/${svc.id}-2`, alt: `${svc.name}, side view` },
    { art: svc.art, tone: "rose" as Tone, path: `services/${svc.id}-3`, alt: `${svc.name}, detail` },
  ].slice(0, 4);
  const stylists = s.stylists.filter((st) => svc.stylistIds.includes(st.id) && st.active);
  const addOns = s.addOns.filter((a) => svc.addOnIds.includes(a.id));
  const reviews = s.reviews.filter((r) => r.serviceId === svc.id && r.status === "published");
  const related = s.services.filter((x) => x.categoryId === svc.categoryId && x.id !== svc.id && x.active).slice(0, 4);
  const avg = reviews.length ? reviews.reduce((a, r) => a + r.rating, 0) / reviews.length : null;
  const bookTo = `/book?service=${svc.id}`;
  const cta = svc.consultation ? "Book Consultation" : "Book This Style";

  const facts = [
    ["Starting price", priceLabel(svc)],
    ["Duration", svc.consultation ? `Consultation ${duration(svc.minutes)}` : `Approximately ${duration(svc.minutes, true)}`],
    ["Hair included", svc.hairIncluded ? "Yes" : "No, add at booking or bring your own"],
    ["Suitable for", svc.suitableFor],
    ["Deposit", `${money(svc.deposit)} to secure your time`],
  ];

  return (
    <>
      <Container className="pt-6 md:pt-10">
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-muted">
          <Link to="/services" className="hover:text-ink">
            Services
          </Link>
          <ChevronRight className="size-3" aria-hidden />
          <Link to={`/services?category=${category.id}`} className="hover:text-ink">
            {category.name}
          </Link>
          <ChevronRight className="size-3" aria-hidden />
          <span className="text-ink" aria-current="page">
            {svc.name}
          </span>
        </nav>
      </Container>

      <Container className="grid gap-10 py-8 lg:grid-cols-[1.15fr_0.85fr] lg:gap-16 lg:py-12">
        <div className="grid grid-cols-3 gap-3">
          {shots.map((sh, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setLightbox(i)}
              className={cn("group relative overflow-hidden rounded-[var(--radius-card)]", i === 0 && "col-span-3")}
              aria-label={`View larger: ${sh.alt}`}
            >
              <Photo {...sh} className={i === 0 ? "aspect-[4/5] sm:aspect-square" : "aspect-square"} zoom />
              <span className="absolute right-3 bottom-3 grid size-9 place-items-center rounded-full bg-ivory/85 opacity-0 transition group-hover:opacity-100" aria-hidden>
                <ZoomIn className="size-4" />
              </span>
            </button>
          ))}
        </div>

        <div className="lg:sticky lg:top-28 lg:self-start">
          <p className="eyebrow">{category.name}</p>
          <div className="mt-3 flex items-start justify-between gap-4">
            <h1 className="text-5xl leading-[1.02] md:text-6xl">{svc.name}</h1>
            <HeartButton id={svc.id} label={svc.name} className="mt-2 shrink-0 ring-1 ring-line" />
          </div>
          <p className="mt-3 text-lg text-muted">{svc.tagline}</p>
          {avg ? (
            <a href="#reviews" className="mt-4 inline-flex items-center gap-2 text-sm">
              <Stars rating={avg} /> <span className="font-semibold">{avg.toFixed(1)}</span>
              <span className="text-muted underline underline-offset-4">
                {reviews.length} review{reviews.length > 1 ? "s" : ""}
              </span>
            </a>
          ) : null}

          <dl className="mt-8 divide-y divide-line rounded-[var(--radius-card)] border border-line bg-white/60">
            {facts.map(([k, v]) => (
              <div key={k} className="flex items-baseline justify-between gap-6 px-5 py-4">
                <dt className="text-sm text-muted">{k}</dt>
                <dd className="text-right text-sm font-semibold">{v}</dd>
              </div>
            ))}
          </dl>

          {svc.consultation ? (
            <p className="mt-5 flex gap-3 rounded-2xl bg-gold-soft/60 p-4 text-sm leading-relaxed text-ink-soft">
              <Sparkles className="mt-0.5 size-4 shrink-0 text-gold-deep" aria-hidden />
              This service starts with a {duration(svc.minutes)} consultation so your stylist can review your hair and goals before quoting. Your deposit is credited to the
              final service.
            </p>
          ) : null}

          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <ButtonLink to={bookTo} size="lg" arrow className="flex-1">
              {cta}
            </ButtonLink>
            <ButtonLink to="/inspiration" size="lg" variant="secondary">
              Ask a question
            </ButtonLink>
          </div>

          <div className="mt-8">
            <p className="text-sm font-semibold">Offered by</p>
            <ul className="mt-3 flex flex-wrap gap-3">
              {stylists.map((st) => (
                <li key={st.id}>
                  <Link to={`/stylists/${st.id}`} className="flex items-center gap-2.5 rounded-full bg-white/70 py-1 pr-4 pl-1 ring-1 ring-line transition hover:ring-ink">
                    <Photo art={st.art} tone={st.tone} path={`stylists/${st.id}`} alt="" className="size-9 rounded-full" />
                    <span className="text-sm font-medium">{st.name}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Container>

      <section className="border-t border-line/70 bg-cream py-16 md:py-20">
        <Container className="grid gap-12 lg:grid-cols-3">
          <Reveal className="lg:col-span-2">
            <h2 className="text-4xl">About this service</h2>
            <p className="mt-4 max-w-2xl text-[1.05rem] leading-relaxed text-ink-soft">{svc.description}</p>

            <h3 className="mt-12 text-3xl">What's included</h3>
            <ul className="mt-5 grid gap-3 sm:grid-cols-2">
              {svc.includes.map((it) => (
                <li key={it} className="flex items-center gap-3 text-[0.95rem]">
                  <span className="grid size-6 place-items-center rounded-full bg-ink text-ivory" aria-hidden>
                    <Check className="size-3.5" strokeWidth={3} />
                  </span>
                  {it}
                </li>
              ))}
            </ul>

            <h3 className="mt-12 text-3xl">Before your appointment</h3>
            <p className="mt-4 flex max-w-2xl gap-3 rounded-2xl border border-line bg-ivory p-5 text-[0.95rem] leading-relaxed">
              <Info className="mt-0.5 size-5 shrink-0 text-gold-deep" aria-hidden />
              {svc.prep}
            </p>
          </Reveal>

          <Reveal delay={100}>
            {addOns.length ? (
              <div className="rounded-[var(--radius-card)] bg-ivory p-6 ring-1 ring-line">
                <h3 className="text-3xl">Optional add-ons</h3>
                <p className="mt-1 text-sm text-muted">Choose these while booking.</p>
                <ul className="mt-5 divide-y divide-line">
                  {addOns.map((a) => (
                    <li key={a.id} className="flex items-center justify-between gap-3 py-3 text-[0.95rem]">
                      <span>
                        {a.name}
                        {a.minutes ? (
                          <span className="ml-2 inline-flex items-center gap-1 text-xs text-muted">
                            <Clock className="size-3" aria-hidden />+{duration(a.minutes)}
                          </span>
                        ) : null}
                      </span>
                      <span className="font-semibold">+{money(a.price)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
            <div className="mt-6 rounded-[var(--radius-card)] p-6 ring-1 ring-line">
              <h3 className="text-2xl">Cancellation</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                Free to reschedule or cancel up to {s.settings.cancellationHours} hours before. Later changes may forfeit your {money(svc.deposit)} deposit.{" "}
                <Link to="/policies#cancellation" className="font-semibold text-ink underline decoration-gold underline-offset-4">
                  Full policy
                </Link>
              </p>
            </div>
          </Reveal>
        </Container>
      </section>

      <section id="reviews" className="py-16 md:py-20">
        <Container>
          <SectionHeading eyebrow="Reviews" title={`Clients on ${svc.name}`} />
          {reviews.length ? (
            <div className="grid gap-5 md:grid-cols-3">
              {reviews.slice(0, 3).map((r) => (
                <ReviewCard key={r.id} review={r} service={svc} />
              ))}
            </div>
          ) : (
            <p className="text-muted">No reviews for this style yet. Be the first after your appointment.</p>
          )}
        </Container>
      </section>

      {related.length ? (
        <section className="bg-cream py-16 md:py-20">
          <Container>
            <SectionHeading eyebrow="You may also love" title={`More ${category.name.toLowerCase()}`} />
            <div className="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
              {related.map((r) => (
                <ServiceCard key={r.id} service={r} />
              ))}
            </div>
          </Container>
        </section>
      ) : null}

      <div className="fixed inset-x-0 bottom-0 z-30 flex items-center gap-4 border-t border-line bg-ivory/95 px-5 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-md md:hidden">
        <div className="flex-1">
          <p className="text-xs text-muted">{svc.consultation ? "Consultation" : duration(svc.minutes)}</p>
          <p className="font-display text-2xl leading-none">{priceLabel(svc)}</p>
        </div>
        <ButtonLink to={bookTo} size="lg">
          {cta}
        </ButtonLink>
      </div>

      <Modal open={lightbox !== null} onClose={() => setLightbox(null)} title={svc.name} size="lg" dark>
        {lightbox !== null ? (
          <div>
            <Photo {...shots[lightbox]} className="mx-auto aspect-[4/5] max-h-[72vh] rounded-2xl" />
            <div className="mt-4 flex items-center justify-between gap-4">
              <p className="font-display text-2xl">{shots[lightbox].alt}</p>
              <div className="flex gap-2">
                {shots.map((_, i) => (
                  <button key={i} onClick={() => setLightbox(i)} className={`size-2.5 rounded-full ${i === lightbox ? "bg-gold" : "bg-ivory/30"}`} aria-label={`Image ${i + 1}`} />
                ))}
              </div>
            </div>
          </div>
        ) : null}
      </Modal>
    </>
  );
}
