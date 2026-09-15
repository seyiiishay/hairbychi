import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { getSlots } from "../api/endpoints";
import type { Slot } from "../api/types";
import { formatDate, formatTime, localDateKey } from "../lib/timezone";
import { Spinner, ErrorBanner } from "./Shared";

const DAYS_AHEAD = 21;

export default function SlotPickerGrid({
  requiredDurationMinutes,
  onSelect,
  selected,
}: {
  requiredDurationMinutes: number;
  onSelect: (iso: string) => void;
  selected: string | null;
}) {
  const [slots, setSlots] = useState<Slot[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const from = new Date();
    const to = new Date();
    to.setDate(to.getDate() + DAYS_AHEAD);
    getSlots(format(from, "yyyy-MM-dd"), format(to, "yyyy-MM-dd"), requiredDurationMinutes)
      .then((res) => setSlots(res.slots))
      .catch(() => setError("Couldn't load available times."));
  }, [requiredDurationMinutes]);

  const grouped = useMemo(() => {
    const map = new Map<string, Slot[]>();
    for (const slot of slots || []) {
      const key = localDateKey(slot.start);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(slot);
    }
    return Array.from(map.entries());
  }, [slots]);

  return (
    <div className="max-h-72 space-y-3 overflow-y-auto">
      <ErrorBanner message={error} />
      {!slots && <Spinner />}
      {slots?.length === 0 && <p className="text-sm text-stone-500">No times available.</p>}
      {grouped.map(([dateKey, daySlots]) => (
        <div key={dateKey}>
          <p className="mb-1 text-xs font-medium text-stone-500">{formatDate(daySlots[0].start)}</p>
          <div className="flex flex-wrap gap-1.5">
            {daySlots.map((slot) => (
              <button
                key={slot.start}
                onClick={() => onSelect(slot.start)}
                className={`rounded-md border px-2 py-1 text-xs ${
                  selected === slot.start
                    ? "border-brand-600 bg-brand-600 text-white"
                    : "border-stone-300 bg-white text-stone-700"
                }`}
              >
                {formatTime(slot.start)}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
