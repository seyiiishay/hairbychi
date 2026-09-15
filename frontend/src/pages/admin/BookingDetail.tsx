import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  adminGetBooking,
  adminApproveBooking,
  adminDeclineBooking,
  adminMarkArrival,
  adminManualOverride,
  adminUploadProof,
} from "../../api/endpoints";
import type { AdminBookingDetail as AdminBookingDetailType } from "../../api/types";
import { formatDateTime, money } from "../../lib/timezone";
import { ApiRequestError } from "../../api/client";
import { errorMessage } from "../../lib/errors";
import { Card, ErrorBanner, InfoBanner, PrimaryButton, SecondaryButton, Spinner, StatusBadge } from "../../components/Shared";

export default function BookingDetail() {
  const { id } = useParams<{ id: string }>();
  const [booking, setBooking] = useState<AdminBookingDetailType | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofNote, setProofNote] = useState("");
  const [declineReason, setDeclineReason] = useState("");
  const [noShowNote, setNoShowNote] = useState("");
  const [overrideNote, setOverrideNote] = useState("");
  const [busy, setBusy] = useState(false);

  const load = () => {
    if (!id) return;
    adminGetBooking(id)
      .then(setBooking)
      .catch((err) => setError(err instanceof ApiRequestError ? errorMessage(err.code) : "Couldn't load booking."));
  };

  useEffect(load, [id]);

  if (error) return <ErrorBanner message={error} />;
  if (!booking) return <Spinner />;

  const runAction = async (fn: () => Promise<AdminBookingDetailType>) => {
    setBusy(true);
    setActionError(null);
    try {
      const updated = await fn();
      setBooking(updated);
    } catch (err) {
      setActionError(err instanceof ApiRequestError ? errorMessage(err.code, err.message) : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  };

  const handleApprove = async () => {
    if (booking.payment_method === "offline") {
      let proofUrl = booking.proof_url;
      if (proofFile) {
        try {
          const res = await adminUploadProof(proofFile);
          proofUrl = res.proof_url;
        } catch {
          setActionError("Couldn't upload proof file.");
          return;
        }
      }
      if (!proofUrl) {
        setActionError("Please attach proof of payment before approving.");
        return;
      }
      runAction(() => adminApproveBooking(booking.id, { proof_url: proofUrl, proof_note: proofNote }));
    } else {
      runAction(() => adminApproveBooking(booking.id));
    }
  };

  const canApproveOffline = booking.payment_method === "offline" ? !!(proofFile || booking.proof_url) : true;

  return (
    <div className="space-y-6">
      <Link to="/admin" className="text-sm text-stone-500 hover:text-brand-600">
        ← Back to bookings
      </Link>

      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-semibold text-stone-900">{booking.client_name}</h1>
        <StatusBadge status={booking.status} />
        {booking.conflict_flag && (
          <span className="rounded-full bg-red-100 px-2.5 py-1 text-xs font-medium text-red-700">conflict</span>
        )}
        <Link to={`/admin/clients/${booking.client_id}`} className="text-sm text-brand-600 underline">
          View client history
        </Link>
      </div>

      <Card className="space-y-2 text-sm">
        <p>
          <span className="text-stone-500">When: </span>
          {formatDateTime(booking.requested_start_time)} – {formatDateTime(booking.service_end_time)}
        </p>
        <p className="text-xs text-stone-400">Buffer clears at {formatDateTime(booking.calendar_blocked_until)}</p>
        <p>
          <span className="text-stone-500">Contact: </span>
          {booking.client_email} · {booking.client_phone}
        </p>
        <ul className="list-disc pl-5">
          {booking.items.map((item, i) => (
            <li key={i}>
              {item.name_snapshot} — {money(item.price_snapshot)} ({item.duration_snapshot} min)
            </li>
          ))}
        </ul>
        <div className="flex gap-6 pt-1">
          <span>
            <span className="text-stone-500">Total: </span>
            {money(booking.total_price)}
          </span>
          <span>
            <span className="text-stone-500">Due today: </span>
            {money(booking.amount_due_today)}
          </span>
          <span className="text-stone-500">({booking.payment_method})</span>
        </div>
        {booking.full_payment_required && <InfoBanner>High-risk client — full payment required upfront.</InfoBanner>}
      </Card>

      <ErrorBanner message={actionError} />

      {booking.status === "pending" && (
        <Card className="space-y-3">
          <h2 className="font-medium text-stone-900">Review this request</h2>

          {booking.payment_method === "offline" && (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-stone-700">Proof of payment</label>
              {booking.proof_url ? (
                <p className="text-sm text-emerald-700">Proof attached ✓</p>
              ) : (
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={(e) => setProofFile(e.target.files?.[0] || null)}
                />
              )}
              <input
                className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
                placeholder="Note (optional)"
                value={proofNote}
                onChange={(e) => setProofNote(e.target.value)}
              />
            </div>
          )}

          <div className="flex flex-wrap gap-3">
            <PrimaryButton disabled={busy || !canApproveOffline} onClick={handleApprove}>
              Approve
            </PrimaryButton>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              className="flex-1 rounded-lg border border-stone-300 px-3 py-2 text-sm"
              placeholder="Decline reason (optional)"
              value={declineReason}
              onChange={(e) => setDeclineReason(e.target.value)}
            />
            <SecondaryButton
              disabled={busy}
              onClick={() => runAction(() => adminDeclineBooking(booking.id, declineReason))}
              className="border-red-200 text-red-600 hover:bg-red-50"
            >
              Decline
            </SecondaryButton>
          </div>
        </Card>
      )}

      {(booking.status === "approved" || booking.status === "manually_approved") && (
        <Card className="space-y-3">
          <h2 className="font-medium text-stone-900">Arrival</h2>
          {booking.arrival_status !== "none" ? (
            <p className="text-sm text-stone-600">
              Marked <strong>{booking.arrival_status.replace("_", " ")}</strong>
              {booking.arrival_note && ` — ${booking.arrival_note}`}
            </p>
          ) : (
            <div className="space-y-2">
              <div className="flex gap-3">
                <PrimaryButton disabled={busy} onClick={() => runAction(() => adminMarkArrival(booking.id, "arrived"))}>
                  Mark arrived
                </PrimaryButton>
              </div>
              <div className="flex items-center gap-2">
                <input
                  className="flex-1 rounded-lg border border-stone-300 px-3 py-2 text-sm"
                  placeholder="Note (required for no-show)"
                  value={noShowNote}
                  onChange={(e) => setNoShowNote(e.target.value)}
                />
                <SecondaryButton
                  disabled={busy || !noShowNote}
                  onClick={() => runAction(() => adminMarkArrival(booking.id, "no_show", noShowNote))}
                  className="border-red-200 text-red-600 hover:bg-red-50"
                >
                  Mark no-show
                </SecondaryButton>
              </div>
            </div>
          )}
        </Card>
      )}

      {booking.status === "payment_failed" && (
        <Card className="space-y-3 border-red-200 bg-red-50">
          <h2 className="font-medium text-red-900">Payment failed</h2>
          <p className="text-sm text-red-700">
            The card charge failed at approval. If payment was collected off-platform, log it here to manually
            approve.
          </p>
          <div className="flex items-center gap-2">
            <input
              className="flex-1 rounded-lg border border-stone-300 px-3 py-2 text-sm"
              placeholder="Note (required)"
              value={overrideNote}
              onChange={(e) => setOverrideNote(e.target.value)}
            />
            <PrimaryButton
              disabled={busy || !overrideNote}
              onClick={() => runAction(() => adminManualOverride(booking.id, overrideNote))}
            >
              Manually approve
            </PrimaryButton>
          </div>
        </Card>
      )}

      {booking.decline_reason && (
        <Card>
          <p className="text-sm text-stone-500">Decline reason</p>
          <p className="text-sm text-stone-800">{booking.decline_reason}</p>
        </Card>
      )}
    </div>
  );
}
