import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { useCart } from "../../context/CartContext";
import { getSlots } from "../../api/endpoints";
import type { Slot } from "../../api/types";
import { formatDate, formatTime, localDateKey } from "../../lib/timezone";
import { Card, ErrorBanner, PrimaryButton, SecondaryButton, Spinner, WizardSteps } from "../../components/Shared";
import { ApiRequestError } from "../../api/client";
import { errorMessage } from "../../lib/errors";

const DAYS_AHEAD = 21;

export default function Slots() {
  const { items, totalDurationMinutes, selectedSlotStart, setSelectedSlotStart } = useCart();
  const navigate = useNavigate();
  const [slots, setSlots] = useState<Slot[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (items.length === 0) return;
    const from = new Date();
    const to = new Date();
    to.setDate(to.getDate() + DAYS_AHEAD);
    getSlots(format(from, "yyyy-MM-dd"), format(to, "yyyy-MM-dd"), totalDurationMinutes)
      .then((res) => setSlots(res.slots))
      .catch((err) => setError(err instanceof ApiRequestError ? errorMessage(err.code) : "Couldn't load available times."));
  }, [items.length, totalDurationMinutes]);

  const grouped = useMemo(() => {
    const map = new Map<string, Slot[]>();
    for (const slot of slots || []) {
      const key = localDateKey(slot.start);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(slot);
    }
    return Array.from(map.entries());
  }, [slots]);

  if (items.length === 0) {
    return (
      <div className="space-y-4">
        <p className="text-stone-500">Add a service before choosing a time.</p>
        <PrimaryButton onClick={() => navigate("/book")}>Browse services</PrimaryButton>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <WizardSteps current={2} />
      <h1 className="text-2xl font-semibold text-stone-900">Choose a time</h1>
      <p className="text-stone-500">Showing times over the next {DAYS_AHEAD} days that fit your {totalDurationMinutes}-minute booking.</p>

      <ErrorBanner message={error} />
      {!slots && !error && <Spinner />}
      {slots && slots.length === 0 && <p className="text-stone-500">No times available in this window. Please check back soon.</p>}

      <div className="space-y-5">
        {grouped.map(([dateKey, daySlots]) => (
          <div key={dateKey}>
            <h3 className="mb-2 text-sm font-medium text-stone-700">{formatDate(daySlots[0].start)}</h3>
            <div className="flex flex-wrap gap-2">
              {daySlots.map((slot) => (
                <button
                  key={slot.start}
                  onClick={() => setSelectedSlotStart(slot.start)}
                  className={`rounded-lg border px-3 py-2 text-sm ${
                    selectedSlotStart === slot.start
                      ? "border-brand-600 bg-brand-600 text-white"
                      : "border-stone-300 bg-white text-stone-700 hover:border-brand-400"
                  }`}
                >
                  {formatTime(slot.start)}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {selectedSlotStart && (
        <Card className="bg-stone-50">
          <p className="text-sm text-stone-500">Selected time</p>
          <p className="font-medium text-stone-900">
            {formatDate(selectedSlotStart)} at {formatTime(selectedSlotStart)}
          </p>
        </Card>
      )}

      <div className="flex justify-between">
        <SecondaryButton onClick={() => navigate("/book/cart")}>Back to cart</SecondaryButton>
        <PrimaryButton disabled={!selectedSlotStart} onClick={() => navigate("/book/details")}>
          Continue
        </PrimaryButton>
      </div>
    </div>
  );
}
