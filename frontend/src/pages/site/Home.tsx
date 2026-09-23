import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, CalendarCheck, Gem, Leaf, Search, Sparkles, Tag, Users } from "lucide-react";
import { CATEGORIES, FAQS, SALON } from "../../data/catalog";
import { cn, dateKey } from "../../lib/format";
import { useStore } from "../../store/store";
import BeforeAfter from "../../ui/BeforeAfter";
import { ButtonLink, Button } from "../../ui/Button";
import { Container, Reveal, SectionHeading, Stars } from "../../ui/bits";
import { ReviewCard, ServiceCard, StylistCard, priceLabel } from "../../ui/cards";
import FaqList from "../../ui/Faq";
import Photo from "../../ui/Photo";
import { SocialIcon } from "../../ui/Logo";

/** Slow, subtle parallax: returns a translateY in px for the current scroll. */
function useParallax(speed: number) {
  const [y, setY] = useState(0);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    const on = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => setY(window.scrollY * speed));
    };
    window.addEventListener("scroll", on, { passive: true });
    return () => {
      window.removeEventListener("scroll", on);
      cancelAnimationFrame(raf);
    };
  }, [speed]);
  return y;
}

function Hero() {
  const slow = useParallax(0.06);
  const fast = useParallax(-0.1);
  return (
    <section className="relative overflow-hidden">
      <div
        className="pointer-events-none absolute top-[8%] left-1/2 hidden md:block -translate-x-1/2 font-display text-[30vw] leading-none tracking-tight text-sand/60 select-none md:text-[17vw]"
        style={{ transform: `translate(-50%, ${slow}px)` }}
        aria-hidden
      >
        STYLE
      </div>
      <Container className="relative grid items-center gap-12 pt-8 pb-16 md:pt-14 lg:grid-cols-[1fr_1.1fr] lg:gap-8 lg:pb-24">
        <div className="max-w-xl">
          <p className="eyebrow mb-6 animate-fade-up">Toronto hair studio · Est. 2017</p>
          <h1 className="animate-fade-up text-[3.4rem] leading-[0.98] [animation-delay:80ms] sm:text-7xl lg:text-[4.7rem] xl:text-[5.2rem]">
            Made for your hair.
            <br />
            <em className="text-gold-deep">Designed</em> for your confidence.
          </h1>
          <p className="mt-7 max-w-md animate-fade-up text-lg leading-relaxed text-muted [animation-delay:160ms]">
            Professional braiding, protective styles and hair treatments created around your beauty, schedule and lifestyle.
          </p>
          <div className="mt-9 flex animate-fade-up flex-col gap-3 [animation-delay:240ms] sm:flex-row">
            <ButtonLink to="/book" size="lg" arrow>
              Book Your Appointment
            </ButtonLink>
            <ButtonLink to="/services" size="lg" variant="secondary">
              Explore Services
            </ButtonLink>
          </div>
          <div className="mt-9 flex animate-fade-up items-center gap-4 [animation-delay:320ms]">
            <div className="flex -space-x-3" aria-hidden>
              {(["braids", "curls", "wig"] as const).map((a, i) => (
                <Photo key={a} art={a} tone={(["gold", "rose", "sand"] as const)[i]} alt="" className="size-11 rounded-full ring-3 ring-ivory" />
              ))}
            </div>
            <div>
              <Stars rating={5} size="md" />
              <p className="text-sm text-muted">
                Loved by <strong className="font-semibold text-ink">{SALON.stats.clients}+ clients</strong>
              </p>
            </div>
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-[560px] lg:mr-0">
          <div style={{ transform: `translateY(${slow}px)` }}>
            <Photo
              path="hero/main"
              art="braids"
              tone="gold"
              alt="Client with long medium knotless braids, styled at Hair by Chi"
              className="ml-auto aspect-[4/5] w-[82%] animate-fade-up rounded-t-[12rem] rounded-b-[var(--radius-card)] [animation-delay:120ms]"
            />
          </div>
          <div className="absolute top-[14%] -left-2 w-[36%] animate-float sm:left-0" style={{ transform: `translateY(${fast}px)` }}>
            <Photo path="hero/detail-1" art="curls" tone="rose" alt="Defined natural curls" className="aspect-[4/5] rounded-[var(--radius-card)] shadow-2xl ring-6 ring-ivory" />
          </div>
          <div className="absolute -bottom-6 left-[12%] w-[34%] animate-float [animation-delay:-4s]">
            <Photo path="hero/detail-2" art="wig" tone="blush" alt="Glossy wavy wig install" className="aspect-square rounded-[var(--radius-card)] shadow-2xl ring-6 ring-ivory" />
          </div>
          <div className="absolute right-3 bottom-8 hidden rounded-2xl bg-ivory/95 px-5 py-4 shadow-xl backdrop-blur sm:block">
            <p className="font-display text-3xl leading-none">{SALON.stats.rating}</p>
            <p className="mt-1 text-xs text-muted">average from {SALON.stats.verifiedAppointments} verified appointments</p>
          </div>
        </div>
      </Container>
    </section>
  );
}

