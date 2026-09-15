import type { ReactNode } from "react";

export function Spinner() {
  return (
    <div className="flex justify-center py-8">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-300 border-t-brand-600" />
    </div>
  );
}

export function ErrorBanner({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
      {message}
    </div>
  );
}

export function InfoBanner({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">{children}</div>
  );
}

export function PrimaryButton({
  children,
  onClick,
  disabled,
  type = "button",
  className = "",
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  type?: "button" | "submit";
  className?: string;
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`rounded-lg bg-brand-600 px-5 py-2.5 font-medium text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
    >
      {children}
    </button>
  );
}

export function SecondaryButton({
  children,
  onClick,
  disabled,
  type = "button",
  className = "",
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  type?: "button" | "submit";
  className?: string;
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`rounded-lg border border-stone-300 bg-white px-5 py-2.5 font-medium text-stone-700 transition hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
    >
      {children}
    </button>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-xl border border-stone-200 bg-white p-5 shadow-sm ${className}`}>{children}</div>;
}

export function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending: "bg-amber-100 text-amber-800",
    approved: "bg-emerald-100 text-emerald-800",
    manually_approved: "bg-emerald-100 text-emerald-800",
    declined: "bg-red-100 text-red-800",
    cancelled: "bg-stone-200 text-stone-700",
    expired: "bg-stone-200 text-stone-700",
    payment_failed: "bg-red-100 text-red-800",
  };
  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${styles[status] || "bg-stone-100 text-stone-700"}`}>
      {status.replace(/_/g, " ")}
    </span>
  );
}

export function WizardSteps({ current }: { current: number }) {
  const steps = ["Browse", "Cart", "Time", "Details", "Payment"];
  return (
    <ol className="mb-6 flex flex-wrap items-center gap-2 text-sm">
      {steps.map((label, i) => (
        <li key={label} className="flex items-center gap-2">
          <span
            className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${
              i <= current ? "bg-brand-600 text-white" : "bg-stone-200 text-stone-500"
            }`}
          >
            {i + 1}
          </span>
          <span className={i <= current ? "font-medium text-stone-800" : "text-stone-400"}>{label}</span>
          {i < steps.length - 1 && <span className="text-stone-300">—</span>}
        </li>
      ))}
    </ol>
  );
}
