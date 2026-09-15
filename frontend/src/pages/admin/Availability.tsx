import { useEffect, useState } from "react";
import {
  adminListRecurringAvailability,
  adminBulkSetRecurringAvailability,
  adminBlockDay,
} from "../../api/endpoints";
import type { AvailabilityRecurringRule } from "../../api/types";
import { ApiRequestError } from "../../api/client";
import { errorMessage } from "../../lib/errors";
import { Card, ErrorBanner, InfoBanner, PrimaryButton, SecondaryButton, Spinner } from "../../components/Shared";

const WEEKDAYS = [
  { value: 0, label: "Monday" },
  { value: 1, label: "Tuesday" },
  { value: 2, label: "Wednesday" },
  { value: 3, label: "Thursday" },
  { value: 4, label: "Friday" },
  { value: 5, label: "Saturday" },
  { value: 6, label: "Sunday" },
];

interface DayRow {
  enabled: boolean;
  start_time: string;
  end_time: string;
}

export default function Availability() {
  const [rows, setRows] = useState<Record<number, DayRow> | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const [blockDate, setBlockDate] = useState("");
  const [blockReason, setBlockReason] = useState("");
  const [blockResult, setBlockResult] = useState<string | null>(null);
  const [blockError, setBlockError] = useState<string | null>(null);

  useEffect(() => {
    adminListRecurringAvailability()
      .then((rules) => {
        const base: Record<number, DayRow> = {};
        for (const wd of WEEKDAYS) base[wd.value] = { enabled: false, start_time: "09:00", end_time: "17:00" };
        for (const rule of rules) {
          base[rule.weekday] = {
            enabled: true,
            start_time: rule.start_time.slice(0, 5),
            end_time: rule.end_time.slice(0, 5),
          };
        }
        setRows(base);
      })
      .catch(() => setError("Couldn't load availability."));
  }, []);

  const handleSave = async () => {
    if (!rows) return;
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const payload: AvailabilityRecurringRule[] = WEEKDAYS.filter((wd) => rows[wd.value].enabled).map((wd) => ({
        weekday: wd.value,
        start_time: `${rows[wd.value].start_time}:00`,
        end_time: `${rows[wd.value].end_time}:00`,
      }));
      await adminBulkSetRecurringAvailability(payload);
      setSaved(true);
    } catch (err) {
      setError(err instanceof ApiRequestError ? errorMessage(err.code, err.message) : "Couldn't save availability.");
    } finally {
      setSaving(false);
    }
  };

  const handleBlockDay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!blockDate) return;
    setBlockError(null);
    setBlockResult(null);
    try {
      const res = await adminBlockDay(blockDate, blockReason);
      setBlockResult(
        res.conflicts.length > 0
          ? `Day blocked. ${res.conflicts.length} existing booking(s) flagged in the resolution queue.`
          : "Day blocked. No existing bookings were affected."
      );
      setBlockDate("");
      setBlockReason("");
    } catch (err) {
      setBlockError(err instanceof ApiRequestError ? errorMessage(err.code, err.message) : "Couldn't block that day.");
    }
  };

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold text-stone-900">Availability</h1>

      <Card className="space-y-4">
        <h2 className="font-medium text-stone-900">Weekly hours</h2>
        <p className="text-sm text-stone-500">
          Saving replaces the entire weekly schedule — days you turn off are removed.
        </p>
        {!rows && <Spinner />}
        {rows && (
          <div className="space-y-2">
            {WEEKDAYS.map((wd) => (
              <div key={wd.value} className="flex items-center gap-3">
                <label className="flex w-28 items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={rows[wd.value].enabled}
                    onChange={(e) =>
                      setRows({ ...rows, [wd.value]: { ...rows[wd.value], enabled: e.target.checked } })
                    }
                  />
                  {wd.label}
                </label>
                <input
                  type="time"
                  disabled={!rows[wd.value].enabled}
                  value={rows[wd.value].start_time}
                  onChange={(e) =>
                    setRows({ ...rows, [wd.value]: { ...rows[wd.value], start_time: e.target.value } })
                  }
                  className="rounded-lg border border-stone-300 px-2 py-1 text-sm disabled:opacity-40"
                />
                <span className="text-stone-400">to</span>
                <input
                  type="time"
                  disabled={!rows[wd.value].enabled}
                  value={rows[wd.value].end_time}
                  onChange={(e) => setRows({ ...rows, [wd.value]: { ...rows[wd.value], end_time: e.target.value } })}
                  className="rounded-lg border border-stone-300 px-2 py-1 text-sm disabled:opacity-40"
                />
              </div>
            ))}
          </div>
        )}
        <ErrorBanner message={error} />
        {saved && <InfoBanner>Weekly hours saved.</InfoBanner>}
        <PrimaryButton disabled={saving || !rows} onClick={handleSave}>
          {saving ? "Saving…" : "Save weekly hours"}
        </PrimaryButton>
      </Card>

      <Card className="space-y-4">
        <h2 className="font-medium text-stone-900">Block a day off</h2>
        <p className="text-sm text-stone-500">
          Blocks immediately. Any already-approved bookings that day are flagged in the resolution queue on the
          Bookings page.
        </p>
        <form onSubmit={handleBlockDay} className="flex flex-wrap items-end gap-3">
          <div>
            <label className="mb-1 block text-xs text-stone-500">Date</label>
            <input
              type="date"
              required
              value={blockDate}
              onChange={(e) => setBlockDate(e.target.value)}
              className="rounded-lg border border-stone-300 px-3 py-2 text-sm"
            />
          </div>
          <div className="flex-1">
            <label className="mb-1 block text-xs text-stone-500">Reason (optional)</label>
            <input
              value={blockReason}
              onChange={(e) => setBlockReason(e.target.value)}
              className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
            />
          </div>
          <SecondaryButton type="submit">Block day</SecondaryButton>
        </form>
        <ErrorBanner message={blockError} />
        {blockResult && <InfoBanner>{blockResult}</InfoBanner>}
      </Card>
    </div>
  );
}
