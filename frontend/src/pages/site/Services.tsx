import { useMemo, useState, type ReactNode } from "react";
import { useSearchParams } from "react-router-dom";
import { addDays } from "date-fns";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { CATEGORIES } from "../../data/catalog";
import type { CategoryId } from "../../data/types";
import { slotsOn } from "../../lib/availability";
import { cn, dateKey } from "../../lib/format";
import { useStore } from "../../store/store";
import { Container, EmptyState, PageHeader, Reveal } from "../../ui/bits";
import { ServiceCard } from "../../ui/cards";
import { FinalCta } from "./Home";

const PRICE = [
  { id: "any", label: "Any price", test: () => true },
  { id: "u100", label: "Under $100", test: (p: number) => p < 100 },
  { id: "100-200", label: "$100 to $200", test: (p: number) => p >= 100 && p <= 200 },
  { id: "200", label: "$200+", test: (p: number) => p > 200 },
];
const TIME = [
  { id: "any", label: "Any length", test: () => true },
  { id: "u2", label: "Under 2 hours", test: (m: number) => m < 120 },
  { id: "2-4", label: "2 to 4 hours", test: (m: number) => m >= 120 && m <= 240 },
  { id: "4", label: "4+ hours", test: (m: number) => m > 240 },
];

function Chip({ on, onClick, children }: { on: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={on}
      className={cn(
        "min-h-10 shrink-0 rounded-full border px-4 text-sm font-medium whitespace-nowrap transition",
        on ? "border-ink bg-ink text-ivory" : "border-line bg-white/60 text-ink-soft hover:border-ink/50",
      )}
    >
      {children}
    </button>
  );
}

export default function Services() {
  const s = useStore();
  const [params, setParams] = useSearchParams();
  const category = (params.get("category") ?? "all") as CategoryId | "all";
  const [q, setQ] = useState("");
  const [price, setPrice] = useState("any");
  const [time, setTime] = useState("any");
  const [stylist, setStylist] = useState("any");
  const [thisWeek, setThisWeek] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const setCategory = (c: string) => {
    const next = new URLSearchParams(params);
    if (c === "all") next.delete("category");
    else next.set("category", c);
    setParams(next, { replace: true });
  };

  const availableThisWeek = useMemo(() => {
    if (!thisWeek) return null;
    const ok = new Set<string>();
    for (const svc of s.services) {
      for (let i = 0; i < 7 && !ok.has(svc.id); i++) {
        if (slotsOn(s, svc, stylist === "any" ? "any" : stylist, dateKey(addDays(new Date(), i)), svc.minutes).length) ok.add(svc.id);
      }
    }
    return ok;
  }, [thisWeek, s, stylist]);

  const list = s.services.filter((svc) => {
    if (!svc.active) return false;
    if (category !== "all" && svc.categoryId !== category) return false;
    if (q && !`${svc.name} ${svc.tagline}`.toLowerCase().includes(q.toLowerCase())) return false;
    if (!PRICE.find((p) => p.id === price)!.test(svc.price)) return false;
    if (!TIME.find((t) => t.id === time)!.test(svc.minutes)) return false;
    if (stylist !== "any" && !svc.stylistIds.includes(stylist)) return false;
    if (availableThisWeek && !availableThisWeek.has(svc.id)) return false;
    return true;
  });

  const activeCount = [price !== "any", time !== "any", stylist !== "any", thisWeek].filter(Boolean).length;
  const clear = () => {
    setPrice("any");
    setTime("any");
    setStylist("any");
    setThisWeek(false);
    setQ("");
    setCategory("all");
  };
  const catName = CATEGORIES.find((c) => c.id === category)?.name;

  return (
    <>
      <PageHeader
        eyebrow="Services & pricing"
        title={
          <>
            {catName ? catName : "Every style,"} <em className="text-gold-deep">{catName ? "services" : "clearly priced."}</em>
          </>
        }
        sub="Transparent prices, honest timings and deposits shown upfront. Tap any style to see exactly what's included."
      />

      <div className="sticky top-18 z-20 border-b border-line/70 bg-ivory/92 backdrop-blur-md md:top-20">
        <Container className="flex items-center gap-3 py-3">
          <div className="no-scrollbar -mx-1 flex flex-1 gap-2 overflow-x-auto px-1" role="group" aria-label="Category">
            <Chip on={category === "all"} onClick={() => setCategory("all")}>
              All
            </Chip>
            {CATEGORIES.map((c) => (
              <Chip key={c.id} on={category === c.id} onClick={() => setCategory(c.id)}>
                {c.name}
              </Chip>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setShowFilters((v) => !v)}
            aria-expanded={showFilters}
            aria-controls="service-filters"
            className="inline-flex min-h-10 shrink-0 items-center gap-2 rounded-full border border-ink px-4 text-sm font-semibold"
          >
            <SlidersHorizontal className="size-4" aria-hidden /> Filters{activeCount ? ` (${activeCount})` : ""}
          </button>
        </Container>
        {showFilters ? (
          <Container className="pb-5">
            <div id="service-filters" className="grid animate-fade-up gap-5 rounded-2xl bg-white/70 p-5 ring-1 ring-line md:grid-cols-[1.2fr_1fr_1fr_1fr_auto] md:items-end">
              <label className="flex flex-col gap-2 text-sm font-semibold">
                Search
                <span className="relative">
                  <Search className="absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted" aria-hidden />
                  <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="e.g. knotless" className="w-full rounded-xl border border-line bg-white py-2.5 pr-3 pl-10 font-normal focus:border-gold focus:outline-none" />
                </span>
              </label>
              <label className="flex flex-col gap-2 text-sm font-semibold">
                Price
                <select value={price} onChange={(e) => setPrice(e.target.value)} className="rounded-xl border border-line bg-white px-3 py-2.5 font-normal">
                  {PRICE.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-2 text-sm font-semibold">
                Duration
                <select value={time} onChange={(e) => setTime(e.target.value)} className="rounded-xl border border-line bg-white px-3 py-2.5 font-normal">
                  {TIME.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-2 text-sm font-semibold">
                Stylist
                <select value={stylist} onChange={(e) => setStylist(e.target.value)} className="rounded-xl border border-line bg-white px-3 py-2.5 font-normal">
                  <option value="any">Any stylist</option>
                  {s.stylists.map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex min-h-11 cursor-pointer items-center gap-2.5 text-sm font-semibold">
                <input type="checkbox" checked={thisWeek} onChange={(e) => setThisWeek(e.target.checked)} className="size-4 accent-ink" />
                Available this week
              </label>
            </div>
          </Container>
        ) : null}
      </div>

      <Container className="py-12 md:py-16">
        <div className="mb-8 flex items-center justify-between text-sm text-muted" aria-live="polite">
          <p>
            {list.length} {list.length === 1 ? "style" : "styles"}
          </p>
          {activeCount || q || category !== "all" ? (
            <button onClick={clear} className="inline-flex min-h-10 items-center gap-1.5 font-semibold text-ink underline decoration-gold underline-offset-4">
              <X className="size-4" aria-hidden /> Clear all
            </button>
          ) : null}
        </div>
        {list.length ? (
          <div className="grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {list.map((svc, i) => (
              <Reveal key={svc.id} delay={(i % 4) * 60}>
                <ServiceCard service={svc} />
              </Reveal>
            ))}
          </div>
        ) : (
          <EmptyState
            title="No styles match, yet."
            body="Try widening your filters, or tell us what you have in mind and we'll suggest the right service."
            action="Upload your inspiration"
            to="/inspiration"
          />
        )}
      </Container>
      <FinalCta />
    </>
  );
}
