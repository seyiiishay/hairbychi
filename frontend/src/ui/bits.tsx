import { useEffect, useRef, type ElementType, type ReactNode } from "react";
import { Star } from "lucide-react";
import type { AppointmentStatus } from "../data/types";
import { cn } from "../lib/format";
import { ButtonLink } from "./Button";

export function Stars({ rating, size = "sm", label = true }: { rating: number; size?: "sm" | "md"; label?: boolean }) {
  const px = size === "sm" ? "size-3.5" : "size-4.5";
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="inline-flex text-gold" aria-hidden>
        {[1, 2, 3, 4, 5].map((i) => (
          <Star key={i} className={cn(px, i <= Math.round(rating) ? "fill-current" : "opacity-30")} strokeWidth={1.5} />
        ))}
      </span>
      {label ? <span className="sr-only">{rating} out of 5 stars</span> : null}
    </span>
  );
}

/** Fades children up as they scroll into view. */
export function Reveal({
  children,
  className,
  delay = 0,
  as: Tag = "div",
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  as?: ElementType;
}) {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add("is-visible");
          io.disconnect();
        }
      },
      { rootMargin: "0px 0px -8% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <Tag ref={ref} className={cn("reveal", className)} style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </Tag>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  sub,
  align = "left",
  action,
  className,
}: {
  eyebrow?: string;
  title: ReactNode;
  sub?: ReactNode;
  align?: "left" | "center";
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "mb-10 flex flex-col gap-6 md:mb-14",
        align === "center" ? "items-center text-center" : "md:flex-row md:items-end md:justify-between",
        className,
      )}
    >
      <div className={cn("max-w-2xl", align === "center" && "mx-auto")}>
        {eyebrow ? <p className="eyebrow mb-4">{eyebrow}</p> : null}
        <h2 className="text-4xl leading-[1.05] text-ink md:text-[3.4rem]">{title}</h2>
        {sub ? <p className="mt-4 text-base leading-relaxed text-muted md:text-lg">{sub}</p> : null}
      </div>
      {action}
    </div>
  );
}

export function PageHeader({ eyebrow, title, sub, children }: { eyebrow?: string; title: ReactNode; sub?: ReactNode; children?: ReactNode }) {
  return (
    <header className="relative overflow-hidden border-b border-line/70 bg-cream">
      <div className="pointer-events-none absolute -right-10 -bottom-16 font-display text-[12rem] leading-none text-sand select-none md:text-[18rem]" aria-hidden>
        Chi
      </div>
      <div className="relative mx-auto max-w-7xl px-5 pt-14 pb-12 md:px-10 md:pt-24 md:pb-16">
        {eyebrow ? <p className="eyebrow mb-4 animate-fade-up">{eyebrow}</p> : null}
        <h1 className="max-w-3xl animate-fade-up text-5xl leading-[1.02] md:text-7xl">{title}</h1>
        {sub ? <p className="mt-5 max-w-xl animate-fade-up text-base leading-relaxed text-muted md:text-lg">{sub}</p> : null}
        {children}
      </div>
    </header>
  );
}

export function Container({ children, className }: { children: ReactNode; className?: string }) {
  // A caller-supplied max-w-* replaces the default width rather than fighting it in the cascade
  const width = className?.includes("max-w-") ? "" : "max-w-7xl";
  return <div className={cn("mx-auto px-5 md:px-10", width, className)}>{children}</div>;
}

export function EmptyState({
  title,
  body,
  action,
  to,
  icon,
}: {
  title: string;
  body: string;
  action?: string;
  to?: string;
  icon?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center rounded-[var(--radius-card)] border border-dashed border-sand-deep bg-cream/60 px-6 py-14 text-center">
      {icon ? <div className="mb-5 grid size-14 place-items-center rounded-full bg-sand text-gold-deep">{icon}</div> : null}
      <h3 className="text-3xl">{title}</h3>
      <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted">{body}</p>
      {action && to ? (
        <ButtonLink to={to} className="mt-6" arrow>
          {action}
        </ButtonLink>
      ) : null}
    </div>
  );
}

const STATUS_STYLE: Record<AppointmentStatus, string> = {
  pending: "bg-warning-soft text-warning",
  confirmed: "bg-success-soft text-success",
  "checked-in": "bg-gold-soft text-gold-deep",
  "in-progress": "bg-rose-soft text-rose-deep",
  completed: "bg-sand text-ink-soft",
  cancelled: "bg-error-soft text-error",
  "no-show": "bg-error-soft text-error",
};

export const STATUS_LABEL: Record<AppointmentStatus, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  "checked-in": "Checked in",
  "in-progress": "In progress",
  completed: "Completed",
  cancelled: "Cancelled",
  "no-show": "No-show",
};

export function StatusBadge({ status }: { status: AppointmentStatus }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold", STATUS_STYLE[status])}>
      <span className="size-1.5 rounded-full bg-current" aria-hidden />
      {STATUS_LABEL[status]}
    </span>
  );
}

export function Badge({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full bg-ivory/90 px-3 py-1 text-[0.7rem] font-semibold tracking-wide text-ink backdrop-blur", className)}>
      {children}
    </span>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("skeleton", className)} aria-hidden />;
}

export function Divider({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-4 text-gold", className)} aria-hidden>
      <span className="h-px flex-1 bg-line" />
      <span className="text-xs">◆</span>
      <span className="h-px flex-1 bg-line" />
    </div>
  );
}
