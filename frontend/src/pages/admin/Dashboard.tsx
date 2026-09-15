import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  adminListBookings,
  adminBatchBookings,
  adminListResolutionQueue,
  adminResolveConflict,
} from "../../api/endpoints";
import type { AdminBookingListItem } from "../../api/types";
import { formatDate, formatTime, money } from "../../lib/timezone";
import { ApiRequestError } from "../../api/client";
import { errorMessage } from "../../lib/errors";
import {
  Card,
  ErrorBanner,
  PrimaryButton,
  SecondaryButton,
  Spinner,
  StatusBadge,
} from "../../components/Shared";
import Modal from "../../components/Modal";
import SlotPickerGrid from "../../components/SlotPickerGrid";

const STATUS_TABS = [
  { value: "", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "declined", label: "Declined" },
  { value: "cancelled", label: "Cancelled" },
  { value: "payment_failed", label: "Payment failed" },
];

export default function Dashboard() {
  const [status, setStatus] = useState("");
  const [includeArchived, setIncludeArchived] = useState(false);
  const [bookings, setBookings] = useState<AdminBookingListItem[] | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [resolutionQueue, setResolutionQueue] = useState<AdminBookingListItem[]>([]);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    setBookings(null);
    adminListBookings({ status: status || undefined, include_archived: includeArchived })
      .then((res) => setBookings(res.results))
      .catch((err) => setError(err instanceof ApiRequestError ? errorMessage(err.code) : "Couldn't load bookings."));
  }, [status, includeArchived, reload]);

  useEffect(() => {
    adminListResolutionQueue()
      .then((res) => setResolutionQueue(res.results))
      .catch(() => {});
  }, [reload]);

  const toggleSelected = (id: string) => {
    setSelected((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const runBatch = async (action: "approve" | "decline" | "archive") => {
    if (selected.size === 0) return;
    try {
      await adminBatchBookings(Array.from(selected), action);
      setSelected(new Set());
      setReload((r) => r + 1);
    } catch (err) {
      setError(err instanceof ApiRequestError ? errorMessage(err.code, err.message) : "Batch action failed.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-stone-900">Bookings</h1>
      </div>

      {resolutionQueue.length > 0 && (
        <ResolutionQueueSection items={resolutionQueue} onChanged={() => setReload((r) => r + 1)} />
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setStatus(tab.value)}
              className={`rounded-full px-3 py-1.5 text-sm ${
                status === tab.value ? "bg-brand-600 text-white" : "bg-white text-stone-600 hover:bg-stone-100"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <label className="flex items-center gap-2 text-sm text-stone-600">
          <input type="checkbox" checked={includeArchived} onChange={(e) => setIncludeArchived(e.target.checked)} />
          Include archived
        </label>
      </div>

      {selected.size > 0 && (
        <div className="flex items-center gap-3 rounded-lg border border-brand-200 bg-brand-50 px-4 py-2 text-sm">
          <span>{selected.size} selected</span>
          <button className="text-brand-700 underline" onClick={() => runBatch("approve")}>
            Approve
          </button>
          <button className="text-brand-700 underline" onClick={() => runBatch("decline")}>
            Decline
          </button>
          <button className="text-brand-700 underline" onClick={() => runBatch("archive")}>
            Archive
          </button>
        </div>
      )}

      <ErrorBanner message={error} />
      {!bookings && <Spinner />}
      {bookings?.length === 0 && <p className="text-stone-500">No bookings found.</p>}

      <div className="space-y-2">
        {bookings?.map((b) => (
          <Card key={b.id} className="flex items-center gap-4">
            <input type="checkbox" checked={selected.has(b.id)} onChange={() => toggleSelected(b.id)} />
            <Link to={`/admin/bookings/${b.id}`} className="flex-1">
              <div className="flex flex-wrap items-center gap-3">
                <span className="font-medium text-stone-900">
                  {formatDate(b.requested_start_time)} · {formatTime(b.requested_start_time)}
                </span>
                <StatusBadge status={b.status} />
                {b.conflict_flag && (
                  <span className="rounded-full bg-red-100 px-2.5 py-1 text-xs font-medium text-red-700">
                    conflict
                  </span>
                )}
                {b.arrival_status !== "none" && (
                  <span className="rounded-full bg-stone-100 px-2.5 py-1 text-xs text-stone-600">
                    {b.arrival_status.replace("_", " ")}
                  </span>
                )}
              </div>
              <p className="mt-1 text-sm text-stone-500">
                {b.client_name} · {b.client_email} · {money(b.amount_due_today)} due
              </p>
            </Link>
          </Card>
        ))}
      </div>
    </div>
  );
}

function ResolutionQueueSection({
  items,
  onChanged,
}: {
  items: AdminBookingListItem[];
  onChanged: () => void;
}) {
  const [rescheduling, setRescheduling] = useState<AdminBookingListItem | null>(null);

  const handleCancel = async (id: string) => {
    if (!window.confirm("Cancel this booking and refund the client?")) return;
    await adminResolveConflict(id, "cancel");
    onChanged();
  };

  return (
    <Card className="border-amber-300 bg-amber-50">
      <h2 className="mb-2 font-medium text-amber-900">Resolution queue ({items.length})</h2>
      <p className="mb-3 text-sm text-amber-800">
        These bookings were affected by a blocked day and need to be individually cancelled (refunded) or
        rescheduled.
      </p>
      <div className="space-y-2">
        {items.map((b) => (
          <div key={b.id} className="flex items-center justify-between rounded-lg bg-white px-3 py-2">
            <div>
              <p className="text-sm font-medium text-stone-900">
                {formatDate(b.requested_start_time)} · {formatTime(b.requested_start_time)} — {b.client_name}
              </p>
            </div>
            <div className="flex gap-2">
              <SecondaryButton onClick={() => setRescheduling(b)}>Reschedule</SecondaryButton>
              <SecondaryButton onClick={() => handleCancel(b.id)} className="border-red-200 text-red-600">
                Cancel & refund
              </SecondaryButton>
            </div>
          </div>
        ))}
      </div>

      {rescheduling && (
        <ResolutionRescheduleModal
          booking={rescheduling}
          onClose={() => setRescheduling(null)}
          onDone={() => {
            setRescheduling(null);
            onChanged();
          }}
        />
      )}
    </Card>
  );
}

function ResolutionRescheduleModal({
  booking,
  onClose,
  onDone,
}: {
  booking: AdminBookingListItem;
  onClose: () => void;
  onDone: () => void;
}) {
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const durationMinutes = Math.round(
    (new Date(booking.service_end_time).getTime() - new Date(booking.requested_start_time).getTime()) / 60000
  );

  const handleConfirm = async () => {
    if (!selectedSlot) return;
    try {
      await adminResolveConflict(booking.id, "reschedule", selectedSlot);
      onDone();
    } catch (err) {
      setError(err instanceof ApiRequestError ? errorMessage(err.code, err.message) : "Something went wrong.");
    }
  };

  return (
    <Modal title={`Reschedule ${booking.client_name}`} onClose={onClose}>
      <div className="space-y-3">
        <SlotPickerGrid requiredDurationMinutes={durationMinutes} onSelect={setSelectedSlot} selected={selectedSlot} />
        <ErrorBanner message={error} />
        <div className="flex justify-end gap-2 pt-2">
          <SecondaryButton onClick={onClose}>Cancel</SecondaryButton>
          <PrimaryButton disabled={!selectedSlot} onClick={handleConfirm}>
            Confirm new time
          </PrimaryButton>
        </div>
      </div>
    </Modal>
  );
}
