import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { adminGetClient, adminClearHighRisk } from "../../api/endpoints";
import type { Client } from "../../api/types";
import { formatDate, formatDateTime } from "../../lib/timezone";
import { ApiRequestError } from "../../api/client";
import { errorMessage } from "../../lib/errors";
import { Card, ErrorBanner, InfoBanner, PrimaryButton, Spinner, StatusBadge } from "../../components/Shared";

export default function ClientDetail() {
  const { id } = useParams<{ id: string }>();
  const [client, setClient] = useState<Client | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  const load = () => {
    if (!id) return;
    adminGetClient(id)
      .then(setClient)
      .catch((err) => setError(err instanceof ApiRequestError ? errorMessage(err.code) : "Couldn't load client."));
  };

  useEffect(load, [id]);

  if (error) return <ErrorBanner message={error} />;
  if (!client) return <Spinner />;

  const handleClear = async () => {
    if (!id) return;
    setBusy(true);
    try {
      const updated = await adminClearHighRisk(id, note);
      setClient(updated);
      setNote("");
    } catch (err) {
      setError(err instanceof ApiRequestError ? errorMessage(err.code, err.message) : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <Link to="/admin" className="text-sm text-stone-500 hover:text-brand-600">
        ← Back to bookings
      </Link>

      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-semibold text-stone-900">{client.name}</h1>
        {client.high_risk_flag && (
          <span className="rounded-full bg-red-100 px-2.5 py-1 text-xs font-medium text-red-700">high risk</span>
        )}
      </div>

      <Card className="space-y-2 text-sm">
        <p>
          <span className="text-stone-500">Email: </span>
          {client.email}
        </p>
        <p>
          <span className="text-stone-500">Phone: </span>
          {client.phone}
        </p>
        <p>
          <span className="text-stone-500">Client since: </span>
          {formatDate(client.created_at)}
        </p>
        <div className="flex gap-6 pt-1">
          <span>
            <span className="text-stone-500">Strikes: </span>
            <strong>{client.strike_count}</strong>
          </span>
          <span>
            <span className="text-stone-500">Reschedules used (lifetime): </span>
            <strong>{client.reschedule_count_lifetime}</strong>
          </span>
        </div>
      </Card>

      {client.high_risk_flag && (
        <Card className="space-y-3 border-red-200 bg-red-50">
          <h2 className="font-medium text-red-900">High-risk flag</h2>
          <p className="text-sm text-red-700">
            This client must pay in full upfront for every future booking until the flag is manually cleared.
          </p>
          <div className="flex items-center gap-2">
            <input
              className="flex-1 rounded-lg border border-stone-300 px-3 py-2 text-sm"
              placeholder="Note (optional)"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
            <PrimaryButton disabled={busy} onClick={handleClear}>
              Clear high-risk flag
            </PrimaryButton>
          </div>
          {client.high_risk_cleared_note && (
            <p className="text-xs text-red-600">Last note: {client.high_risk_cleared_note}</p>
          )}
        </Card>
      )}

      {!client.high_risk_flag && client.strike_count > 0 && (
        <InfoBanner>This client has {client.strike_count} strike(s) but is not currently high-risk.</InfoBanner>
      )}

      <div>
        <h2 className="mb-3 font-medium text-stone-900">Booking history</h2>
        <div className="space-y-2">
          {client.bookings?.map((b) => (
            <Link key={b.id} to={`/admin/bookings/${b.id}`}>
              <Card className="flex items-center justify-between">
                <span className="text-sm text-stone-800">{formatDateTime(b.requested_start_time)}</span>
                <StatusBadge status={b.status} />
              </Card>
            </Link>
          ))}
          {client.bookings?.length === 0 && <p className="text-sm text-stone-400">No bookings yet.</p>}
        </div>
      </div>
    </div>
  );
}
