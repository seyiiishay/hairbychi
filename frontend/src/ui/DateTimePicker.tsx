import { useEffect, useState, type FormEvent } from "react";
import { addDays, startOfMonth } from "date-fns";
import { BellRing, CalendarSearch } from "lucide-react";
import type { Service } from "../data/types";
import { dayStatus, nextAvailable, slotsOn, type Slot } from "../lib/availability";
import { clock, cn, dateKey, longDate, monthDay, parseDateKey, toMinutes, uid } from "../lib/format";
import { currentUser, joinWaitlist, useStore } from "../store/store";
import { Button } from "./Button";
import Calendar from "./Calendar";
import { Choices, Input } from "./form";
import Modal from "./Modal";
import { Skeleton } from "./bits";
import { useToast } from "./Toast";

export interface PickedSlot {
  date: string;
  time: string;
  stylistId: string;
}

const PERIODS = [
  { id: "morning", label: "Morning", test: (m: number) => m < 12 * 60 },
  { id: "afternoon", label: "Afternoon", test: (m: number) => m >= 12 * 60 && m < 17 * 60 },
  { id: "evening", label: "Evening", test: (m: number) => m >= 17 * 60 },
];

export default function DateTimePicker({
  service,
  stylistId,
  minutes,
  value,
  onChange,
  ignoreRef,
  initialDate,
}: {
  service: Service;
  stylistId: string | "any";
  minutes: number;
  value: PickedSlot | null;
  onChange: (v: PickedSlot | null) => void;
  ignoreRef?: string;
  initialDate?: string;
}) {
  const s = useStore();
  const today = new Date();
  const [date, setDate] = useState<string | undefined>(value?.date ?? initialDate);
  const [month, setMonth] = useState(startOfMonth(parseDateKey(value?.date ?? initialDate ?? dateKey(today))));
  const [loading, setLoading] = useState(false);
  const [waitlistOpen, setWaitlistOpen] = useState(false);

  // Brief, intentional "finding times" state: availability would come from the server
  useEffect(() => {
    if (!date) return;
    setLoading(true);
    const t = setTimeout(() => setLoading(false), 450);
    return () => clearTimeout(t);
  }, [date, stylistId, minutes]);

  const statusOf = (key: string) => dayStatus(s, service, stylistId, key, minutes);

  const slots: Slot[] = date ? slotsOn(s, service, stylistId, date, minutes, { ignoreRef }) : [];
  const next = date && !slots.length ? nextAvailable(s, service, stylistId, date, minutes) : null;
  const staffName = (id: string) => s.stylists.find((x) => x.id === id)?.name ?? "";

  const pickDate = (key: string) => {
    setDate(key);
    onChange(null);
  };

  return (
    <div className="grid gap-8 xl:grid-cols-[1.05fr_0.95fr]">
      <div className="rounded-[var(--radius-card)] bg-white/70 p-5 ring-1 ring-line md:p-6">
        <Calendar
          month={month}
          onMonthChange={setMonth}
          selected={date}
          onSelect={pickDate}
          statusOf={statusOf}
          minMonth={today}
          maxMonth={addDays(today, s.settings.bookingWindowDays)}
        />
      </div>

      <div aria-live="polite">
        {!date ? (
          <div className="flex h-full min-h-60 flex-col items-center justify-center rounded-[var(--radius-card)] border border-dashed border-sand-deep p-8 text-center">
            <CalendarSearch className="size-8 text-gold-deep" strokeWidth={1.3} aria-hidden />
            <p className="mt-4 font-display text-2xl">Choose a date to see times</p>
            <p className="mt-1 text-sm text-muted">Dates with availability are shown in bold.</p>
          </div>
        ) : loading ? (
          <div>
            <p className="mb-4 text-sm text-muted">Finding available appointments…</p>
            <div className="grid grid-cols-3 gap-2.5">
              {Array.from({ length: 9 }, (_, i) => (
                <Skeleton key={i} className="h-12" />
              ))}
            </div>
          </div>
        ) : slots.length ? (
          <div>
            <h3 className="text-3xl">Available times</h3>
            <p className="mt-1 mb-5 text-sm text-muted">{longDate(date)}</p>
            {PERIODS.map((p) => {
              const list = slots.filter((sl) => p.test(toMinutes(sl.time)));
              if (!list.length) return null;
              return (
                <fieldset key={p.id} className="mb-5">
                  <legend className="mb-2.5 text-xs font-semibold tracking-[0.2em] text-muted uppercase">{p.label}</legend>
                  <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4 xl:grid-cols-3">
                    {list.map((sl) => {
                      const on = value?.date === date && value.time === sl.time;
                      return (
                        <button
                          key={sl.time}
                          type="button"
                          aria-pressed={on}
                          onClick={() => onChange({ date, time: sl.time, stylistId: sl.stylistId })}
                          className={cn(
                            "flex min-h-12 flex-col items-center justify-center rounded-xl px-2 py-2 text-sm font-semibold ring-1 transition",
                            on ? "bg-ink text-ivory ring-ink" : "bg-white ring-line hover:ring-ink",
                          )}
                        >
                          {clock(sl.time)}
                          {stylistId === "any" ? <span className={cn("text-[0.68rem] font-normal", on ? "text-ivory/70" : "text-muted")}>with {staffName(sl.stylistId)}</span> : null}
                        </button>
                      );
                    })}
                  </div>
                </fieldset>
              );
            })}
          </div>
        ) : (
          <div className="rounded-[var(--radius-card)] bg-cream p-6 text-center ring-1 ring-line md:p-8">
            <p className="font-display text-3xl">{statusOf(date) === "full" ? `${monthDay(date)} is fully booked` : "No appointments are available on this date."}</p>
            <p className="mt-2 text-sm text-muted">
              {next ? `The next opening is ${longDate(next.date)} at ${clock(next.slots[0].time)}.` : "We couldn't find an opening in the booking window."}
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
              {next ? (
                <Button
                  onClick={() => {
                    setMonth(startOfMonth(parseDateKey(next.date)));
                    pickDate(next.date);
                  }}
                  arrow
                >
                  View next available date
                </Button>
              ) : null}
              <Button variant="secondary" onClick={() => setWaitlistOpen(true)}>
                <BellRing className="size-4" aria-hidden /> Join waitlist
              </Button>
            </div>
          </div>
        )}
      </div>

      {date ? <WaitlistModal open={waitlistOpen} onClose={() => setWaitlistOpen(false)} service={service} stylistId={stylistId} date={date} /> : null}
    </div>
  );
}

