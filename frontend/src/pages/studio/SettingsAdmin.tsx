import { useState, type FormEvent } from "react";
import { Trash2 } from "lucide-react";
import type { Settings, WeekHours } from "../../data/types";
import { cn, shortDate } from "../../lib/format";
import { resetDemo, useStore } from "../../store/store";
import { addSpecialHours, removeSpecialHours, saveHours, saveSettings } from "../../store/studio";
import { useToast } from "../../ui/Toast";
import { Panel, SmallField, StudioTitle, inputCls } from "./StudioLayout";

const DAYS = [1, 2, 3, 4, 5, 6, 0];
const NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default function SettingsAdmin() {
  const s = useStore();
  const toast = useToast();
  const [hours, setHours] = useState<WeekHours>(s.hours);
  const [settings, setSettings] = useState<Settings>(s.settings);
  const [special, setSpecial] = useState({ date: "", label: "", closed: true, open: "10:00", close: "15:00" });

  const setDay = (d: number, v: { open: string; close: string } | null) => setHours({ ...hours, [d]: v });
  const num = (k: keyof Settings) => (e: { target: { value: string } }) => setSettings({ ...settings, [k]: Number(e.target.value) });

  const addSpecial = (e: FormEvent) => {
    e.preventDefault();
    addSpecialHours({ date: special.date, label: special.label || (special.closed ? "Closed" : "Special hours"), hours: special.closed ? null : { open: special.open, close: special.close } });
    setSpecial({ ...special, date: "", label: "" });
  };

  const outbox = [...s.outbox].sort((a, b) => b.sendAt.localeCompare(a.sendAt)).slice(0, 12);

  return (
    <>
      <StudioTitle title="Settings" />
      <div className="grid gap-6 xl:grid-cols-2">
        <Panel title="Working hours">
          <ul className="space-y-2">
            {DAYS.map((d) => {
              const h = hours[d];
              return (
                <li key={d} className="grid grid-cols-[6.5rem_auto_1fr] items-center gap-3 text-sm">
                  <span className="font-semibold">{NAMES[d]}</span>
                  <label className="inline-flex items-center gap-2 text-xs">
                    <input type="checkbox" checked={!!h} onChange={(e) => setDay(d, e.target.checked ? { open: "09:00", close: "18:00" } : null)} className="accent-ink" /> Open
                  </label>
                  {h ? (
                    <span className="flex items-center gap-2">
                      <input type="time" value={h.open} onChange={(e) => setDay(d, { ...h, open: e.target.value })} className={cn(inputCls, "w-auto")} aria-label={`${NAMES[d]} opens`} />
                      <span className="text-muted">to</span>
                      <input type="time" value={h.close} onChange={(e) => setDay(d, { ...h, close: e.target.value })} className={cn(inputCls, "w-auto")} aria-label={`${NAMES[d]} closes`} />
                    </span>
                  ) : (
                    <span className="text-muted">Closed</span>
                  )}
                </li>
              );
            })}
          </ul>
          <button
            onClick={() => {
              saveHours(hours);
              toast("Working hours saved");
            }}
            className="mt-5 min-h-10 rounded-full bg-ink px-5 text-sm font-semibold text-ivory"
          >
            Save hours
          </button>
        </Panel>

        <Panel title="Holidays & special hours">
          <form onSubmit={addSpecial} className="grid gap-3 sm:grid-cols-2">
            <SmallField label="Date">
              <input type="date" required value={special.date} onChange={(e) => setSpecial({ ...special, date: e.target.value })} className={inputCls} />
            </SmallField>
            <SmallField label="Label">
              <input value={special.label} onChange={(e) => setSpecial({ ...special, label: e.target.value })} className={inputCls} placeholder="e.g. Christmas Eve" />
            </SmallField>
            <label className="inline-flex items-center gap-2 text-sm sm:col-span-2">
              <input type="checkbox" checked={special.closed} onChange={(e) => setSpecial({ ...special, closed: e.target.checked })} className="accent-ink" /> Closed all day
            </label>
            {!special.closed ? (
              <>
                <SmallField label="Opens">
                  <input type="time" value={special.open} onChange={(e) => setSpecial({ ...special, open: e.target.value })} className={inputCls} />
                </SmallField>
                <SmallField label="Closes">
                  <input type="time" value={special.close} onChange={(e) => setSpecial({ ...special, close: e.target.value })} className={inputCls} />
                </SmallField>
              </>
            ) : null}
            <button className="min-h-10 rounded-full border border-ink text-sm font-semibold sm:col-span-2">Add date</button>
          </form>
          <ul className="mt-4 divide-y divide-line text-sm">
            {s.specialHours.map((h) => (
              <li key={h.id} className="flex items-center justify-between py-2">
                <span>
                  <strong>{shortDate(h.date)}</strong> · {h.label} · {h.hours ? `${h.hours.open}–${h.hours.close}` : "Closed"}
                </span>
                <button onClick={() => removeSpecialHours(h.id)} className="grid size-8 place-items-center rounded-full hover:bg-error-soft" aria-label={`Remove ${h.label}`}>
                  <Trash2 className="size-4" />
                </button>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel title="Booking rules & policies">
          <div className="grid gap-4 sm:grid-cols-2">
            <SmallField label="Free cancellation window (hours)">
              <input type="number" min={0} value={settings.cancellationHours} onChange={num("cancellationHours")} className={inputCls} />
            </SmallField>
            <SmallField label="Late arrival grace (minutes)">
              <input type="number" min={0} value={settings.lateMinutes} onChange={num("lateMinutes")} className={inputCls} />
            </SmallField>
            <SmallField label="Clean-up buffer between clients (min)">
              <input type="number" min={0} step={5} value={settings.bufferMinutes} onChange={num("bufferMinutes")} className={inputCls} />
            </SmallField>
            <SmallField label="Minimum notice to book (hours)">
              <input type="number" min={0} value={settings.leadHours} onChange={num("leadHours")} className={inputCls} />
            </SmallField>
            <SmallField label="Time slot interval (min)">
              <select value={settings.slotMinutes} onChange={num("slotMinutes")} className={inputCls}>
                {[15, 30, 60].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </SmallField>
            <SmallField label="Book up to (days ahead)">
              <input type="number" min={7} value={settings.bookingWindowDays} onChange={num("bookingWindowDays")} className={inputCls} />
            </SmallField>
            <label className="inline-flex items-center gap-2 text-sm sm:col-span-2">
              <input type="checkbox" checked={settings.allowFullPayment} onChange={(e) => setSettings({ ...settings, allowFullPayment: e.target.checked })} className="accent-ink" /> Let clients pay in full online
            </label>
          </div>
          <p className="mt-3 text-xs text-muted">The policies page and checkout copy update automatically from these values.</p>
          <button
            onClick={() => {
              saveSettings(settings);
              toast("Booking rules saved");
            }}
            className="mt-5 min-h-10 rounded-full bg-ink px-5 text-sm font-semibold text-ivory"
          >
            Save rules
          </button>
        </Panel>

        <Panel title="Notifications & reminders">
          <p className="text-sm text-muted">Every booking queues a confirmation plus reminders 24 hours and 2 hours before. Most recent:</p>
          {outbox.length ? (
            <ul className="mt-3 divide-y divide-line text-sm">
              {outbox.map((m) => (
                <li key={m.id} className="flex justify-between gap-3 py-2">
                  <span className="min-w-0 truncate">
                    <span className="font-semibold">{m.subject}</span> <span className="text-muted">→ {m.to}</span>
                  </span>
                  <span className="shrink-0 text-xs text-muted">{new Date(m.sendAt) > new Date() ? `scheduled ${shortDate(m.sendAt.slice(0, 10))}` : "sent"}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-muted">No messages yet. Make a booking on the site to see them here.</p>
          )}
        </Panel>

        <Panel title="Demo data" className="xl:col-span-2">
          <p className="text-sm text-muted">This preview stores everything in your browser. Reset to restore the sample salon, bookings and accounts.</p>
          <button
            onClick={() => {
              if (confirm("Reset all demo data? Bookings and changes made in this browser will be lost.")) {
                resetDemo();
                location.assign("/studio/login");
              }
            }}
            className="mt-4 min-h-10 rounded-full border border-error px-5 text-sm font-semibold text-error"
          >
            Reset demo data
          </button>
        </Panel>
      </div>
    </>
  );
}
