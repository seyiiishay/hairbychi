import { SALON } from "../../data/catalog";
import { useStore } from "../../store/store";
import { ButtonLink } from "../../ui/Button";
import { Container, Divider, Reveal, SectionHeading } from "../../ui/bits";
import { StylistCard } from "../../ui/cards";
import Photo from "../../ui/Photo";
import { FinalCta } from "./Home";

const CHAPTERS = [
  {
    eyebrow: "Why we started",
    title: "A studio we wished we could book.",
    body: "Hair by Chi began in a one-chair room in 2017 with a simple frustration: too many beautiful styles came with sore scalps, surprise prices and rushed appointments. Chioma set out to build the opposite: an unhurried space where your hair's health matters as much as the finish.",
  },
  {
    eyebrow: "What makes us different",
    title: "Tension-free technique, transparent everything.",
    body: "Every stylist on our team is trained in low-tension methods and scalp care. Prices, timings and deposits are published before you book, and your stylist checks in on comfort throughout. No guesswork, no pressure, no surprises.",
  },
  {
    eyebrow: "What to expect",
    title: "Calm, considered, and all about you.",
    body: "A warm welcome, a quick consultation to confirm your look, a comfortable chair and time to unwind. Tea, Wi-Fi and a charging point are always on hand. You'll leave with aftercare advice tailored to your style.",
  },
  {
    eyebrow: "Our approach to healthy hair",
    title: "Beautiful styles that protect what grows.",
    body: "We assess your hair and scalp before every service, recommend install lengths that suit your density, and never braid over breakage. Protective styling should protect.",
  },
];

export default function About() {
  const s = useStore();
  return (
    <>
      <section className="relative overflow-hidden">
        <Container className="grid gap-10 py-12 md:py-20 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="eyebrow mb-5 animate-fade-up">Our story</p>
            <h1 className="animate-fade-up text-6xl leading-[0.98] md:text-8xl">
              Hair care made <em className="text-gold-deep">personal.</em>
            </h1>
            <p className="mt-6 max-w-md animate-fade-up text-lg leading-relaxed text-muted">
              {SALON.stats.years} years, {SALON.stats.verifiedAppointments}+ verified appointments and one belief: you should love your hair and how you were treated while we did it.
            </p>
            <div className="mt-10 grid max-w-md grid-cols-3 gap-6 border-t border-line pt-6">
              {[
                [`${SALON.stats.years}`, "years styling"],
                [`${SALON.stats.clients}+`, "happy clients"],
                [`${SALON.stats.rating}`, "average rating"],
              ].map(([n, l]) => (
                <div key={l}>
                  <p className="font-display text-5xl leading-none">{n}</p>
                  <p className="mt-2 text-xs text-muted">{l}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="relative">
            <Photo path="about/studio" art="bun" tone="gold" alt="Chioma styling a client in the Hair by Chi studio" className="aspect-[4/5] rounded-t-[16rem] rounded-b-[var(--radius-card)]" />
            <div className="absolute -bottom-6 -left-4 max-w-[240px] rounded-2xl bg-ink p-5 text-ivory shadow-2xl md:-left-10">
              <p className="font-display text-xl leading-snug italic">“Tension-free is non-negotiable. Beautiful hair should never hurt.”</p>
              <p className="mt-2 text-xs text-gold">Chioma, founder</p>
            </div>
          </div>
        </Container>
      </section>

      <section className="py-16 md:py-24">
        <Container className="max-w-5xl">
          {CHAPTERS.map((c, i) => (
            <Reveal key={c.title} className="grid gap-4 border-t border-line py-12 md:grid-cols-[0.8fr_1.2fr] md:gap-12">
              <div>
                <p className="font-display text-6xl text-gold/70 italic">0{i + 1}</p>
                <p className="eyebrow mt-2">{c.eyebrow}</p>
              </div>
              <div>
                <h2 className="text-4xl leading-tight md:text-5xl">{c.title}</h2>
                <p className="mt-4 text-[1.05rem] leading-relaxed text-ink-soft">{c.body}</p>
              </div>
            </Reveal>
          ))}
          <Divider />
        </Container>
      </section>

      <section className="bg-cream py-20 md:py-28">
        <Container>
          <SectionHeading
            eyebrow="The team"
            title="Meet the stylists"
            sub="Each specialist brings years of focused experience."
            action={
              <ButtonLink to="/book" arrow>
                Book with the team
              </ButtonLink>
            }
          />
          <div className="grid grid-cols-2 gap-x-4 gap-y-10 md:gap-x-6 lg:grid-cols-4">
            {s.stylists
              .filter((x) => x.active)
              .map((st) => (
                <StylistCard key={st.id} stylist={st} />
              ))}
          </div>
        </Container>
      </section>
      <FinalCta />
    </>
  );
}
