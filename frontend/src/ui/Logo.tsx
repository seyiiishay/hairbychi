import { Link } from "react-router-dom";
import { cn } from "../lib/format";

export default function Logo({ light, className, to = "/" }: { light?: boolean; className?: string; to?: string }) {
  return (
    <Link to={to} className={cn("group inline-flex items-center gap-2.5", className)} aria-label="Hair by Chi, home">
      <span
        className={cn(
          "grid size-9 place-items-center rounded-full border font-display text-lg italic transition group-hover:rotate-[-8deg]",
          light ? "border-gold/60 text-gold" : "border-gold text-gold-deep",
        )}
        aria-hidden
      >
        C
      </span>
      <span className={cn("font-display text-[1.6rem] leading-none tracking-tight whitespace-nowrap", light ? "text-ivory" : "text-ink")}>
        Hair <span className="italic text-gold">by</span> Chi
      </span>
    </Link>
  );
}

export function SocialIcon({ name, className }: { name: "instagram" | "tiktok" | "facebook"; className?: string }) {
  const paths = {
    instagram: (
      <>
        <rect x="3" y="3" width="18" height="18" rx="5" fill="none" stroke="currentColor" strokeWidth="1.6" />
        <circle cx="12" cy="12" r="4.2" fill="none" stroke="currentColor" strokeWidth="1.6" />
        <circle cx="17.4" cy="6.6" r="1.1" fill="currentColor" />
      </>
    ),
    tiktok: (
      <path
        d="M14.5 3v11.2a3.3 3.3 0 1 1-3.3-3.3M14.5 3c.4 2.6 2.2 4.4 5 4.6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    ),
    facebook: (
      <path d="M14 8h2.5V4.5H14c-2.5 0-4 1.7-4 4.2V11H7.5v3.5H10V21h3.5v-6.5H16l.5-3.5h-3V8.8c0-.5.3-.8.5-.8z" fill="currentColor" />
    ),
  };
  return (
    <svg viewBox="0 0 24 24" className={cn("size-5", className)} aria-hidden>
      {paths[name]}
    </svg>
  );
}
