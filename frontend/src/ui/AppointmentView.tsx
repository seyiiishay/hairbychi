import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { CalendarPlus, Clock, MapPin, Navigation, RotateCcw, Star, User as UserIcon } from "lucide-react";
import { SALON } from "../data/catalog";
import type { Appointment } from "../data/types";
import { isSlotFree } from "../lib/availability";
import { downloadIcs } from "../lib/calendarFile";
import { clock, cn, duration, longDate, money, uid } from "../lib/format";
import { cancellationOutcome } from "../lib/pricing";
import { ACTIVE_STATUSES, addReview, cancelAppointment, getState, rescheduleAppointment, useStore } from "../store/store";
import { Button, ButtonLink } from "./Button";
import DateTimePicker, { type PickedSlot } from "./DateTimePicker";
import { Checkbox, Textarea } from "./form";
import Modal from "./Modal";
import Photo from "./Photo";
import { StatusBadge } from "./bits";
import { useToast } from "./Toast";

export default function AppointmentView({ appt }: { appt: Appointment }) {
  const s = useStore();
  const toast = useToast();
  const svc = s.services.find((x) => x.id === appt.serviceId)!;
  const stylist = s.stylists.find((x) => x.id === appt.stylistId);
  const addOns = s.addOns.filter((a) => appt.addOnIds.includes(a.id));
  const upcoming = ACTIVE_STATUSES.includes(appt.status);
  const [mode, setMode] = useState<null | "reschedule" | "cancel" | "review">(null);

  return (
    <article className="overflow-hidden rounded-[1.75rem] bg-white/80 ring-1 ring-line">
      <div className="grid md:grid-cols-[240px_1fr]">
        <Photo art={svc.art} tone={svc.tone} path={`services/${svc.id}`} src={svc.image} alt={svc.name} className="aspect-[16/9] md:aspect-auto md:h-full" />
        <div className="p-6 md:p-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <StatusBadge status={appt.status} />
            <span className="font-mono text-xs tracking-widest text-muted">{appt.ref}</span>
          </div>
          <h2 className="mt-4 text-4xl leading-tight">{svc.name}</h2>
          <ul className="mt-4 grid gap-2.5 text-[0.95rem] sm:grid-cols-2">
            <li className="flex items-center gap-2.5">
              <Clock className="size-4 text-gold-deep" aria-hidden />
              {longDate(appt.date)}, {clock(appt.time)}
            </li>
            <li className="flex items-center gap-2.5">
              <UserIcon className="size-4 text-gold-deep" aria-hidden /> Stylist: {stylist?.name}
            </li>
            <li className="flex items-center gap-2.5">
              <RotateCcw className="size-4 text-gold-deep" aria-hidden /> About {duration(appt.minutes, true)}
            </li>
            <li className="flex items-center gap-2.5">
              <MapPin className="size-4 text-gold-deep" aria-hidden /> {SALON.addressShort}
            </li>
          </ul>

          <dl className="mt-6 space-y-1.5 border-t border-line pt-4 text-sm">
            <div className="flex justify-between">
              <dt>Service</dt>
              <dd>{money(svc.price)}</dd>
            </div>
            {addOns.map((a) => (
              <div key={a.id} className="flex justify-between text-muted">
                <dt>{a.name}</dt>
                <dd>+{money(a.price)}</dd>
              </div>
            ))}
            {appt.discount ? (
              <div className="flex justify-between text-success">
                <dt>Discount {appt.discountCode}</dt>
                <dd>−{money(appt.discount)}</dd>
              </div>
            ) : null}
            <div className="flex justify-between font-semibold">
              <dt>Total</dt>
              <dd>{money(appt.total)}</dd>
            </div>
            <div className="flex justify-between text-muted">
              <dt>Paid</dt>
              <dd>{money(appt.paid)}</dd>
            </div>
            {appt.refunded ? (
              <div className="flex justify-between text-muted">
                <dt>Refunded</dt>
                <dd>{money(appt.refunded)}</dd>
              </div>
            ) : null}
            {upcoming ? (
              <div className="flex justify-between font-semibold text-gold-deep">
                <dt>Remaining at appointment</dt>
                <dd>{money(appt.total - appt.paid)}</dd>
              </div>
            ) : null}
          </dl>

          <div className="mt-6 flex flex-wrap gap-2.5">
            {upcoming ? (
              <>
                <Button size="sm" onClick={() => setMode("reschedule")}>
                  Reschedule
                </Button>
                <Button size="sm" variant="secondary" onClick={() => setMode("cancel")}>
                  Cancel
                </Button>
                <Button size="sm" variant="secondary" onClick={() => downloadIcs(appt, svc.name)}>
                  <CalendarPlus className="size-4" aria-hidden /> Add to Calendar
                </Button>
                <a href={SALON.mapsUrl} target="_blank" rel="noreferrer" className="inline-flex min-h-9 items-center gap-2 rounded-full border border-ink/80 px-4 text-[0.8rem] font-semibold hover:bg-ink hover:text-ivory">
                  <Navigation className="size-4" aria-hidden /> Directions
                </a>
              </>
            ) : (
              <>
                {appt.status === "completed" && !appt.reviewed ? (
                  <Button size="sm" onClick={() => setMode("review")}>
                    <Star className="size-4" aria-hidden /> Leave a review
                  </Button>
                ) : null}
                <ButtonLink size="sm" variant={appt.status === "completed" && !appt.reviewed ? "secondary" : "primary"} to={`/book?service=${svc.id}&stylist=${appt.stylistId}`}>
                  Book again
                </ButtonLink>
              </>
            )}
          </div>
          {appt.notes ? <p className="mt-5 rounded-xl bg-cream p-3 text-sm text-ink-soft">Your note: “{appt.notes}”</p> : null}
        </div>
      </div>

      {mode === "reschedule" ? (
        <RescheduleModal appt={appt} onClose={() => setMode(null)} onDone={() => toast("Your appointment has been moved")} />
      ) : null}
      {mode === "cancel" ? <CancelModal appt={appt} onClose={() => setMode(null)} onDone={() => toast("Your appointment has been cancelled")} /> : null}
      {mode === "review" ? <ReviewModal appt={appt} onClose={() => setMode(null)} onDone={() => toast("Thank you for your review")} /> : null}
    </article>
  );
}

