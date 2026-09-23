import { Plus } from "lucide-react";

export default function FaqList({ items }: { items: { q: string; a: string }[] }) {
  return (
    <div className="divide-y divide-line border-y border-line">
      {items.map((f) => (
        <details key={f.q} className="group py-1">
          <summary className="flex min-h-16 cursor-pointer list-none items-center justify-between gap-6 py-4 text-left [&::-webkit-details-marker]:hidden">
            <span className="font-display text-[1.45rem] leading-snug md:text-2xl">{f.q}</span>
            <span className="grid size-9 shrink-0 place-items-center rounded-full border border-line transition group-open:rotate-45 group-open:border-ink group-open:bg-ink group-open:text-ivory" aria-hidden>
              <Plus className="size-4" />
            </span>
          </summary>
          <p className="max-w-2xl pb-6 text-[0.95rem] leading-relaxed text-muted">{f.a}</p>
        </details>
      ))}
    </div>
  );
}
