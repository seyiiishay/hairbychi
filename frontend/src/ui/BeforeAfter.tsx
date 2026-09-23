import { useRef, useState } from "react";
import { MoveHorizontal } from "lucide-react";
import type { ArtKey, Tone } from "../data/types";
import Photo from "./Photo";

/** Drag (or use arrow keys) to compare a before and after look. */
export default function BeforeAfter({
  before,
  after,
  label,
}: {
  before: { art: ArtKey; tone: Tone; path?: string };
  after: { art: ArtKey; tone: Tone; path?: string };
  label: string;
}) {
  const [pos, setPos] = useState(50);
  const box = useRef<HTMLDivElement>(null);
  const move = (clientX: number) => {
    const r = box.current?.getBoundingClientRect();
    if (!r) return;
    setPos(Math.min(100, Math.max(0, ((clientX - r.left) / r.width) * 100)));
  };
  return (
    <div
      ref={box}
      className="relative aspect-[4/5] touch-none overflow-hidden rounded-[var(--radius-card)] select-none"
      onPointerDown={(e) => {
        (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
        move(e.clientX);
      }}
      onPointerMove={(e) => e.buttons && move(e.clientX)}
    >
      <Photo {...after} alt={`${label}, after`} className="absolute inset-0" />
      <div className="absolute inset-0" style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}>
        <Photo {...before} alt={`${label}, before`} className="absolute inset-0 grayscale-[35%]" />
      </div>
      <span className="absolute top-4 left-4 rounded-full bg-ink/75 px-3 py-1 text-[0.7rem] font-semibold tracking-widest text-ivory uppercase">Before</span>
      <span className="absolute top-4 right-4 rounded-full bg-ivory/90 px-3 py-1 text-[0.7rem] font-semibold tracking-widest text-ink uppercase">After</span>
      <div className="absolute inset-y-0 w-px bg-ivory" style={{ left: `${pos}%` }} aria-hidden />
      <div
        role="slider"
        tabIndex={0}
        aria-label={`Compare before and after: ${label}`}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(pos)}
        onKeyDown={(e) => {
          if (e.key === "ArrowLeft") setPos((p) => Math.max(0, p - 5));
          if (e.key === "ArrowRight") setPos((p) => Math.min(100, p + 5));
        }}
        className="absolute top-1/2 grid size-12 -translate-x-1/2 -translate-y-1/2 cursor-ew-resize place-items-center rounded-full bg-ivory text-ink shadow-xl"
        style={{ left: `${pos}%` }}
      >
        <MoveHorizontal className="size-5" aria-hidden />
      </div>
    </div>
  );
}
