import { useState, type FormEvent } from "react";
import { addDays, addMonths, eachDayOfInterval, endOfMonth, endOfWeek, format, isSameMonth, startOfMonth, startOfWeek } from "date-fns";
import { Ban, ChevronLeft, ChevronRight, Trash2 } from "lucide-react";
import type { Appointment, AppointmentStatus } from "../../data/types";
import { salonHoursOn } from "../../lib/availability";
import { clock, cn, dateKey, fromMinutes, parseDateKey, shortDate, toMinutes } from "../../lib/format";
import { useStore } from "../../store/store";
import { addBlock, removeBlock } from "../../store/studio";
import { STATUS_LABEL } from "../../ui/bits";
import Modal from "../../ui/Modal";
import { AppointmentDrawer } from "./Operations";
import { Panel, SmallField, StudioTitle, inputCls } from "./StudioLayout";

const START = 8 * 60;
const END = 21 * 60;
const PX_PER_MIN = 1.1;

const STATUS_BAR: Record<AppointmentStatus, string> = {
  pending: "border-warning bg-warning-soft",
  confirmed: "border-success bg-success-soft",
  "checked-in": "border-gold-deep bg-gold-soft",
  "in-progress": "border-rose-deep bg-rose-soft",
  completed: "border-muted bg-sand",
  cancelled: "border-error bg-error-soft opacity-60",
  "no-show": "border-error bg-error-soft",
};

type View = "day" | "week" | "month";

