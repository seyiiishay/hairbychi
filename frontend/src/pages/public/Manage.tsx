import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { format } from "date-fns";
import {
  getBookingByToken,
  cancelBookingByToken,
  rescheduleBookingByToken,
  getSlots,
} from "../../api/endpoints";
import type { GuestBooking, Slot } from "../../api/types";
import { formatDate, formatDateTime, formatTime, localDateKey, money } from "../../lib/timezone";
import { ApiRequestError } from "../../api/client";
import { errorMessage } from "../../lib/errors";
import { Card, ErrorBanner, InfoBanner, PrimaryButton, SecondaryButton, Spinner, StatusBadge } from "../../components/Shared";

const ACTIVE_STATUSES = ["pending", "approved", "manually_approved"];
const DAYS_AHEAD = 21;

export default function Manage() {
  const { token } = useParams<{ token: string }>();
  const [booking, setBooking] = useState<GuestBooking | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<"view" | "reschedule">("view");
  const [busy, setBusy] = useState(false);

  const load = () => {
    if (!token) return;
    getBookingByToken(token)
      .then(setBooking)
      .catch((err) => setError(err instanceof ApiRequestError ? errorMessage(err.code) : "Couldn't load your booking."));
  };

  useEffect(load, [token]);

  if (error) return <ErrorBanner message={error} />;
  if (!booking) return <Spinner />;

  const isActive = ACTIVE_STATUSES.includes(booking.status);
  const canManage = isActive && booking.reschedule_count === 0;

  const handleCancel = async () => {
    if (!token || !window.confirm("Cancel this appointment? This cannot be undone online.")) return;
    setBusy(true);
    setError(null);
    try {
      const updated = await cancelBookingByToken(token);
      setBooking(updated);
    } catch (err) {
      setError(err instanceof ApiRequestError ? errorMessage(err.code, err.message) : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-stone-900">Manage your booking</h1>

      <Card className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="font-medium text-stone-900">{formatDateTime(booking.requested_start_time)}</p>
          <StatusBadge status={booking.status} />
        </div>
        <p className="text-sm text-stone-500">Ends by {formatDateTime(booking.service_end_time)}</p>
        <ul className="text-sm text-stone-600">
          {booking.items.map((item, i) => (
            <li key={i}>
              {item.name_snapshot} — {money(item.price_snapshot)}
            </li>
          ))}
        </ul>
        <div className="border-t border-stone-100 pt-3 text-sm">
          <div className="flex justify-between">
            <span className="text-stone-500">Total</span>
            <span className="font-medium">{money(booking.total_price)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-stone-500">
              {booking.full_payment_required ? "Full payment" : "Deposit"} ({booking.payment_method})
            </span>
            <span className="font-medium">{money(booking.amount_due_today)}</span>
          </div>
        </div>
      </Card>

      {!isActive && (
        <InfoBanner>This booking is {booking.status.replace(/_/g, " ")} and can no longer be changed here.</InfoBanner>
      )}

      {isActive && booking.reschedule_count > 0 && (
        <InfoBanner>
          This booking has already been rescheduled once. To change it again, please cancel and submit a new request.
        </InfoBanner>
      )}

      {isActive && mode === "view" && (
        <div className="flex flex-wrap gap-3">
          {canManage && (
            <SecondaryButton onClick={() => setMode("reschedule")}>Reschedule</SecondaryButton>
          )}
          <SecondaryButton onClick={handleCancel} disabled={busy} className="border-red-200 text-red-600 hover:bg-red-50">
            Cancel appointment
          </SecondaryButton>
        </div>
      )}

      {mode === "reschedule" && (
        <RescheduleFlow
          booking={booking}
          onDone={(updated) => {
            setBooking(updated);
            setMode("view");
          }}
          onCancel={() => setMode("view")}
        />
      )}
    </div>
  );
}

function RescheduleFlow({
  booking,
  onDone,
  onCancel,
}: {
  booking: GuestBooking;
  onDone: (b: GuestBooking) => void;
  onCancel: () => void;
}) {
  const { token } = useParams<{ token: string }>();
  const [slots, setSlots] = useState<Slot[] | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const requiredDuration = booking.items.reduce((sum, i) => sum + i.duration_snapshot, 0);

  useEffect(() => {
    const from = new Date();
    const to = new Date();
    to.setDate(to.getDate() + DAYS_AHEAD);
    getSlots(format(from, "yyyy-MM-dd"), format(to, "yyyy-MM-dd"), requiredDuration)
      .then((res) => setSlots(res.slots))
      .catch(() => setError("Couldn't load available times."));
  }, [requiredDuration]);

  const grouped = useMemo(() => {
    const map = new Map<string, Slot[]>();
    for (const slot of slots || []) {
      const key = localDateKey(slot.start);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(slot);
    }
    return Array.from(map.entries());
  }, [slots]);

  const handleConfirm = async () => {
    if (!token || !selected) return;
    setBusy(true);
    setError(null);
    try {
      const updated = await rescheduleBookingByToken(token, selected);
      onDone(updated);
    } catch (err) {
      setError(err instanceof ApiRequestError ? errorMessage(err.code, err.message) : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className="space-y-4">
      <h2 className="font-medium text-stone-900">Choose a new time</h2>
      <ErrorBanner message={error} />
      {!slots && <Spinner />}
      {slots?.length === 0 && <p className="text-sm text-stone-500">No times available right now.</p>}

      <div className="space-y-4">
        {grouped.map(([dateKey, daySlots]) => (
          <div key={dateKey}>
            <h3 className="mb-2 text-sm font-medium text-stone-700">{formatDate(daySlots[0].start)}</h3>
            <div className="flex flex-wrap gap-2">
              {daySlots.map((slot) => (
                <button
                  key={slot.start}
                  onClick={() => setSelected(slot.start)}
                  className={`rounded-lg border px-3 py-2 text-sm ${
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

      <div className="flex justify-between pt-2">
        <SecondaryButton onClick={onCancel}>Back</SecondaryButton>
        <PrimaryButton disabled={!selected || busy} onClick={handleConfirm}>
          Confirm new time
        </PrimaryButton>
      </div>
    </Card>
  );
}
