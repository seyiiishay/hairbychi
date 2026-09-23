import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowLeft, ArrowRight } from "lucide-react";
import type { GalleryLabel } from "../../data/types";
import { cn, money } from "../../lib/format";
import { useStore } from "../../store/store";
import { ButtonLink } from "../../ui/Button";
import { Container, PageHeader, Reveal } from "../../ui/bits";
import { HeartButton } from "../../ui/cards";
import Modal from "../../ui/Modal";
import Photo from "../../ui/Photo";

const FILTERS: ("All" | GalleryLabel)[] = ["All", "Braids", "Wigs", "Natural Hair", "Locs", "Silk Press", "Colour", "Bridal"];

export default function Gallery() {
  const s = useStore();
  const [params, setParams] = useSearchParams();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("All");
  const items = s.gallery.filter((g) => filter === "All" || g.label === filter);
  const openId = params.get("look");
  const openIndex = items.findIndex((g) => g.id === openId);
  const open = openIndex >= 0 ? items[openIndex] : null;
  const svc = open ? s.services.find((x) => x.id === open.serviceId) : null;

  const show = (id: string | null) => {
    const next = new URLSearchParams(params);
    if (id) next.set("look", id);
    else next.delete("look");
    setParams(next, { replace: true });
  };

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") show(items[(openIndex + 1) % items.length].id);
      if (e.key === "ArrowLeft") show(items[(openIndex - 1 + items.length) % items.length].id);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  return (
    <>
      <PageHeader eyebrow="Portfolio" title={<>The <em className="text-gold-deep">lookbook</em></>} sub="Real work from our chairs. See something you love? Every look can be booked in one tap." />
      <div className="sticky top-18 z-20 border-b border-line/70 bg-ivory/92 backdrop-blur-md md:top-20">
        <Container className="no-scrollbar flex gap-2 overflow-x-auto py-3">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              aria-pressed={filter === f}
              className={cn(
                "min-h-10 shrink-0 rounded-full border px-4 text-sm font-medium transition",
                filter === f ? "border-ink bg-ink text-ivory" : "border-line bg-white/60 hover:border-ink/50",
              )}
            >
              {f}
            </button>
          ))}
        </Container>
      </div>
      <Container className="py-12 md:py-16">
        <div className="columns-2 gap-3 md:columns-3 md:gap-5 xl:columns-4">
          {items.map((g, i) => {
            const service = s.services.find((x) => x.id === g.serviceId);
            return (
              <Reveal key={g.id} delay={(i % 4) * 60} className="mb-3 break-inside-avoid md:mb-5">
                <div className="group relative overflow-hidden rounded-[var(--radius-card)]">
                  <button type="button" onClick={() => show(g.id)} className="block w-full text-left" aria-label={`Open ${g.title}`}>
                    <Photo
                      path={`gallery/${g.id}`}
                      src={g.image}
                      art={g.art}
                      tone={g.tone}
                      alt={g.title}
                      className={g.shape === "tall" ? "aspect-[3/4]" : g.shape === "wide" ? "aspect-[4/3]" : "aspect-square"}
                      zoom
                    />
                    <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/80 via-ink/30 to-transparent p-4 pt-10 text-ivory">
                      <span className="block font-display text-xl leading-tight">{g.title}</span>
                      {service ? <span className="text-xs text-ivory/80">{money(service.price)}+</span> : null}
                    </span>
                  </button>
                  <HeartButton id={g.id} label={g.title} className="absolute top-3 right-3" />
                </div>
              </Reveal>
            );
          })}
        </div>
      </Container>

      <Modal open={!!open} onClose={() => show(null)} title={open?.title ?? ""} size="full" dark>
        {open ? (
          <div className="grid items-center gap-6 md:grid-cols-[1.4fr_1fr] md:gap-10">
            <div className="relative">
              <Photo path={`gallery/${open.id}`} src={open.image} art={open.art} tone={open.tone} alt={open.title} className="mx-auto aspect-[4/5] max-h-[75vh] rounded-2xl" />
              <button
                onClick={() => show(items[(openIndex - 1 + items.length) % items.length].id)}
                className="absolute top-1/2 left-3 grid size-11 -translate-y-1/2 place-items-center rounded-full bg-ivory/90 text-ink"
                aria-label="Previous look"
              >
                <ArrowLeft className="size-5" />
              </button>
              <button
                onClick={() => show(items[(openIndex + 1) % items.length].id)}
                className="absolute top-1/2 right-3 grid size-11 -translate-y-1/2 place-items-center rounded-full bg-ivory/90 text-ink"
                aria-label="Next look"
              >
                <ArrowRight className="size-5" />
              </button>
            </div>
            <div>
              <p className="eyebrow !text-gold">{open.label}</p>
              <h2 className="mt-3 text-5xl leading-tight">{open.title}</h2>
              {svc ? (
                <>
                  <p className="mt-3 font-display text-3xl text-gold">{money(svc.price)}+</p>
                  <p className="mt-4 leading-relaxed text-ivory/70">{svc.tagline}</p>
                  <div className="mt-8 flex flex-col gap-3 sm:flex-row md:flex-col lg:flex-row">
                    <ButtonLink to={`/book?service=${svc.id}`} variant="light" size="lg" arrow>
                      Book this look
                    </ButtonLink>
                    <Link to={`/services/${svc.id}`} className="inline-flex min-h-13 items-center justify-center rounded-full border border-ivory/40 px-8 text-sm font-semibold hover:bg-ivory/10">
                      Service details
                    </Link>
                  </div>
                </>
              ) : null}
              <p className="mt-8 text-xs text-ivory/50">
                {openIndex + 1} / {items.length} · Use arrow keys to browse
              </p>
            </div>
          </div>
        ) : null}
      </Modal>
    </>
  );
}
