import { addMonths, eachDayOfInterval, endOfMonth, format, isSameMonth, startOfMonth, startOfWeek, endOfWeek } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { DayStatus } from "../lib/availability";
import { cn, dateKey } from "../lib/format";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const STATUS_TEXT: Record<DayStatus, string> = {
  available: "available",
  limited: "few times left",
  full: "fully booked",
  closed: "unavailable",
  past: "past date",
};

/**
 * Month calendar. Availability is conveyed with text and shape, never colour
 * alone: bookable dates are solid, "few left" carry a caption, full dates are
 * struck through, closed dates are faded.
 */
export default function Calendar({
  month,
  onMonthChange,
  selected,
  onSelect,
  statusOf,
  minMonth,
  maxMonth,
}: {
  month: Date;
  onMonthChange: (d: Date) => void;
  selected?: string;
  onSelect: (key: string, status: DayStatus) => void;
  statusOf: (key: string) => DayStatus;
  minMonth: Date;
  maxMonth: Date;
}) {
  const days = eachDayOfInterval({ start: startOfWeek(startOfMonth(month)), end: endOfWeek(endOfMonth(month)) });
  const canPrev = startOfMonth(month) > startOfMonth(minMonth);
  const canNext = startOfMonth(month) < startOfMonth(maxMonth);
  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <h3 className="text-3xl" aria-live="polite">
          {format(month, "MMMM yyyy")}
        </h3>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => onMonthChange(addMonths(month, -1))}
            disabled={!canPrev}
            className="grid size-11 place-items-center rounded-full border border-line transition hover:border-ink disabled:opacity-30"
            aria-label="Previous month"
          >
            <ChevronLeft className="size-5" />
          </button>
          <button
            type="button"
            onClick={() => onMonthChange(addMonths(month, 1))}
            disabled={!canNext}
            className="grid size-11 place-items-center rounded-full border border-line transition hover:border-ink disabled:opacity-30"
            aria-label="Next month"
          >
            <ChevronRight className="size-5" />
          </button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center" role="grid" aria-label={format(month, "MMMM yyyy")}>
        {WEEKDAYS.map((d) => (
          <div key={d} className="pb-2 text-[0.7rem] font-semibold tracking-widest text-muted uppercase" role="columnheader">
            {d}
          </div>
        ))}
        {days.map((d) => {
          const key = dateKey(d);
          const inMonth = isSameMonth(d, month);
          if (!inMonth) return <div key={key} aria-hidden />;
          const status = statusOf(key);
          const bookable = status === "available" || status === "limited";
          const isSel = selected === key;
          return (
            <button
              key={key}
              type="button"
              role="gridcell"
              aria-selected={isSel}
              disabled={status === "past" || status === "closed"}
              onClick={() => onSelect(key, status)}
              aria-label={`${format(d, "EEEE, MMMM d")}: ${STATUS_TEXT[status]}`}
              className={cn(
                "relative flex aspect-square min-h-11 flex-col items-center justify-center rounded-2xl text-[0.95rem] transition",
                isSel && "bg-ink text-ivory shadow-lg",
                !isSel && bookable && "bg-white font-semibold ring-1 ring-line hover:ring-ink",
                !isSel && status === "full" && "text-muted line-through decoration-muted/60 hover:bg-white/60",
                (status === "closed" || status === "past") && "text-muted/40",
              )}
            >
              {format(d, "d")}
              {status === "limited" ? (
                <span className={cn("text-[0.58rem] font-medium tracking-wide no-underline", isSel ? "text-gold-soft" : "text-gold-deep")}>few left</span>
              ) : status === "full" ? (
                <span className="text-[0.58rem] tracking-wide no-underline">full</span>
              ) : null}
            </button>
          );
        })}
      </div>
      <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted">
        <span className="inline-flex items-center gap-2">
          <span className="grid size-5 place-items-center rounded-md bg-white text-[0.6rem] font-semibold text-ink ring-1 ring-line">8</span> Available
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="text-gold-deep">few left</span> Limited times
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="line-through">8</span> Fully booked
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="text-muted/40">8</span> Closed
        </span>
      </div>
    </div>
  );
}