export function WaitlistModal({
  open,
  onClose,
  service,
  stylistId,
  date,
}: {
  open: boolean;
  onClose: () => void;
  service: Service;
  stylistId: string | "any";
  date: string;
}) {
  const s = useStore();
  const user = currentUser(s);
  const toast = useToast();
  const [name, setName] = useState(user ? `${user.firstName} ${user.lastName}` : "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [range, setRange] = useState<"any" | "morning" | "afternoon" | "evening">("any");
  const submit = (e: FormEvent) => {
    e.preventDefault();
    joinWaitlist({
      id: uid("w-"),
      serviceId: service.id,
      stylistId: stylistId === "any" ? null : stylistId,
      date,
      timeRange: range,
      name,
      email,
      createdAt: new Date().toISOString(),
      notified: false,
    });
    toast("You're on the waitlist");
    onClose();
  };
  return (
    <Modal open={open} onClose={onClose} title="Join the waitlist">
      <p className="text-sm leading-relaxed text-muted">
        We'll email you the moment a {service.name} appointment opens on {longDate(date)}
        {stylistId !== "any" ? ` with ${s.stylists.find((x) => x.id === stylistId)?.name}` : ""}.
      </p>
      <form onSubmit={submit} className="mt-6 flex flex-col gap-5">
        <Input label="Full name" required value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
        <Input label="Email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
        <Choices
          legend="Preferred time"
          value={range}
          onChange={setRange}
          options={[
            { value: "any", label: "Any time" },
            { value: "morning", label: "Morning" },
            { value: "afternoon", label: "Afternoon" },
            { value: "evening", label: "Evening" },
          ]}
        />
        <Button type="submit" size="lg">
          Notify me
        </Button>
      </form>
    </Modal>
  );
}