function QuickBook() {
  const s = useStore();
  const nav = useNavigate();
  const [service, setService] = useState("");
  const [stylist, setStylist] = useState("any");
  const [date, setDate] = useState("");
  const svc = s.services.find((x) => x.id === service);
  const stylists = svc ? s.stylists.filter((st) => svc.stylistIds.includes(st.id)) : s.stylists;
  const submit = (e: FormEvent) => {
    e.preventDefault();
    const q = new URLSearchParams();
    if (service) q.set("service", service);
    if (stylist !== "any") q.set("stylist", stylist);
    if (date) q.set("date", date);
    nav(`/book?${q}`);
  };
  const field = "w-full bg-transparent text-[0.95rem] font-medium text-ink focus:outline-none";
  return (
    <Container className="relative z-10 -mt-4 mb-4 md:-mt-8">
      <Reveal>
        <form onSubmit={submit} className="grid gap-1 rounded-[1.75rem] bg-white p-3 shadow-[0_30px_60px_-30px_rgba(28,24,22,0.35)] ring-1 ring-line/70 md:grid-cols-[1.3fr_1fr_1fr_auto] md:items-center md:rounded-full md:p-2 md:pl-8">
          <label className="flex flex-col gap-0.5 rounded-2xl px-4 py-3 md:border-r md:border-line md:py-1 md:pl-0">
            <span className="text-[0.68rem] font-semibold tracking-[0.2em] text-muted uppercase">Service</span>
            <select value={service} onChange={(e) => setService(e.target.value)} className={field}>
              <option value="">Select hairstyle</option>
              {CATEGORIES.map((c) => (
                <optgroup key={c.id} label={c.name}>
                  {s.services
                    .filter((x) => x.categoryId === c.id && x.active)
                    .map((x) => (
                      <option key={x.id} value={x.id}>
                        {x.name}, {priceLabel(x)}
                      </option>
                    ))}
                </optgroup>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-0.5 rounded-2xl px-4 py-3 md:border-r md:border-line md:py-1">
            <span className="text-[0.68rem] font-semibold tracking-[0.2em] text-muted uppercase">Stylist</span>
            <select value={stylist} onChange={(e) => setStylist(e.target.value)} className={field}>
              <option value="any">Any stylist</option>
              {stylists.map((st) => (
                <option key={st.id} value={st.id}>
                  {st.name}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-0.5 rounded-2xl px-4 py-3 md:py-1">
            <span className="text-[0.68rem] font-semibold tracking-[0.2em] text-muted uppercase">Date</span>
            <input type="date" value={date} min={dateKey(new Date())} onChange={(e) => setDate(e.target.value)} className={field} aria-label="Choose date" />
          </label>
          <Button type="submit" size="lg" className="mt-2 md:mt-0">
            <Search className="size-4" aria-hidden /> Search availability
          </Button>
        </form>
      </Reveal>
    </Container>
  );
}

function PopularServices() {
  const s = useStore();
  const ids = ["medium-knotless-braids", "silk-press", "wig-install", "cornrows", "boho-knotless-braids", "loc-retwist"];
  const list = ids.map((id) => s.services.find((x) => x.id === id)).filter((x) => x && x.active);
  return (
    <section className="py-20 md:py-28">
      <Container>
        <SectionHeading
          eyebrow="Popular services"
          title={
            <>
              Find your <em className="text-gold-deep">next look</em>
            </>
          }
          sub="From protective styles to elegant installs, choose the service that fits you."
          action={
            <ButtonLink to="/services" variant="text" arrow className="hidden md:inline-flex">
              View All Services
            </ButtonLink>
          }
        />
      </Container>
      <div className="no-scrollbar flex snap-x snap-mandatory scroll-px-5 gap-5 overflow-x-auto px-5 pb-2 md:mx-auto md:grid md:max-w-7xl md:grid-cols-2 md:gap-x-6 md:gap-y-14 md:overflow-visible md:px-10 lg:grid-cols-3">
        {list.map((svc, i) => (
          <Reveal key={svc!.id} delay={(i % 3) * 90} className="w-[74%] shrink-0 snap-start sm:w-[45%] md:w-auto">
            <ServiceCard service={svc!} />
          </Reveal>
        ))}
      </div>
      <Container className="mt-10 md:hidden">
        <ButtonLink to="/services" variant="secondary" className="w-full" arrow>
          View All Services
        </ButtonLink>
      </Container>
    </section>
  );
}

function Categories() {
  return (
    <section className="bg-cream py-20 md:py-28">
      <Container>
        <SectionHeading eyebrow="Browse by category" title="Every texture, every occasion" sub="Hair styling is personal. Start with what you love and we'll take it from there." />
      </Container>
      <div className="no-scrollbar flex snap-x scroll-px-5 gap-4 overflow-x-auto px-5 md:mx-auto md:grid md:max-w-7xl md:grid-cols-5 md:gap-5 md:overflow-visible md:px-10">
        {CATEGORIES.map((c, i) => (
          <Reveal key={c.id} delay={(i % 5) * 60} className="w-[42%] shrink-0 snap-start sm:w-[30%] md:w-auto">
            <Link to={`/services?category=${c.id}`} className="group block">
              <div className="relative overflow-hidden rounded-[var(--radius-card)]">
                <Photo path={`categories/${c.id}`} art={c.art} tone={c.tone} alt={`${c.name} hairstyles`} className="aspect-[3/4]" zoom />
                <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-ink/0 to-transparent" aria-hidden />
                <div className="absolute inset-x-0 bottom-0 p-4 text-ivory">
                  <h3 className="text-2xl leading-none">{c.name}</h3>
                  <p className="mt-1 text-[0.72rem] leading-snug text-ivory/80">{c.blurb}</p>
                </div>
              </div>
            </Link>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

function WhyUs() {
  const items = [
    { icon: Leaf, title: "Healthy Hair First", body: "We create beautiful styles without compromising the health of your hair." },
    { icon: CalendarCheck, title: "Easy Online Booking", body: "Choose your style, stylist and appointment time in minutes." },
    { icon: Users, title: "Experienced Stylists", body: "Receive personalised care from professionals who specialise in your hair needs." },
    { icon: Tag, title: "Transparent Pricing", body: "See prices, add-ons and deposits before confirming your appointment." },
  ];
  return (
    <section className="py-20 md:py-28">
      <Container className="grid gap-14 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
        <Reveal>
          <Photo path="studio/interior" art="bun" tone="ivory" alt="Inside the Hair by Chi studio" className="aspect-[4/5] rounded-t-[14rem] rounded-b-[var(--radius-card)] lg:max-w-md" />
        </Reveal>
        <div>
          <SectionHeading eyebrow="Why Hair by Chi" title="Calm hands. Clear prices. Beautiful hair." />
          <div className="grid gap-x-10 gap-y-10 sm:grid-cols-2">
            {items.map((it, i) => (
              <Reveal key={it.title} delay={i * 80}>
                <it.icon className="size-7 text-gold-deep" strokeWidth={1.3} aria-hidden />
                <h3 className="mt-4 text-[1.7rem]">{it.title}</h3>
                <p className="mt-2 text-[0.95rem] leading-relaxed text-muted">{it.body}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}

function Transformations() {
  return (
    <section className="bg-ink py-20 text-ivory md:py-28">
      <Container className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
        <div>
          <p className="eyebrow mb-4 !text-gold">Real transformations</p>
          <h2 className="text-5xl leading-[1.02] md:text-6xl">
            Drag to see the <em className="text-gold">difference.</em>
          </h2>
          <p className="mt-5 max-w-md leading-relaxed text-ivory/70">
            Every look starts with your hair, not a template. Slide between before and after to see real client results.
          </p>
          <ButtonLink to="/gallery" variant="light" className="mt-8" arrow>
            See the full gallery
          </ButtonLink>
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <Reveal>
            <BeforeAfter label="Medium knotless braids" before={{ art: "curls", tone: "sand", path: "transformations/1-before" }} after={{ art: "braids", tone: "gold", path: "transformations/1-after" }} />
            <p className="mt-3 text-sm text-ivory/70">Medium Knotless Braids · 5 hrs</p>
          </Reveal>
          <Reveal delay={120}>
            <BeforeAfter label="Silk press" before={{ art: "curls", tone: "rose", path: "transformations/2-before" }} after={{ art: "straight", tone: "rose", path: "transformations/2-after" }} />
            <p className="mt-3 text-sm text-ivory/70">Silk Press · 2 hrs</p>
          </Reveal>
        </div>
      </Container>
    </section>
  );
}

function MeetStylists() {
  const s = useStore();
  return (
    <section className="py-20 md:py-28">
      <Container>
        <SectionHeading
          eyebrow="The team"
          title="Meet your stylists"
          sub="Specialists, not generalists. Book the hands that know your hair."
          action={
            <ButtonLink to="/stylists" variant="text" arrow>
              All stylists
            </ButtonLink>
          }
        />
        <div className="grid grid-cols-2 gap-x-4 gap-y-10 md:gap-x-6 lg:grid-cols-4">
          {s.stylists
            .filter((x) => x.active)
            .map((st, i) => (
              <Reveal key={st.id} delay={i * 80}>
                <StylistCard stylist={st} />
              </Reveal>
            ))}
        </div>
      </Container>
    </section>
  );
}

function GalleryPreview() {
  const s = useStore();
  const items = s.gallery.slice(0, 5);
  return (
    <section className="bg-cream py-20 md:py-28">
      <Container>
        <SectionHeading
          eyebrow="Portfolio"
          title="Recent work"
          action={
            <ButtonLink to="/gallery" variant="text" arrow>
              Explore the gallery
            </ButtonLink>
          }
        />
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:grid-rows-2 md:gap-5">
          {items.map((g, i) => {
            const svc = s.services.find((x) => x.id === g.serviceId);
            return (
              <Reveal key={g.id} delay={i * 60} className={cn(i === 0 && "col-span-2 row-span-2")}>
                <Link to={`/gallery?look=${g.id}`} className="group relative block h-full overflow-hidden rounded-[var(--radius-card)]">
                  <Photo path={`gallery/${g.id}`} src={g.image} art={g.art} tone={g.tone} alt={g.title} className={cn("h-full", i === 0 ? "aspect-square" : "aspect-[4/5]")} zoom />
                  <div className="absolute inset-x-0 bottom-0 translate-y-2 bg-gradient-to-t from-ink/75 to-transparent p-4 text-ivory opacity-0 transition group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:opacity-100">
                    <p className="font-display text-xl">{g.title}</p>
                    {svc ? <p className="text-xs">{priceLabel(svc)}</p> : null}
                  </div>
                </Link>
              </Reveal>
            );
          })}
        </div>
      </Container>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    ["Choose your style", "Explore our services and find the perfect look."],
    ["Pick your appointment", "Select your stylist, date and preferred time."],
    ["Secure your booking", "Pay your deposit and receive instant confirmation."],
    ["Come get styled", "Arrive, relax and leave looking amazing."],
  ];
  return (
    <section className="py-20 md:py-28">
      <Container>
        <SectionHeading eyebrow="How booking works" title="Four steps to your next look" align="center" />
        <ol className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map(([t, b], i) => (
            <Reveal as="li" key={t} delay={i * 90} className="relative border-t border-ink/80 pt-6">
              <span className="font-display text-6xl text-gold/80 italic">0{i + 1}</span>
              <h3 className="mt-3 text-[1.7rem]">{t}</h3>
              <p className="mt-2 text-[0.95rem] leading-relaxed text-muted">{b}</p>
            </Reveal>
          ))}
        </ol>
        <div className="mt-14 text-center">
          <ButtonLink to="/book" size="lg" arrow>
            Start booking
          </ButtonLink>
        </div>
      </Container>
    </section>
  );
}

function Reviews() {
  const s = useStore();
  const published = s.reviews.filter((r) => r.status === "published").slice(0, 3);
  return (
    <section className="bg-rose-soft/60 py-20 md:py-28">
      <Container>
        <div className="mb-12 flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="eyebrow mb-4">Client love</p>
            <h2 className="text-5xl leading-[1.02] md:text-6xl">Words from the chair</h2>
          </div>
          <div className="flex items-center gap-8">
            <div>
              <p className="font-display text-6xl leading-none">{SALON.stats.rating}</p>
              <Stars rating={5} size="md" />
              <p className="mt-1 text-xs text-muted">average rating</p>
            </div>
            <div className="h-16 w-px bg-sand-deep" aria-hidden />
            <div>
              <p className="font-display text-6xl leading-none">{SALON.stats.verifiedAppointments}</p>
              <p className="mt-2 text-xs text-muted">verified appointments</p>
            </div>
          </div>
        </div>
        <div className="grid gap-5 md:grid-cols-3">
          {published.map((r, i) => (
            <Reveal key={r.id} delay={i * 90}>
              <ReviewCard review={r} service={s.services.find((x) => x.id === r.serviceId)} />
            </Reveal>
          ))}
        </div>
        <div className="mt-10 text-center">
          <ButtonLink to="/reviews" variant="secondary" arrow>
            Read all reviews
          </ButtonLink>
        </div>
      </Container>
    </section>
  );
}

function FirstTime() {
  return (
    <section className="py-20 md:py-28">
      <Container>
        <Reveal className="relative grid overflow-hidden rounded-[2rem] bg-sand md:grid-cols-2">
          <div className="relative z-10 p-8 md:p-14">
            <p className="eyebrow mb-4">First visit?</p>
            <h2 className="text-5xl leading-[1.02]">
              Enjoy <em className="text-gold-deep">10% off</em> your first appointment.
            </h2>
            <p className="mt-4 max-w-sm leading-relaxed text-muted">
              Use code <strong className="rounded-md bg-ivory px-2 py-0.5 font-semibold tracking-widest text-ink">WELCOME10</strong> at checkout. Not sure what to book? Our style finder
              will point you in the right direction.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <ButtonLink to="/book" arrow>
                Book your first visit
              </ButtonLink>
              <ButtonLink to="/find-my-style" variant="secondary">
                <Sparkles className="size-4" aria-hidden /> Find My Style
              </ButtonLink>
            </div>
          </div>
          <Photo path="first-visit" art="twists" tone="blush" alt="Relaxed client with two-strand twists" className="min-h-72 md:min-h-full" />
        </Reveal>
      </Container>
    </section>
  );
}

function HomeFaq() {
  return (
    <section className="pb-20 md:pb-28">
      <Container className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr]">
        <div>
          <p className="eyebrow mb-4">Good to know</p>
          <h2 className="text-5xl leading-[1.02]">Questions, answered</h2>
          <p className="mt-4 text-muted">Everything else lives on our FAQ page.</p>
          <ButtonLink to="/faq" variant="text" arrow className="mt-4">
            All FAQs
          </ButtonLink>
        </div>
        <FaqList items={FAQS.filter((_, i) => [0, 3, 6, 8].includes(i))} />
      </Container>
    </section>
  );
}

function Instagram() {
  const s = useStore();
  const looks = useMemo(() => s.gallery.slice(5, 11), [s.gallery]);
  return (
    <section className="pb-20 md:pb-28">
      <Container className="mb-8 flex flex-col items-center text-center">
        <p className="eyebrow mb-4">{SALON.handle}</p>
        <h2 className="text-5xl">Follow the looks</h2>
      </Container>
      <div className="grid grid-cols-3 gap-1 md:grid-cols-6">
        {looks.map((g) => (
          <a key={g.id} href={SALON.instagram} target="_blank" rel="noreferrer" className="group relative block overflow-hidden" aria-label={`${g.title} on Instagram`}>
            <Photo path={`gallery/${g.id}`} src={g.image} art={g.art} tone={g.tone} alt={g.title} className="aspect-square" zoom />
            <span className="absolute inset-0 grid place-items-center bg-ink/0 text-ivory opacity-0 transition group-hover:bg-ink/35 group-hover:opacity-100" aria-hidden>
              <SocialIcon name="instagram" className="size-7" />
            </span>
          </a>
        ))}
      </div>
      <div className="mt-8 text-center">
        <a href={SALON.instagram} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold underline decoration-gold underline-offset-[6px]">
          <SocialIcon name="instagram" className="size-4" /> Follow us on Instagram
        </a>
      </div>
    </section>
  );
}

export function FinalCta() {
  return (
    <section className="relative overflow-hidden bg-ink py-24 text-center text-ivory md:py-32">
      <Gem className="mx-auto size-7 text-gold" strokeWidth={1.2} aria-hidden />
      <h2 className="mx-auto mt-6 max-w-3xl px-5 text-5xl leading-[1.02] md:text-7xl">
        Your next favourite hairstyle <em className="text-gold">starts here.</em>
      </h2>
      <p className="mx-auto mt-5 max-w-md px-5 text-ivory/70">Choose your style, pick a time, and we'll take care of the rest.</p>
      <div className="mt-10 flex justify-center gap-3 px-5">
        <ButtonLink to="/book" variant="light" size="lg">
          Book Appointment <ArrowRight className="size-4" aria-hidden />
        </ButtonLink>
      </div>
    </section>
  );
}

export default function Home() {
  return (
    <>
      <Hero />
      <QuickBook />
      <PopularServices />
      <Categories />
      <WhyUs />
      <Transformations />
      <MeetStylists />
      <GalleryPreview />
      <HowItWorks />
      <Reviews />
      <FirstTime />
      <HomeFaq />
      <Instagram />
      <FinalCta />
    </>
  );
}