function RescheduleModal({ appt, onClose, onDone }: { appt: Appointment; onClose: () => void; onDone: () => void }) {
  const s = useStore();
  const svc = s.services.find((x) => x.id === appt.serviceId)!;
  const [slot, setSlot] = useState<PickedSlot | null>(null);
  const [anyStylist, setAnyStylist] = useState(false);
  const [error, setError] = useState("");
  const late = cancellationOutcome(s, appt).late;
  const confirm = () => {
    if (!slot) return;
    if (!isSlotFree(getState(), svc, { ...slot, minutes: appt.minutes }, appt.ref)) {
      setError("That time was just booked by another client. Please choose another.");
      setSlot(null);
      return;
    }
    rescheduleAppointment(appt.ref, slot.date, slot.time, slot.stylistId);
    onDone();
    onClose();
  };
  return (
    <Modal open onClose={onClose} title="Reschedule appointment" size="full">
      {late ? (
        <p className="mb-5 rounded-2xl bg-warning-soft p-4 text-sm text-warning">
          Your appointment is less than {s.settings.cancellationHours} hours away. You can still move it, but late changes may forfeit your deposit per our policy.
        </p>
      ) : null}
      <Checkbox checked={anyStylist} onChange={(v) => { setAnyStylist(v); setSlot(null); }} className="mb-5">
        Show times with any stylist (not only {s.stylists.find((x) => x.id === appt.stylistId)?.name})
      </Checkbox>
      <DateTimePicker service={svc} stylistId={anyStylist ? "any" : appt.stylistId} minutes={appt.minutes} value={slot} onChange={setSlot} ignoreRef={appt.ref} />
      {error ? <p className="mt-4 text-sm text-error" role="alert">{error}</p> : null}
      <div className="mt-6 flex flex-col gap-3 border-t border-line pt-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted">Changing your appointment will release your current time slot.</p>
        <Button disabled={!slot} onClick={confirm} size="lg">
          {slot ? `Move to ${longDate(slot.date).split(",").slice(0, 2).join(",")}, ${clock(slot.time)}` : "Choose a new time"}
        </Button>
      </div>
    </Modal>
  );
}