export default function CalendarAdmin() {
  const s = useStore();
  const [view, setView] = useState<View>("week");
  const [cursor, setCursor] = useState(new Date());
  const [stylist, setStylist] = useState("all");
  const [open, setOpen] = useState<Appointment | null>(null);
  const [blocking, setBlocking] = useState(false);
  const [showCancelled, setShowCancelled] = useState(false);

  const staff = s.stylists.filter((st) => st.active && (stylist === "all" || st.id === stylist));
  const visible = (a: Appointment) => (showCancelled || a.status !== "cancelled") && staff.some((st) => st.id === a.stylistId);

  const step = (dir: 1 | -1) => setCursor((c) => (view === "day" ? addDays(c, dir) : view === "week" ? addDays(c, 7 * dir) : addMonths(c, dir)));
  const days = view === "day" ? [cursor] : eachDayOfInterval({ start: startOfWeek(cursor, { weekStartsOn: 1 }), end: endOfWeek(cursor, { weekStartsOn: 1 }) });
  const title =
    view === "day" ? format(cursor, "EEEE, MMMM d") : view === "week" ? `${format(days[0], "MMM d")} – ${format(days[6], "MMM d, yyyy")}` : format(cursor, "MMMM yyyy");

  return (
    <>
      <StudioTitle
        title="Calendar"
        actions={
          <button onClick={() => setBlocking(true)} className="inline-flex min-h-10 items-center gap-2 rounded-full bg-ink px-4 text-sm font-semibold text-ivory">
            <Ban className="size-4" aria-hidden /> Block time
          </button>
        }
      />
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="inline-flex rounded-full bg-white p-1 ring-1 ring-line" role="tablist" aria-label="Calendar view">
          {(["day", "week", "month"] as const).map((v) => (
            <button key={v} role="tab" aria-selected={view === v} onClick={() => setView(v)} className={cn("min-h-9 rounded-full px-4 text-sm font-semibold capitalize", view === v ? "bg-ink text-ivory" : "")}>
              {v}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => step(-1)} className="grid size-9 place-items-center rounded-full bg-white ring-1 ring-line" aria-label="Previous">
            <ChevronLeft className="size-4" />
          </button>
          <button onClick={() => setCursor(new Date())} className="min-h-9 rounded-full bg-white px-4 text-sm font-semibold ring-1 ring-line">
            Today
          </button>
          <button onClick={() => step(1)} className="grid size-9 place-items-center rounded-full bg-white ring-1 ring-line" aria-label="Next">
            <ChevronRight className="size-4" />
          </button>
        </div>
        <h2 className="font-display text-2xl" aria-live="polite">
          {title}
        </h2>
        <div className="ml-auto flex items-center gap-3">
          <label className="flex items-center gap-2 text-xs">
            <input type="checkbox" checked={showCancelled} onChange={(e) => setShowCancelled(e.target.checked)} className="accent-ink" /> Show cancelled
          </label>
          <select value={stylist} onChange={(e) => setStylist(e.target.value)} className={cn(inputCls, "w-auto")} aria-label="Stylist">
            <option value="all">All stylists</option>
            {s.stylists.map((st) => (
              <option key={st.id} value={st.id}>
                {st.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {view === "month" ? (
        <MonthGrid cursor={cursor} visible={visible} onOpen={setOpen} onDay={(d) => { setCursor(d); setView("day"); }} />
      ) : (
        <TimeGrid days={days} staff={staff} visible={visible} onOpen={setOpen} />
      )}

      <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted" aria-label="Legend">
        {(Object.keys(STATUS_BAR) as AppointmentStatus[]).map((st) => (
          <span key={st} className="inline-flex items-center gap-1.5">
            <span className={cn("h-3 w-1.5 rounded-sm border-l-4", STATUS_BAR[st])} aria-hidden /> {STATUS_LABEL[st]}
          </span>
        ))}
        <span className="inline-flex items-center gap-1.5">
          <span className="h-3 w-4 rounded-sm bg-[repeating-linear-gradient(45deg,#dfd2c1_0_3px,transparent_3px_6px)]" aria-hidden /> Blocked
        </span>
      </div>

      <Panel title="Blocked time" className="mt-8">
        {s.blocks.length ? (
          <ul className="divide-y divide-line text-sm">
            {[...s.blocks]
              .sort((a, b) => a.date.localeCompare(b.date))
              .map((b) => (
                <li key={b.id} className="flex items-center justify-between gap-4 py-2.5">
                  <span>
                    <strong>{shortDate(b.date)}</strong> · {b.start ? `${clock(b.start)}–${clock(b.end!)}` : "All day"} · {b.stylistId ? s.stylists.find((x) => x.id === b.stylistId)?.name : "Whole studio"}
                    <span className="text-muted"> · {b.reason}</span>
                  </span>
                  <button onClick={() => removeBlock(b.id)} className="grid size-9 place-items-center rounded-full hover:bg-error-soft hover:text-error" aria-label={`Remove block on ${shortDate(b.date)}`}>
                    <Trash2 className="size-4" />
                  </button>
                </li>
              ))}
          </ul>
        ) : (
          <p className="text-sm text-muted">No blocked time.</p>
        )}
      </Panel>

      <AppointmentDrawer appt={open} onClose={() => setOpen(null)} />
      <BlockModal open={blocking} onClose={() => setBlocking(false)} defaultDate={dateKey(cursor)} />
    </>
  );
}

function TimeGrid({ days, staff, visible, onOpen }: { days: Date[]; staff: { id: string; name: string }[]; visible: (a: Appointment) => boolean; onOpen: (a: Appointment) => void }) {
  const s = useStore();
  const hours = Array.from({ length: (END - START) / 60 }, (_, i) => START + i * 60);
  const height = (END - START) * PX_PER_MIN;
  const lanes = Math.max(1, staff.length);
  const today = dateKey(new Date());
  const single = days.length === 1;
  return (
    <div className="overflow-x-auto rounded-2xl bg-white ring-1 ring-line/70">
      <div className="grid" style={{ gridTemplateColumns: `56px repeat(${days.length}, minmax(${days.length === 1 ? 160 * lanes : 130}px, 1fr))` }}>
        <div className="sticky left-0 z-10 border-b border-line bg-white" />
        {days.map((d) => (
          <div key={d.toISOString()} className={cn("border-b border-l border-line px-2 py-2 text-center text-xs", dateKey(d) === today && "bg-gold-soft/50")}>
            <span className="block font-semibold">{format(d, "EEE")}</span>
            <span className="font-display text-xl">{format(d, "d")}</span>
            {single ? (
              <span className="mt-1 grid gap-1 text-[0.65rem] text-muted" style={{ gridTemplateColumns: `repeat(${lanes}, 1fr)` }}>
                {staff.map((st) => (
                  <span key={st.id}>{st.name}</span>
                ))}
              </span>
            ) : null}
          </div>
        ))}
        <div className="sticky left-0 z-10 bg-white" style={{ height }}>
          {hours.map((h) => (
            <div key={h} className="relative text-right text-[0.65rem] text-muted" style={{ height: 60 * PX_PER_MIN }}>
              <span className="absolute -top-2 right-2">{clock(fromMinutes(h)).replace(":00", "")}</span>
            </div>
          ))}
        </div>
        {days.map((d) => {
          const key = dateKey(d);
          const open = salonHoursOn(s, key);
          const appts = s.appointments.filter((a) => a.date === key && visible(a));
          const layout = days.length === 1 ? stylistLanes(appts, staff) : packLanes(appts);
          const blocks = s.blocks.filter((b) => b.date === key && (b.stylistId === null || staff.some((st) => st.id === b.stylistId)));
          return (
            <div key={key} className="relative border-l border-line" style={{ height }}>
              {hours.map((h) => (
                <div key={h} className="border-b border-line/50" style={{ height: 60 * PX_PER_MIN }} />
              ))}
              {!open ? (
                <div className="absolute inset-0 grid place-items-center bg-[repeating-linear-gradient(45deg,#efe7dc_0_6px,transparent_6px_12px)] text-xs font-semibold text-muted">Closed</div>
              ) : (
                <>
                  <div className="absolute inset-x-0 top-0 bg-cream/80" style={{ height: Math.max(0, toMinutes(open.open) - START) * PX_PER_MIN }} aria-hidden />
                  <div className="absolute inset-x-0 bottom-0 bg-cream/80" style={{ top: (toMinutes(open.close) - START) * PX_PER_MIN }} aria-hidden />
                </>
              )}
              {blocks.map((b) => {
                const from = b.start ? toMinutes(b.start) : START;
                const to = b.end ? toMinutes(b.end) : END;
                const lane = single && b.stylistId ? staff.findIndex((st) => st.id === b.stylistId) : -1;
                return (
                  <div
                    key={b.id}
                    className="absolute grid place-items-center overflow-hidden rounded-md bg-[repeating-linear-gradient(45deg,#dfd2c1_0_4px,transparent_4px_9px)] text-[0.65rem] font-semibold text-ink-soft ring-1 ring-sand-deep"
                    style={{
                      top: (from - START) * PX_PER_MIN,
                      height: (to - from) * PX_PER_MIN,
                      left: lane >= 0 ? `${(lane / lanes) * 100}%` : 0,
                      width: lane >= 0 ? `${100 / lanes}%` : "100%",
                    }}
                    title={b.reason}
                  >
                    {b.reason}
                  </div>
                );
              })}
              {appts.map((a) => {
                const { lane, lanes } = layout.get(a.ref)!;
                const top = (toMinutes(a.time) - START) * PX_PER_MIN;
                const svc = s.services.find((x) => x.id === a.serviceId);
                return (
                  <button
                    key={a.ref}
                    onClick={() => onOpen(a)}
                    className={cn("absolute overflow-hidden rounded-md border-l-4 px-1.5 py-1 text-left text-[0.68rem] leading-tight shadow-sm transition hover:z-10 hover:shadow-md", STATUS_BAR[a.status])}
                    style={{ top, height: Math.max(26, a.minutes * PX_PER_MIN - 2), left: `calc(${(lane / lanes) * 100}% + 2px)`, width: `calc(${100 / lanes}% - 4px)` }}
                    aria-label={`${clock(a.time)} ${a.customer.firstName} ${a.customer.lastName}, ${svc?.name}, ${STATUS_LABEL[a.status]}`}
                  >
                    <span className="block font-semibold">
                      {clock(a.time)} {a.customer.firstName}
                    </span>
                    <span className="block truncate">{svc?.name}</span>
                    <span className="block truncate text-muted">
                      {s.stylists.find((x) => x.id === a.stylistId)?.name} · {STATUS_LABEL[a.status]}
                    </span>
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}

type Lanes = Map<string, { lane: number; lanes: number }>;

/** Day view: one fixed column per stylist. */
function stylistLanes(appts: Appointment[], staff: { id: string }[]): Lanes {
  const n = Math.max(1, staff.length);
  return new Map(appts.map((a) => [a.ref, { lane: Math.max(0, staff.findIndex((st) => st.id === a.stylistId)), lanes: n }]));
}

/** Week view: only overlapping appointments share the column, side by side. */
function packLanes(appts: Appointment[]): Lanes {
  const sorted = [...appts].sort((a, b) => a.time.localeCompare(b.time));
  const out: Lanes = new Map();
  let cluster: Appointment[] = [];
  let clusterEnd = -1;
  let ends: number[] = [];
  const flush = () => {
    for (const a of cluster) out.get(a.ref)!.lanes = ends.length;
    cluster = [];
    ends = [];
  };
  for (const a of sorted) {
    const start = toMinutes(a.time);
    if (start >= clusterEnd) flush();
    let lane = ends.findIndex((e) => e <= start);
    if (lane === -1) lane = ends.push(0) - 1;
    ends[lane] = start + a.minutes;
    out.set(a.ref, { lane, lanes: 1 });
    cluster.push(a);
    clusterEnd = Math.max(clusterEnd, start + a.minutes);
  }
  flush();
  return out;
}

function MonthGrid({ cursor, visible, onOpen, onDay }: { cursor: Date; visible: (a: Appointment) => boolean; onOpen: (a: Appointment) => void; onDay: (d: Date) => void }) {
  const s = useStore();
  const days = eachDayOfInterval({ start: startOfWeek(startOfMonth(cursor), { weekStartsOn: 1 }), end: endOfWeek(endOfMonth(cursor), { weekStartsOn: 1 }) });
  const today = dateKey(new Date());
  return (
    <div className="overflow-x-auto rounded-2xl bg-white ring-1 ring-line/70">
      <div className="grid min-w-[760px] grid-cols-7">
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
          <div key={d} className="border-b border-line px-3 py-2 text-xs font-semibold text-muted">
            {d}
          </div>
        ))}
        {days.map((d) => {
          const key = dateKey(d);
          const appts = s.appointments.filter((a) => a.date === key && visible(a)).sort((a, b) => a.time.localeCompare(b.time));
          const blocked = s.blocks.some((b) => b.date === key && !b.start && b.stylistId === null);
          const closed = !salonHoursOn(s, key);
          return (
            <div key={key} className={cn("min-h-28 border-b border-l border-line p-2", !isSameMonth(d, cursor) && "opacity-40", (closed || blocked) && "bg-cream/70")}>
              <button onClick={() => onDay(d)} className={cn("mb-1 grid size-7 place-items-center rounded-full text-xs font-semibold hover:bg-sand", key === today && "bg-ink text-ivory hover:bg-ink")}>
                {format(d, "d")}
              </button>
              {blocked ? <p className="text-[0.65rem] font-semibold text-muted">Blocked</p> : closed ? <p className="text-[0.65rem] text-muted">Closed</p> : null}
              {appts.slice(0, 3).map((a) => (
                <button key={a.ref} onClick={() => onOpen(a)} className={cn("mb-1 block w-full truncate rounded border-l-3 px-1.5 py-0.5 text-left text-[0.65rem]", STATUS_BAR[a.status])}>
                  {clock(a.time).replace(":00", "")} {a.customer.firstName}
                </button>
              ))}
              {appts.length > 3 ? (
                <button onClick={() => onDay(d)} className="text-[0.65rem] font-semibold text-gold-deep">
                  +{appts.length - 3} more
                </button>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function BlockModal({ open, onClose, defaultDate }: { open: boolean; onClose: () => void; defaultDate: string }) {
  const s = useStore();
  const [date, setDate] = useState(defaultDate);
  const [allDay, setAllDay] = useState(false);
  const [start, setStart] = useState("12:00");
  const [end, setEnd] = useState("13:00");
  const [who, setWho] = useState("all");
  const [reason, setReason] = useState("Lunch");
  const [error, setError] = useState("");
  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!allDay && toMinutes(end) <= toMinutes(start)) {
      setError("End time must be after start time.");
      return;
    }
    addBlock({ date, stylistId: who === "all" ? null : who, start: allDay ? undefined : start, end: allDay ? undefined : end, reason: reason || "Unavailable" });
    onClose();
  };
  const clashes = s.appointments.filter(
    (a) =>
      a.date === date &&
      (a.status === "confirmed" || a.status === "pending") &&
      (who === "all" || a.stylistId === who) &&
      (allDay || (toMinutes(a.time) < toMinutes(end) && toMinutes(a.time) + a.minutes > toMinutes(start))),
  );
  return (
    <Modal open={open} onClose={onClose} title="Block time">
      <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
        <SmallField label="Date">
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputCls} required />
        </SmallField>
        <SmallField label="Who">
          <select value={who} onChange={(e) => setWho(e.target.value)} className={inputCls}>
            <option value="all">Whole studio</option>
            {s.stylists.map((st) => (
              <option key={st.id} value={st.id}>
                {st.name}
              </option>
            ))}
          </select>
        </SmallField>
        <label className="flex items-center gap-2 text-sm sm:col-span-2">
          <input type="checkbox" checked={allDay} onChange={(e) => setAllDay(e.target.checked)} className="accent-ink" /> All day ({format(parseDateKey(date), "EEEE")})
        </label>
        {!allDay ? (
          <>
            <SmallField label="From">
              <input type="time" step={1800} value={start} onChange={(e) => setStart(e.target.value)} className={inputCls} />
            </SmallField>
            <SmallField label="To">
              <input type="time" step={1800} value={end} onChange={(e) => setEnd(e.target.value)} className={inputCls} />
            </SmallField>
          </>
        ) : null}
        <SmallField label="Reason" className="sm:col-span-2">
          <input value={reason} onChange={(e) => setReason(e.target.value)} className={inputCls} placeholder="Lunch, holiday, training…" />
        </SmallField>
        {clashes.length ? (
          <p className="rounded-xl bg-warning-soft p-3 text-sm text-warning sm:col-span-2">
            {clashes.length} existing appointment{clashes.length > 1 ? "s" : ""} fall in this window and will not be moved automatically. Reach out to reschedule them.
          </p>
        ) : null}
        {error ? <p className="text-sm text-error sm:col-span-2">{error}</p> : null}
        <button className="min-h-11 rounded-full bg-ink text-sm font-semibold text-ivory sm:col-span-2">Block time</button>
      </form>
    </Modal>
  );
}
