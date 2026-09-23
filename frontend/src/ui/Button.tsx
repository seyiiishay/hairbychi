import type { ComponentProps, ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Loader2 } from "lucide-react";
import { cn } from "../lib/format";

type Variant = "primary" | "secondary" | "text" | "light";
type Size = "md" | "lg" | "sm";

const base =
  "items-center justify-center gap-2 font-semibold tracking-wide transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-50 select-none";
const variants: Record<Variant, string> = {
  primary: "bg-ink text-ivory hover:bg-ink-soft hover:-translate-y-0.5 hover:shadow-[0_10px_30px_-12px_rgba(28,24,22,0.55)] rounded-full",
  secondary: "border border-ink/80 text-ink hover:bg-ink hover:text-ivory rounded-full",
  light: "bg-ivory text-ink hover:bg-white hover:-translate-y-0.5 rounded-full",
  text: "text-ink underline-offset-[6px] decoration-gold hover:underline px-0",
};
const sizes: Record<Size, string> = {
  sm: "min-h-9 px-4 text-[0.8rem]",
  md: "min-h-11 px-6 text-sm",
  lg: "min-h-13 px-8 text-[0.95rem]",
};

interface Common {
  variant?: Variant;
  size?: Size;
  arrow?: boolean;
  loading?: boolean;
  children: ReactNode;
  className?: string;
}

// Callers may pass their own display (e.g. "hidden sm:inline-flex"); only default to inline-flex when they don't
const OWN_DISPLAY = /(^|\s)(hidden|flex|block|grid|inline-flex)(\s|$)/;

export function buttonClass(variant: Variant = "primary", size: Size = "md", className?: string) {
  return cn(OWN_DISPLAY.test(className ?? "") ? "" : "inline-flex", base, variants[variant], variant === "text" ? "min-h-11 text-sm" : sizes[size], className);
}

export function Button({
  variant = "primary",
  size = "md",
  arrow,
  loading,
  children,
  className,
  ...rest
}: Common & ComponentProps<"button">) {
  return (
    <button className={buttonClass(variant, size, className)} disabled={loading || rest.disabled} {...rest}>
      {loading ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
      {children}
      {arrow && !loading ? <ArrowRight className="size-4" aria-hidden /> : null}
    </button>
  );
}

export function ButtonLink({
  to,
  variant = "primary",
  size = "md",
  arrow,
  children,
  className,
  ...rest
}: Common & { to: string } & Omit<ComponentProps<typeof Link>, "to">) {
  return (
    <Link to={to} className={buttonClass(variant, size, className)} {...rest}>
      {children}
      {arrow ? <ArrowRight className="size-4" aria-hidden /> : null}
    </Link>
  );
}