function CancelModal({ appt, onClose, onDone }: { appt: Appointment; onClose: () => void; onDone: () => void }) {
  const s = useStore();
  const out = cancellationOutcome(s, appt);
  const [ok, setOk] = useState(false);
  return (
    <Modal open onClose={onClose} title="Cancel appointment">
      <div className={cn("rounded-2xl p-4 text-sm leading-relaxed", out.late ? "bg-warning-soft text-warning" : "bg-success-soft text-success")}>
        {out.late ? (
          <>
            This appointment is less than {s.settings.cancellationHours} hours away, so your {money(out.forfeited)} deposit will be kept per our cancellation policy.
            {out.refund > 0 ? ` The remaining ${money(out.refund)} you paid will be refunded.` : ""}
          </>
        ) : (
          <>You're cancelling more than {s.settings.cancellationHours} hours ahead. {out.refund > 0 ? `${money(out.refund)} will be refunded to your original payment method within 5 to 10 business days.` : "Nothing further is owed."}</>
        )}
      </div>
      <p className="mt-4 text-sm text-muted">
        Would you rather move it instead? Rescheduling keeps your deposit. Read the{" "}
        <Link to="/policies#cancellation" className="font-semibold text-ink underline decoration-gold underline-offset-4">
          full policy
        </Link>
        .
      </p>
      <Checkbox className="mt-5" checked={ok} onChange={setOk}>
        I understand and want to cancel this appointment.
      </Checkbox>
      <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Button variant="secondary" onClick={onClose}>
          Keep my appointment
        </Button>
        <Button
          disabled={!ok}
          className="!bg-error hover:!bg-error/90"
          onClick={() => {
            cancelAppointment(appt.ref, { refund: out.refund });
            onDone();
            onClose();
          }}
        >
          Cancel appointment
        </Button>
      </div>
    </Modal>
  );
}

function ReviewModal({ appt, onClose, onDone }: { appt: Appointment; onClose: () => void; onDone: () => void }) {
  const [rating, setRating] = useState(5);
  const [text, setText] = useState("");
  const [photo, setPhoto] = useState(false);
  const submit = (e: FormEvent) => {
    e.preventDefault();
    addReview({
      id: uid("r-"),
      name: `${appt.customer.firstName} ${appt.customer.lastName[0]}.`,
      serviceId: appt.serviceId,
      stylistId: appt.stylistId,
      rating,
      text: text.trim(),
      date: new Date().toISOString().slice(0, 10),
      withPhoto: photo,
      status: "pending",
      appointmentRef: appt.ref,
    });
    onDone();
    onClose();
  };
  return (
    <Modal open onClose={onClose} title="How was your appointment?">
      <form onSubmit={submit} className="flex flex-col gap-5">
        <fieldset>
          <legend className="mb-2 text-sm font-semibold">Your rating</legend>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} type="button" onClick={() => setRating(n)} aria-label={`${n} star${n > 1 ? "s" : ""}`} aria-pressed={rating === n} className="p-1">
                <Star className={cn("size-8 text-gold", n <= rating && "fill-current")} strokeWidth={1.3} />
              </button>
            ))}
          </div>
        </fieldset>
        <Textarea label="Tell us about it" required minLength={10} value={text} onChange={(e) => setText(e.target.value)} placeholder="What did you love? Would you recommend your stylist?" />
        <Checkbox checked={photo} onChange={setPhoto}>
          I'm happy for Hair by Chi to feature a photo of my style with this review
        </Checkbox>
        <p className="text-xs text-muted">Reviews are checked by the studio before they're published.</p>
        <Button type="submit" size="lg">
          Submit review
        </Button>
      </form>
    </Modal>
  );
}

