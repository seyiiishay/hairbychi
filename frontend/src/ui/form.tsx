import { useId, type ComponentProps, type ReactNode } from "react";
import { Check } from "lucide-react";
import { cn } from "../lib/format";

const control =
  "w-full rounded-xl border border-line bg-white/70 px-4 py-3 text-[0.95rem] text-ink placeholder:text-muted/70 transition focus:border-gold focus:bg-white focus:outline-none focus:ring-4 focus:ring-gold/15 aria-[invalid=true]:border-error";

export function Field({
  label,
  hint,
  error,
  optional,
  children,
  className,
}: {
  label: string;
  hint?: string;
  error?: string;
  optional?: boolean;
  children: (id: string, describedBy?: string) => ReactNode;
  className?: string;
}) {
  const id = useId();
  const hintId = hint || error ? `${id}-hint` : undefined;
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <label htmlFor={id} className="text-sm font-semibold text-ink">
        {label} {optional ? <span className="font-normal text-muted">(optional)</span> : null}
      </label>
      {children(id, hintId)}
      {error ? (
        <p id={hintId} className="text-sm text-error" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p id={hintId} className="text-xs text-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export function Input({
  label,
  hint,
  error,
  optional,
  className,
  ...rest
}: { label: string; hint?: string; error?: string; optional?: boolean } & ComponentProps<"input">) {
  return (
    <Field label={label} hint={hint} error={error} optional={optional} className={className}>
      {(id, d) => <input id={id} aria-describedby={d} aria-invalid={!!error} className={control} {...rest} />}
    </Field>
  );
}

export function Textarea({
  label,
  hint,
  error,
  optional,
  className,
  ...rest
}: { label: string; hint?: string; error?: string; optional?: boolean } & ComponentProps<"textarea">) {
  return (
    <Field label={label} hint={hint} error={error} optional={optional} className={className}>
      {(id, d) => <textarea id={id} aria-describedby={d} aria-invalid={!!error} rows={4} className={cn(control, "resize-y")} {...rest} />}
    </Field>
  );
}

export function Select({
  label,
  hint,
  error,
  className,
  children,
  ...rest
}: { label: string; hint?: string; error?: string } & ComponentProps<"select">) {
  return (
    <Field label={label} hint={hint} error={error} className={className}>
      {(id, d) => (
        <select id={id} aria-describedby={d} aria-invalid={!!error} className={cn(control, "appearance-none bg-[length:12px] bg-[right_1rem_center] bg-no-repeat pr-10")} style={{ backgroundImage: CHEVRON }} {...rest}>
          {children}
        </select>
      )}
    </Field>
  );
}

const CHEVRON = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%236f645c' stroke-width='1.5' fill='none'/%3E%3C/svg%3E")`;

export function Checkbox({
  checked,
  onChange,
  children,
  className,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={cn("flex cursor-pointer items-start gap-3 text-sm leading-relaxed", className)}>
      <input type="checkbox" className="peer sr-only" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span
        className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-md border border-sand-deep bg-white transition peer-checked:border-ink peer-checked:bg-ink peer-focus-visible:ring-4 peer-focus-visible:ring-gold/30"
        aria-hidden
      >
        {checked ? <Check className="size-3.5 text-ivory" strokeWidth={3} /> : null}
      </span>
      <span>{children}</span>
    </label>
  );
}

/** Segmented, tappable single-choice control (radio group semantics). */
export function Choices<T extends string>({
  legend,
  options,
  value,
  onChange,
  columns = 4,
}: {
  legend: string;
  options: { value: T; label: string; hint?: string }[];
  value: T | undefined;
  onChange: (v: T) => void;
  columns?: 2 | 3 | 4;
}) {
  const name = useId();
  return (
    <fieldset>
      <legend className="mb-3 text-sm font-semibold text-ink">{legend}</legend>
      <div className={cn("grid gap-2", columns === 2 ? "grid-cols-2" : columns === 3 ? "grid-cols-3" : "grid-cols-2 sm:grid-cols-4")}>
        {options.map((o) => (
          <label key={o.value} className="cursor-pointer">
            <input type="radio" name={name} value={o.value} checked={value === o.value} onChange={() => onChange(o.value)} className="peer sr-only" />
            <span className="flex min-h-12 flex-col items-center justify-center rounded-xl border border-line bg-white/70 px-3 py-2.5 text-center text-sm font-medium transition peer-checked:border-ink peer-checked:bg-ink peer-checked:text-ivory peer-focus-visible:ring-4 peer-focus-visible:ring-gold/30 hover:border-ink/40">
              {o.label}
              {o.hint ? <span className="mt-0.5 text-[0.7rem] font-normal opacity-70">{o.hint}</span> : null}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

/** Reads an image file into a downscaled data URL so it fits in local storage. */
export function readImage(file: File, max = 900): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error);
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("Unsupported image"));
      img.onload = () => {
        const scale = Math.min(1, max / Math.max(img.width, img.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.8));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}
