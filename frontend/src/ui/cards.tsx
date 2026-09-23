import { Link } from "react-router-dom";
import { ArrowUpRight, Heart, Quote, Sparkles } from "lucide-react";
import type { Review, Service, Stylist } from "../data/types";
import { cn, duration, money, shortDate } from "../lib/format";
import { favouritesOf, toggleFavourite, useStore } from "../store/store";
import Photo from "./Photo";
import { Stars } from "./bits";
import { useToast } from "./Toast";

export function HeartButton({ id, label, className }: { id: string; label: string; className?: string }) {
  const s = useStore();
  const toast = useToast();
  const on = favouritesOf(s).includes(id);
  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleFavourite(id);
        toast(on ? "Removed from Saved Looks" : "Saved to your looks");
      }}
      aria-pressed={on}
      aria-label={on ? `Remove ${label} from saved looks` : `Save ${label}`}
      className={cn(
        "grid size-10 place-items-center rounded-full bg-ivory/85 text-ink backdrop-blur transition hover:scale-110 hover:bg-ivory",
        className,
      )}
    >
      <Heart className={cn("size-[18px] transition", on && "fill-rose-deep text-rose-deep")} strokeWidth={1.6} />
    </button>
  );
}

export function priceLabel(svc: Pick<Service, "price" | "priceFrom" | "consultation">) {
  return `${svc.priceFrom || svc.consultation ? "From " : ""}${money(svc.price)}`;
}

export function ServiceCard({ service, className }: { service: Service; className?: string }) {
  return (
    <Link to={`/services/${service.id}`} className={cn("group block", className)}>
      <div className="relative">
        <Photo
          path={`services/${service.id}`}
          src={service.image}
          art={service.art}
          tone={service.tone}
          alt={`${service.name} hairstyle`}
          className="aspect-[4/5] rounded-[var(--radius-card)]"
          zoom
        />
        <HeartButton id={service.id} label={service.name} className="absolute top-3 right-3" />
        {service.consultation ? (
          <span className="absolute bottom-3 left-3 inline-flex items-center gap-1 rounded-full bg-ink/80 px-3 py-1 text-[0.7rem] font-semibold tracking-wide text-ivory backdrop-blur">
            <Sparkles className="size-3" aria-hidden /> Consultation first
          </span>
        ) : null}
      </div>
      <div className="mt-4 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-[1.6rem] leading-tight transition group-hover:text-gold-deep">{service.name}</h3>
          <p className="mt-1 text-sm text-muted">
            {service.consultation ? "Consultation" : duration(service.minutes)} · {priceLabel(service)}
          </p>
        </div>
        <span className="mt-1 grid size-9 shrink-0 place-items-center rounded-full border border-line transition group-hover:border-ink group-hover:bg-ink group-hover:text-ivory" aria-hidden>
          <ArrowUpRight className="size-4" />
        </span>
      </div>
    </Link>
  );
}

export function StylistCard({ stylist, onSelect, selected }: { stylist: Stylist; onSelect?: () => void; selected?: boolean }) {
  const body = (
    <>
      <Photo
        path={`stylists/${stylist.id}`}
        src={stylist.image}
        art={stylist.art}
        tone={stylist.tone}
        alt={`Portrait of ${stylist.name}`}
        className="aspect-[4/5] rounded-[var(--radius-card)]"
        zoom
      />
      <div className="mt-4">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-3xl">{stylist.name}</h3>
          <span className="inline-flex items-center gap-1.5 text-sm font-semibold">
            <Stars rating={stylist.rating} /> {stylist.rating.toFixed(1)}
          </span>
        </div>
        <p className="mt-1 text-sm text-muted">{stylist.title}</p>
        <p className="mt-3 text-xs tracking-wide text-muted">{stylist.appointments}+ appointments completed</p>
        <ul className="mt-3 flex flex-wrap gap-1.5" aria-label="Specialties">
          {stylist.specialties.slice(0, 3).map((sp) => (
            <li key={sp} className="rounded-full bg-sand px-3 py-1 text-xs text-ink-soft">
              {sp}
            </li>
          ))}
        </ul>
      </div>
    </>
  );
  if (onSelect) {
    return (
      <button
        type="button"
        onClick={onSelect}
        aria-pressed={selected}
        className={cn(
          "group rounded-[1.6rem] p-3 text-left transition",
          selected ? "bg-white ring-2 ring-ink" : "hover:bg-white/70",
        )}
      >
        {body}
        <span className={cn("mt-4 flex min-h-11 items-center justify-center rounded-full text-sm font-semibold transition", selected ? "bg-ink text-ivory" : "border border-ink/70")}>
          {selected ? "Selected" : `Select ${stylist.name}`}
        </span>
      </button>
    );
  }
  return (
    <Link to={`/stylists/${stylist.id}`} className="group block">
      {body}
    </Link>
  );
}

export function ReviewCard({ review, service, className }: { review: Review; service?: Service; className?: string }) {
  return (
    <figure className={cn("flex h-full flex-col rounded-[var(--radius-card)] bg-white/70 p-7 shadow-[0_1px_0_rgba(28,24,22,0.04)] ring-1 ring-line/60", className)}>
      <Quote className="size-7 text-gold/70" aria-hidden />
      <blockquote className="mt-4 flex-1 font-display text-[1.45rem] leading-snug text-ink">“{review.text}”</blockquote>
      <figcaption className="mt-6 flex items-center justify-between gap-3 border-t border-line pt-5">
        <div>
          <Stars rating={review.rating} />
          <p className="mt-1.5 text-sm font-semibold">{review.name}</p>
          <p className="text-xs text-muted">{service?.name ?? "Hair by Chi client"}</p>
        </div>
        {review.withPhoto && service ? (
          <Photo art={service.art} tone={service.tone} alt={`${review.name}'s ${service.name}`} className="size-14 rounded-xl" />
        ) : (
          <span className="text-xs text-muted">{shortDate(review.date)}</span>
        )}
      </figcaption>
    </figure>
  );
}
