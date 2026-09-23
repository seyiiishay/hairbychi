import { useEffect, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "../lib/format";

/** Accessible dialog: focus moves in, Escape closes, focus returns on close. */
export default function Modal({
  open,
  onClose,
  title,
  children,
  size = "md",
  dark,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  size?: "md" | "lg" | "full";
  dark?: boolean;
}) {
  const panel = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "Tab" && panel.current) {
        const f = panel.current.querySelectorAll<HTMLElement>("a,button,input,select,textarea,[tabindex]:not([tabindex='-1'])");
        if (!f.length) return;
        const first = f[0];
        const last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    panel.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
      previous?.focus();
    };
  }, [open, onClose]);

  if (!open) return null;
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6">
      <div className={cn("absolute inset-0 animate-[fade-up_.3s_ease_both]", dark ? "bg-ink/92" : "bg-ink/45 backdrop-blur-sm")} onClick={onClose} aria-hidden />
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        className={cn(
          "relative max-h-[92vh] w-full animate-fade-up overflow-y-auto focus:outline-none",
          dark ? "text-ivory" : "rounded-t-3xl bg-ivory p-6 shadow-2xl sm:rounded-3xl sm:p-8",
          size === "md" && "sm:max-w-lg",
          size === "lg" && "sm:max-w-3xl",
          size === "full" && "sm:max-w-6xl",
        )}
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          {dark ? <span /> : <h2 className="text-3xl">{title}</h2>}
          <button
            onClick={onClose}
            className={cn("grid size-10 shrink-0 place-items-center rounded-full transition", dark ? "bg-ivory/10 hover:bg-ivory/20" : "bg-sand hover:bg-sand-deep")}
            aria-label="Close"
          >
            <X className="size-5" />
          </button>
        </div>
        {children}
      </div>
    </div>,
    document.body,
  );
}
