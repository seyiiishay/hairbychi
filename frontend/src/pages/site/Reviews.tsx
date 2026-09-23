import { useState } from "react";
import { SALON } from "../../data/catalog";
import { cn } from "../../lib/format";
import { useStore } from "../../store/store";
import { ButtonLink } from "../../ui/Button";
import { Container, PageHeader, Reveal, Stars } from "../../ui/bits";
import { ReviewCard } from "../../ui/cards";

export default function Reviews() {
  const s = useStore();
  const [stylist, setStylist] = useState("all");
  const [photos, setPhotos] = useState(false);
  const published = s.reviews.filter((r) => r.status === "published");
  const list = published.filter((r) => (stylist === "all" || r.stylistId === stylist) && (!photos || r.withPhoto));
  const dist = [5, 4, 3, 2, 1].map((n) => ({ n, count: published.filter((r) => r.rating === n).length }));
  const max = Math.max(1, ...dist.map((d) => d.count));

  return (
    <>
      <PageHeader eyebrow="Reviews" title={<>Loved, <em className="text-gold-deep">verified.</em></>} sub="Every review comes from a completed appointment booked through our site.">
        <div className="mt-10 flex flex-col gap-8 sm:flex-row sm:items-center">
          <div>
            <p className="font-display text-8xl leading-none">{SALON.stats.rating}</p>
            <Stars rating={5} size="md" />
            <p className="mt-1 text-sm text-muted">{SALON.stats.verifiedAppointments} verified appointments</p>
          </div>
          <div className="w-full max-w-xs space-y-1.5" aria-label="Rating distribution">
            {dist.map((d) => (
              <div key={d.n} className="flex items-center gap-3 text-xs">
                <span className="w-10">{d.n} star</span>
                <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-sand-deep/60">
                  <span className="block h-full rounded-full bg-gold" style={{ width: `${(d.count / max) * 100}%` }} />
                </span>
                <span className="w-4 text-right text-muted">{d.count}</span>
              </div>
            ))}
          </div>
        </div>
      </PageHeader>
      <Container className="py-12 md:py-16">
        <div className="mb-8 flex flex-wrap items-center gap-2">
          {[{ id: "all", name: "All stylists" }, ...s.stylists].map((st) => (
            <button
              key={st.id}
              onClick={() => setStylist(st.id)}
              aria-pressed={stylist === st.id}
              className={cn("min-h-10 rounded-full border px-4 text-sm", stylist === st.id ? "border-ink bg-ink text-ivory" : "border-line bg-white/60")}
            >
              {st.name}
            </button>
          ))}
          <label className="ml-auto inline-flex min-h-10 cursor-pointer items-center gap-2 text-sm">
            <input type="checkbox" checked={photos} onChange={(e) => setPhotos(e.target.checked)} className="size-4 accent-ink" /> With photos
          </label>
        </div>
        <div className="columns-1 gap-5 md:columns-2 lg:columns-3">
          {list.map((r, i) => (
            <Reveal key={r.id} delay={(i % 3) * 60} className="mb-5 break-inside-avoid">
              <ReviewCard review={r} service={s.services.find((x) => x.id === r.serviceId)} />
            </Reveal>
          ))}
        </div>
        {!list.length ? <p className="text-muted">No reviews match those filters yet.</p> : null}
        <div className="mt-12 rounded-[var(--radius-card)] bg-cream p-8 text-center ring-1 ring-line">
          <h2 className="text-3xl">Been in our chair recently?</h2>
          <p className="mt-2 text-sm text-muted">Sign in and open a completed appointment to share your experience (with a photo, if you like).</p>
          <ButtonLink to="/account/appointments" className="mt-5" arrow>
            Leave a review
          </ButtonLink>
        </div>
      </Container>
    </>
  );
}
