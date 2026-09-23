import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { AlertCircle, ArrowLeft, Check, Clock, CreditCard, ImagePlus, Lock, ShieldCheck, Sparkles, Trash2, Users } from "lucide-react";
import { CATEGORIES } from "../../data/catalog";
import type { Appointment, BookingAnswers, CategoryId, Service } from "../../data/types";
import { isSlotFree, nextAvailable, slotsOn, type Slot } from "../../lib/availability";
import { bookingRef, clock, cn, duration, longDate, money } from "../../lib/format";
import { quote } from "../../lib/pricing";
import { createAppointment, currentUser, getState, useStore } from "../../store/store";
import { Button } from "../../ui/Button";
import { Container, Stars } from "../../ui/bits";
import { priceLabel } from "../../ui/cards";
import DateTimePicker, { type PickedSlot } from "../../ui/DateTimePicker";
import { Checkbox, Choices, Input, Select, Textarea, readImage } from "../../ui/form";
import Photo from "../../ui/Photo";

const STEPS = ["Service", "Stylist", "Date & Time", "Details", "Payment"] as const;
const DRAFT_KEY = "hairbychi:booking-draft";

interface Draft {
  serviceId?: string;
  addOnIds: string[];
  stylistId: string | "any";
  slot: PickedSlot | null;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  answers: BookingAnswers;
  notes: string;
  referenceImage?: string;
  paymentType: "deposit" | "full";
  method: "card" | "apple-pay" | "google-pay";
  code: string;
  agree: boolean;
}

const EMPTY: Draft = {
  addOnIds: [],
  stylistId: "any",
  slot: null,
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  answers: {},
  notes: "",
  paymentType: "deposit",
  method: "card",
  code: "",
  agree: false,
};

function loadDraft(): Draft {
  try {
    const raw = sessionStorage.getItem(DRAFT_KEY);
    if (raw) return { ...EMPTY, ...JSON.parse(raw) };
  } catch {
    /* ignore */
  }
  return EMPTY;
}

function Progress({ step, go }: { step: number; go: (i: number) => void }) {
  return (
    <nav aria-label="Booking progress" className="mb-10">
      <div className="relative h-0.5 rounded bg-sand-deep/60">
        <div className="absolute inset-y-0 left-0 rounded bg-gold transition-all duration-700 ease-out" style={{ width: `${(step / (STEPS.length - 1)) * 100}%` }} />
      </div>
      <ol className="mt-4 grid grid-cols-5 gap-1">
        {STEPS.map((label, i) => (
          <li key={label} className={cn("text-center first:text-left last:text-right")}>
            <button
              type="button"
              disabled={i >= step}
              onClick={() => go(i)}
              aria-current={i === step ? "step" : undefined}
              className={cn(
                "inline-flex items-center gap-1.5 text-[0.7rem] font-semibold tracking-wide uppercase sm:text-xs",
                i === step ? "text-ink" : i < step ? "text-gold-deep hover:underline" : "text-muted/60",
              )}
            >
              <span
                className={cn(
                  "hidden size-5 place-items-center rounded-full text-[0.65rem] sm:grid",
                  i < step ? "bg-gold text-ivory" : i === step ? "bg-ink text-ivory" : "bg-sand text-muted",
                )}
                aria-hidden
              >
                {i < step ? <Check className="size-3" strokeWidth={3} /> : i + 1}
              </span>
              <span className={cn(i !== step && "max-sm:sr-only")}>{label}</span>
              {i < step ? <span className="sr-only">(completed)</span> : null}
            </button>
          </li>
        ))}
      </ol>
    </nav>
  );
}

function StepTitle({ eyebrow, title, sub }: { eyebrow: string; title: ReactNode; sub?: string }) {
  return (
    <div className="mb-8">
      <p className="eyebrow mb-3">{eyebrow}</p>
      <h1 className="text-4xl leading-[1.05] md:text-5xl">{title}</h1>
      {sub ? <p className="mt-3 max-w-xl text-muted">{sub}</p> : null}
    </div>
  );
}

export default function Book() {
  const s = useStore();
  const nav = useNavigate();
  const user = currentUser(s);
  const [params] = useSearchParams();
  const top = useRef<HTMLDivElement>(null);

  const [draft, setDraft] = useState<Draft>(() => {
    const d = loadDraft();
    const svc = params.get("service");
    const st = params.get("stylist");
    if (svc && svc !== d.serviceId) return { ...EMPTY, serviceId: svc, stylistId: st ?? "any" };
    if (st) return { ...d, stylistId: st };
    return d;
  });
  const [step, setStep] = useState(0);
  const [category, setCategory] = useState<CategoryId>(() => s.services.find((x) => x.id === draft.serviceId)?.categoryId ?? "braids");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [processing, setProcessing] = useState(false);
  const [failure, setFailure] = useState<{ message: string; alternatives?: { date: string; slots: Slot[] } } | null>(null);

  const update = (patch: Partial<Draft>) => setDraft((d) => ({ ...d, ...patch }));

  useEffect(() => {
    try {
      sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    } catch {
      /* ignore */
    }
  }, [draft]);

  // Prefill contact details for signed-in clients
  useEffect(() => {
    if (user && !draft.email) update({ firstName: user.firstName, lastName: user.lastName, email: user.email, phone: user.phone });
  }, [user?.id]);

  const service = s.services.find((x) => x.id === draft.serviceId && x.active);
  const q = service ? quote(s, service, draft.addOnIds, { code: draft.code, email: draft.email, paymentType: draft.paymentType }) : null;
  const stylist = draft.slot ? s.stylists.find((x) => x.id === draft.slot!.stylistId) : null;
  const eligibleStylists = service ? s.stylists.filter((st) => st.active && service.stylistIds.includes(st.id)) : [];

  const go = (i: number) => {
    setStep(i);
    setFailure(null);
    requestAnimationFrame(() => top.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
  };

  const validateDetails = () => {
    const e: Record<string, string> = {};
    if (!draft.firstName.trim()) e.firstName = "Please add your first name.";
    if (!draft.lastName.trim()) e.lastName = "Please add your last name.";
    if (!/^\S+@\S+\.\S+$/.test(draft.email)) e.email = "Please enter a valid email so we can send your confirmation.";
    if (draft.phone.replace(/\D/g, "").length < 10) e.phone = "Please enter a phone number with area code.";
    if (!draft.answers.length) e.length = "Please choose your current hair length.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const canContinue = [
    !!service,
    !!service && (draft.stylistId === "any" || eligibleStylists.some((x) => x.id === draft.stylistId)),
    !!draft.slot,
    true,
    draft.agree,
  ][step];

  const next = () => {
    if (step === 3 && !validateDetails()) {
      requestAnimationFrame(() => document.querySelector<HTMLElement>("[aria-invalid='true']")?.focus());
      return;
    }
    if (step < 4) go(step + 1);
    else pay();
  };

  const pay = () => {
    if (!service || !q || !draft.slot) return;
    setProcessing(true);
    setFailure(null);
    // Simulated payment round-trip. A live build creates a PaymentIntent server-side
    // and confirms it with the provider's SDK; card data never touches our code.
    setTimeout(() => {
      const slot = draft.slot!;
      const s = getState(); // re-read: someone may have booked while we were "processing"
      const candidate = { stylistId: slot.stylistId, date: slot.date, time: slot.time, minutes: q.minutes };
      if (!isSlotFree(s, service, candidate)) {
        const same = slotsOn(s, service, draft.stylistId, slot.date, q.minutes);
        setFailure({
          message: "That appointment was just booked by another client. Here are the closest available times. Your card has not been charged.",
          alternatives: same.length ? { date: slot.date, slots: same.slice(0, 6) } : (nextAvailable(s, service, draft.stylistId, slot.date, q.minutes) ?? undefined),
        });
        setProcessing(false);
        return;
      }
      const appt: Appointment = {
        ref: bookingRef(),
        serviceId: service.id,
        stylistId: slot.stylistId,
        addOnIds: draft.addOnIds,
        date: slot.date,
        time: slot.time,
        minutes: q.minutes,
        status: service.consultation ? "pending" : "confirmed",
        customer: { firstName: draft.firstName.trim(), lastName: draft.lastName.trim(), email: draft.email.trim().toLowerCase(), phone: draft.phone.trim() },
        answers: draft.answers,
        notes: draft.notes.trim(),
        referenceImage: draft.referenceImage,
        subtotal: q.subtotal,
        discount: q.discount,
        discountCode: q.discountCode,
        total: q.total,
        deposit: q.deposit,
        paid: q.dueNow,
        paymentType: draft.paymentType,
        paymentMethod: draft.method,
        createdAt: new Date().toISOString(),
        rescheduleCount: 0,
        source: "online",
      };
      try {
        createAppointment(appt);
        sessionStorage.removeItem(DRAFT_KEY);
        nav(`/book/confirmed/${appt.ref}`);
      } catch {
        setFailure({ message: "We couldn't complete your booking. Your card has not been charged. Please try again." });
        setProcessing(false);
      }
    }, 1800);
  };

  const categoryServices = s.services.filter((x) => x.categoryId === category && x.active);

  return (
    <div ref={top} className="scroll-mt-24 bg-ivory pb-40 md:pb-24">
      <Container className="pt-8 md:pt-12">
        <div className="mb-6 flex items-center justify-between">
          {step > 0 ? (
            <button onClick={() => go(step - 1)} className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-ink-soft hover:text-ink">
              <ArrowLeft className="size-4" aria-hidden /> Back
            </button>
          ) : (
            <Link to="/services" className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-ink-soft hover:text-ink">
              <ArrowLeft className="size-4" aria-hidden /> Services
            </Link>
          )}
          <p className="text-xs text-muted">
            Step {step + 1} of {STEPS.length}
          </p>
        </div>
        <Progress step={step} go={go} />

        <div className="grid gap-10 lg:grid-cols-[1fr_360px] lg:gap-14">
          <div key={step} className="min-w-0 animate-fade-up">
            {/* ---------------- Step 1: service + add-ons ---------------- */}
            {step === 0 ? (
              <>
                <StepTitle eyebrow="Step 1" title={<>What are we <em className="text-gold-deep">creating?</em></>} sub="Choose a category, then the style that fits you best." />
                <div className="no-scrollbar -mx-5 mb-8 flex gap-2 overflow-x-auto px-5" role="tablist" aria-label="Service category">
                  {CATEGORIES.map((c) => (
                    <button
                      key={c.id}
                      role="tab"
                      aria-selected={category === c.id}
                      onClick={() => setCategory(c.id)}
                      className={cn(
                        "flex shrink-0 items-center gap-2.5 rounded-full py-1.5 pr-5 pl-1.5 text-sm font-semibold transition",
                        category === c.id ? "bg-ink text-ivory" : "bg-white/70 ring-1 ring-line hover:ring-ink/50",
                      )}
                    >
                      <Photo art={c.art} tone={c.tone} path={`categories/${c.id}`} alt="" className="size-8 rounded-full" />
                      {c.name}
                    </button>
                  ))}
                </div>
                <div className="grid gap-4 sm:grid-cols-2" role="tabpanel">
                  {categoryServices.map((svc) => (
                    <ServiceOption
                      key={svc.id}
                      svc={svc}
                      selected={svc.id === draft.serviceId}
                      onSelect={() => update({ serviceId: svc.id, addOnIds: [], slot: null, stylistId: svc.stylistIds.includes(draft.stylistId) ? draft.stylistId : "any" })}
                    />
                  ))}
                </div>

                {service && service.addOnIds.length ? (
                  <section className="mt-12 animate-fade-up rounded-[var(--radius-card)] bg-cream p-6 ring-1 ring-line md:p-8" aria-labelledby="addons-h">
                    <h2 id="addons-h" className="text-4xl">
                      Make it <em className="text-gold-deep">yours</em>
                    </h2>
                    <p className="mt-1 text-sm text-muted">Optional extras for your {service.name}.</p>
                    <div className="mt-6 grid gap-3 sm:grid-cols-2">
                      {s.addOns
                        .filter((a) => service.addOnIds.includes(a.id))
                        .map((a) => {
                          const on = draft.addOnIds.includes(a.id);
                          return (
                            <label key={a.id} className={cn("flex cursor-pointer items-center gap-3 rounded-2xl bg-white p-4 ring-1 transition", on ? "ring-2 ring-ink" : "ring-line hover:ring-ink/40")}>
                              <input
                                type="checkbox"
                                className="peer sr-only"
                                checked={on}
                                onChange={() => update({ addOnIds: on ? draft.addOnIds.filter((x) => x !== a.id) : [...draft.addOnIds, a.id], slot: null })}
                              />
                              <span className={cn("grid size-5 shrink-0 place-items-center rounded-md border transition peer-focus-visible:ring-4 peer-focus-visible:ring-gold/30", on ? "border-ink bg-ink" : "border-sand-deep")} aria-hidden>
                                {on ? <Check className="size-3.5 text-ivory" strokeWidth={3} /> : null}
                              </span>
                              <span className="flex-1 text-sm">
                                <span className="font-semibold">{a.name}</span>
                                {a.minutes ? <span className="block text-xs text-muted">+{duration(a.minutes)}</span> : null}
                              </span>
                              <span className="text-sm font-semibold">+{money(a.price)}</span>
                            </label>
                          );
                        })}
                    </div>
                  </section>
                ) : null}
              </>
            ) : null}

            {/* ---------------- Step 2: stylist ---------------- */}
            {step === 1 && service ? (
              <>
                <StepTitle eyebrow="Step 2" title={<>Who would you <em className="text-gold-deep">like?</em></>} sub={`${eligibleStylists.length} stylists offer ${service.name}.`} />
                <button
                  type="button"
                  onClick={() => update({ stylistId: "any", slot: null })}
                  aria-pressed={draft.stylistId === "any"}
                  className={cn(
                    "mb-6 flex w-full items-center gap-4 rounded-[var(--radius-card)] p-5 text-left ring-1 transition",
                    draft.stylistId === "any" ? "bg-ink text-ivory ring-ink" : "bg-white/70 ring-line hover:ring-ink/50",
                  )}
                >
                  <span className={cn("grid size-12 shrink-0 place-items-center rounded-full", draft.stylistId === "any" ? "bg-ivory/15" : "bg-sand")}>
                    <Users className="size-5" aria-hidden />
                  </span>
                  <span className="flex-1">
                    <span className="block font-display text-2xl">No preference</span>
                    <span className={cn("text-sm", draft.stylistId === "any" ? "text-ivory/70" : "text-muted")}>Choose any available stylist. Shows the most times.</span>
                  </span>
                  {draft.stylistId === "any" ? <Check className="size-5 text-gold" aria-hidden /> : null}
                </button>
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {eligibleStylists.map((st) => {
                    const on = draft.stylistId === st.id;
                    return (
                      <button
                        key={st.id}
                        type="button"
                        onClick={() => update({ stylistId: st.id, slot: null })}
                        aria-pressed={on}
                        className={cn("group flex flex-col rounded-[var(--radius-card)] bg-white/70 p-3 text-left ring-1 transition", on ? "ring-2 ring-ink" : "ring-line hover:ring-ink/50")}
                      >
                        <Photo art={st.art} tone={st.tone} path={`stylists/${st.id}`} alt={`Portrait of ${st.name}`} className="aspect-[4/3] rounded-2xl" zoom />
                        <span className="mt-4 flex items-center justify-between px-1">
                          <span className="font-display text-3xl">{st.name}</span>
                          <span className="inline-flex items-center gap-1 text-sm font-semibold">
                            <Stars rating={st.rating} /> {st.rating}
                          </span>
                        </span>
                        <span className="px-1 text-sm text-muted">{st.title}</span>
                        <span className="mt-2 px-1 text-xs text-muted">{st.appointments} appointments completed</span>
                        <span className="mt-3 flex flex-wrap gap-1.5 px-1">
                          {st.specialties.slice(0, 3).map((x) => (
                            <span key={x} className="rounded-full bg-sand px-2.5 py-1 text-[0.7rem]">
                              {x}
                            </span>
                          ))}
                        </span>
                        <span className={cn("mt-4 flex min-h-11 items-center justify-center rounded-full text-sm font-semibold", on ? "bg-ink text-ivory" : "border border-ink/60")}>
                          {on ? "Selected" : `Select ${st.name}`}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </>
            ) : null}

            {/* ---------------- Step 3: date & time ---------------- */}
            {step === 2 && service && q ? (
              <>
                <StepTitle
                  eyebrow="Step 3"
                  title={<>Pick your <em className="text-gold-deep">moment</em></>}
                  sub={`Times fit your full ${duration(q.minutes, true)} appointment${draft.stylistId === "any" ? " with any available stylist" : ` with ${s.stylists.find((x) => x.id === draft.stylistId)?.name}`}.`}
                />
                <DateTimePicker service={service} stylistId={draft.stylistId} minutes={q.minutes} value={draft.slot} onChange={(slot) => update({ slot })} initialDate={params.get("date") ?? undefined} />
              </>
            ) : null}

            {/* ---------------- Step 4: details ---------------- */}
            {step === 3 && service ? (
              <>
                <StepTitle eyebrow="Step 4" title={<>A little about <em className="text-gold-deep">you</em></>} sub="Just what we need to prepare for your appointment." />
                {!user ? (
                  <p className="mb-8 rounded-2xl bg-cream p-4 text-sm text-ink-soft ring-1 ring-line">
                    Have an account?{" "}
                    <Link to="/signin?next=/book" className="font-semibold underline decoration-gold underline-offset-4">
                      Sign in
                    </Link>{" "}
                    to fill this in automatically. Otherwise, continue as a guest.
                  </p>
                ) : null}
                <div className="grid gap-5 sm:grid-cols-2">
                  <Input label="First name" autoComplete="given-name" value={draft.firstName} onChange={(e) => update({ firstName: e.target.value })} error={errors.firstName} />
                  <Input label="Last name" autoComplete="family-name" value={draft.lastName} onChange={(e) => update({ lastName: e.target.value })} error={errors.lastName} />
                  <Input label="Email" type="email" autoComplete="email" value={draft.email} onChange={(e) => update({ email: e.target.value })} error={errors.email} hint="Your confirmation and reminders go here." />
                  <Input label="Phone number" type="tel" autoComplete="tel" value={draft.phone} onChange={(e) => update({ phone: e.target.value })} error={errors.phone} />
                </div>

                <div className="mt-10 flex flex-col gap-7 rounded-[var(--radius-card)] bg-white/60 p-6 ring-1 ring-line">
                  <h2 className="text-3xl">Your hair today</h2>
                  <div>
                    <Choices
                      legend="Current hair length"
                      value={draft.answers.length}
                      onChange={(v) => update({ answers: { ...draft.answers, length: v } })}
                      options={[
                        { value: "Short", label: "Short" },
                        { value: "Shoulder", label: "Shoulder" },
                        { value: "Mid-back", label: "Mid-back" },
                        { value: "Longer", label: "Longer" },
                      ]}
                    />
                    {errors.length ? (
                      <p className="mt-2 text-sm text-error" role="alert">
                        {errors.length}
                      </p>
                    ) : null}
                  </div>
                  <Choices
                    legend="Hair thickness"
                    columns={3}
                    value={draft.answers.thickness}
                    onChange={(v) => update({ answers: { ...draft.answers, thickness: v } })}
                    options={[
                      { value: "Fine", label: "Fine" },
                      { value: "Medium", label: "Medium" },
                      { value: "Thick", label: "Thick" },
                    ]}
                  />
                  <div>
                    <Choices
                      legend="Is your hair currently in another style?"
                      columns={2}
                      value={draft.answers.currentStyle}
                      onChange={(v) => update({ answers: { ...draft.answers, currentStyle: v } })}
                      options={[
                        { value: "yes", label: "Yes" },
                        { value: "no", label: "No" },
                      ]}
                    />
                    {draft.answers.currentStyle === "yes" ? (
                      service.addOnIds.includes("takedown") ? (
                        <div className="mt-4 rounded-2xl bg-cream p-4">
                          <Checkbox
                            checked={draft.addOnIds.includes("takedown")}
                            onChange={(v) =>
                              update({ addOnIds: v ? [...draft.addOnIds, "takedown"] : draft.addOnIds.filter((x) => x !== "takedown"), slot: v === draft.addOnIds.includes("takedown") ? draft.slot : null })
                            }
                          >
                            Would you like us to remove your previous style? <strong>+{money(s.addOns.find((a) => a.id === "takedown")!.price)}</strong>
                            <span className="block text-xs text-muted">Adding this changes your appointment length, so we'll ask you to re-pick a time.</span>
                          </Checkbox>
                        </div>
                      ) : (
                        <p className="mt-3 text-sm text-muted">Please arrive with your previous style removed so we can start on time.</p>
                      )
                    ) : null}
                  </div>
                  <Select label="Hair condition" value={draft.answers.hairCondition ?? ""} onChange={(e) => update({ answers: { ...draft.answers, hairCondition: e.target.value } })}>
                    <option value="">Prefer not to say</option>
                    <option>Healthy</option>
                    <option>Dry or brittle</option>
                    <option>Recently coloured or chemically treated</option>
                    <option>Thinning or sensitive edges</option>
                    <option>Sensitive scalp</option>
                  </Select>
                  <Textarea
                    label="Anything we should know about your hair?"
                    optional
                    value={draft.notes}
                    onChange={(e) => update({ notes: e.target.value })}
                    placeholder="Tender-headed, allergies, the look you're going for…"
                  />
                  <ReferenceUpload value={draft.referenceImage} onChange={(referenceImage) => update({ referenceImage })} />
                </div>
              </>
            ) : null}

            {/* ---------------- Step 5: review + payment ---------------- */}
            {step === 4 && service && q && draft.slot ? (
              <>
                <StepTitle eyebrow="Step 5" title={<>Review & <em className="text-gold-deep">secure</em></>} sub="Check everything below. You won't be surprised by any cost." />
                {failure ? (
                  <div role="alert" className="mb-8 rounded-2xl bg-error-soft p-5 text-sm text-error">
                    <p className="flex gap-2 font-semibold">
                      <AlertCircle className="size-5 shrink-0" aria-hidden /> {failure.message}
                    </p>
                    {failure.alternatives ? (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {failure.alternatives.slots.slice(0, 6).map((sl) => (
                          <button
                            key={sl.time}
                            onClick={() => {
                              update({ slot: { date: failure.alternatives!.date, time: sl.time, stylistId: sl.stylistId } });
                              setFailure(null);
                            }}
                            className="min-h-11 rounded-xl bg-white px-4 text-sm font-semibold text-ink ring-1 ring-line hover:ring-ink"
                          >
                            {longDate(failure.alternatives!.date).split(",").slice(0, 2).join(",")} · {clock(sl.time)}
                          </button>
                        ))}
                      </div>
                    ) : null}
                  </div>
                ) : null}

                <section className="rounded-[var(--radius-card)] border border-line bg-white/70 p-6" aria-labelledby="summary-h">
                  <h2 id="summary-h" className="text-3xl">
                    Your appointment
                  </h2>
                  <div className="mt-5 flex gap-4">
                    <Photo art={service.art} tone={service.tone} path={`services/${service.id}`} alt="" className="aspect-[4/5] w-20 shrink-0 rounded-xl" />
                    <dl className="grid flex-1 gap-1 text-sm">
                      <dt className="sr-only">Service</dt>
                      <dd className="font-display text-2xl leading-tight">{service.name}</dd>
                      <dt className="sr-only">Stylist</dt>
                      <dd>Stylist: {stylist?.name}</dd>
                      <dt className="sr-only">Date and time</dt>
                      <dd>
                        {longDate(draft.slot.date)} · {clock(draft.slot.time)}
                      </dd>
                      <dt className="sr-only">Duration</dt>
                      <dd className="text-muted">Estimated duration: {duration(q.minutes, true)}</dd>
                    </dl>
                  </div>
                  <CostTable q={q} paymentType={draft.paymentType} />
                  <div className="mt-5 flex gap-2">
                    <label className="sr-only" htmlFor="promo">
                      Promo code
                    </label>
                    <input
                      id="promo"
                      value={draft.code}
                      onChange={(e) => update({ code: e.target.value.toUpperCase() })}
                      placeholder="Promo code (try WELCOME10)"
                      className="min-h-11 flex-1 rounded-xl border border-line bg-white px-4 text-sm tracking-wider uppercase focus:border-gold focus:outline-none"
                    />
                  </div>
                  {q.discountError ? <p className="mt-2 text-sm text-error">{q.discountError}</p> : q.discountCode ? <p className="mt-2 text-sm text-success">{q.discountCode} applied.</p> : null}
                </section>

                <section className="mt-8" aria-labelledby="pay-h">
                  <h2 id="pay-h" className="text-3xl">
                    Payment
                  </h2>
                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    {(
                      [
                        ["deposit", `Pay deposit · ${money(q.deposit)}`, `${money(q.total - q.deposit)} due at your appointment`],
                        ...(s.settings.allowFullPayment ? [["full", `Pay in full · ${money(q.total)}`, "Nothing to pay on the day"]] : []),
                      ] as [Draft["paymentType"], string, string][]
                    ).map(([v, label, hint]) => (
                      <label key={v} className={cn("cursor-pointer rounded-2xl bg-white p-4 ring-1 transition", draft.paymentType === v ? "ring-2 ring-ink" : "ring-line")}>
                        <input type="radio" name="ptype" className="sr-only" checked={draft.paymentType === v} onChange={() => update({ paymentType: v })} />
                        <span className="block text-sm font-semibold">{label}</span>
                        <span className="text-xs text-muted">{hint}</span>
                      </label>
                    ))}
                  </div>

                  <fieldset className="mt-6">
                    <legend className="mb-3 text-sm font-semibold">Payment method</legend>
                    <div className="grid grid-cols-3 gap-2">
                      {(
                        [
                          ["card", "Card"],
                          ["apple-pay", "Apple Pay"],
                          ["google-pay", "Google Pay"],
                        ] as const
                      ).map(([v, label]) => (
                        <label key={v} className={cn("flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-xl bg-white text-sm font-semibold ring-1", draft.method === v ? "ring-2 ring-ink" : "ring-line")}>
                          <input type="radio" name="method" className="sr-only" checked={draft.method === v} onChange={() => update({ method: v })} />
                          {v === "card" ? <CreditCard className="size-4" aria-hidden /> : null}
                          {label}
                        </label>
                      ))}
                    </div>
                  </fieldset>

                  <div className="mt-4 rounded-2xl border border-dashed border-sand-deep bg-cream/70 p-5">
                    {draft.method === "card" ? (
                      <>
                        <div className="flex items-center justify-between text-sm font-semibold">
                          <span>Card details</span>
                          <span className="inline-flex items-center gap-1 text-xs text-success">
                            <Lock className="size-3.5" aria-hidden /> Secure
                          </span>
                        </div>
                        <div className="mt-3 grid grid-cols-[1fr_auto_auto] gap-2 rounded-xl bg-white p-3.5 text-sm text-muted ring-1 ring-line">
                          <span>1234 1234 1234 1234</span>
                          <span>MM / YY</span>
                          <span>CVC</span>
                        </div>
                        <p className="mt-2 text-xs text-muted">Demo mode: the secure card field from the payment provider loads here. No card is charged in this preview.</p>
                      </>
                    ) : (
                      <p className="text-sm text-muted">You'll confirm with {draft.method === "apple-pay" ? "Apple Pay" : "Google Pay"} on the next screen. Demo mode: nothing is charged.</p>
                    )}
                  </div>

                  <p className="mt-6 flex gap-2.5 rounded-2xl bg-gold-soft/50 p-4 text-sm leading-relaxed">
                    <ShieldCheck className="mt-0.5 size-5 shrink-0 text-gold-deep" aria-hidden />
                    <span>
                      A <strong>{money(q.deposit)} non-refundable deposit</strong> is required to secure your appointment. It's deducted from your total. You can reschedule for free up to{" "}
                      {s.settings.cancellationHours} hours before.
                    </span>
                  </p>
                  <Checkbox className="mt-5" checked={draft.agree} onChange={(agree) => update({ agree })}>
                    I have read and agree to the{" "}
                    <Link to="/policies#cancellation" target="_blank" className="font-semibold underline decoration-gold underline-offset-4">
                      cancellation and appointment policies
                    </Link>
                    .
                  </Checkbox>
                </section>
              </>
            ) : null}
          </div>

          {/* ---------------- Live summary (desktop) ---------------- */}
          <aside className="hidden lg:block" aria-label="Booking summary">
            <div className="sticky top-28 rounded-[var(--radius-card)] bg-white/80 p-6 ring-1 ring-line">
              {service && q ? (
                <>
                  <div className="flex gap-4">
                    <Photo art={service.art} tone={service.tone} path={`services/${service.id}`} alt="" className="aspect-[4/5] w-16 shrink-0 rounded-xl" />
                    <div>
                      <p className="font-display text-2xl leading-tight">{service.name}</p>
                      <p className="mt-1 inline-flex items-center gap-1.5 text-xs text-muted">
                        <Clock className="size-3.5" aria-hidden /> {duration(q.minutes)}
                      </p>
                    </div>
                  </div>
                  <dl className="mt-5 space-y-2 border-t border-line pt-4 text-sm">
                    <div className="flex justify-between">
                      <dt className="text-muted">Stylist</dt>
                      <dd className="font-medium">{stylist?.name ?? (draft.stylistId === "any" ? "Any available" : s.stylists.find((x) => x.id === draft.stylistId)?.name)}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted">When</dt>
                      <dd className="text-right font-medium">{draft.slot ? `${longDate(draft.slot.date).split(",").slice(0, 2).join(",")}, ${clock(draft.slot.time)}` : "Not chosen yet"}</dd>
                    </div>
                  </dl>
                  <CostTable q={q} paymentType={draft.paymentType} compact />
                </>
              ) : (
                <p className="text-sm text-muted">Your selections will appear here as you go.</p>
              )}
              <Button className="mt-6 w-full" size="lg" disabled={!canContinue} loading={processing} onClick={next} arrow={step < 4}>
                {step === 4 && q ? `Pay ${money(q.dueNow)} & Confirm` : step === 3 ? "Continue to Payment" : "Continue"}
              </Button>
              <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-muted">
                <Lock className="size-3" aria-hidden /> Secure checkout · No hidden fees
              </p>
            </div>
          </aside>
        </div>
      </Container>

      {/* ---------------- Sticky bar (mobile / tablet) ---------------- */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-ivory/95 px-5 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-md lg:hidden">
        <div className="mx-auto flex max-w-2xl items-center gap-4">
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs text-muted">{service ? service.name : "Choose a service"}</p>
            <p className="font-display text-2xl leading-none">{q ? money(step === 4 ? q.dueNow : q.total) : "—"}</p>
            {q && step === 4 ? <p className="text-[0.7rem] text-muted">due today</p> : null}
          </div>
          <Button size="lg" disabled={!canContinue} loading={processing} onClick={next}>
            {step === 4 ? "Pay & Confirm" : "Continue"}
          </Button>
        </div>
      </div>

      {processing ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-ivory/85 backdrop-blur-sm" role="status" aria-live="assertive">
          <div className="text-center">
            <div className="mx-auto size-14 animate-spin rounded-full border-2 border-sand-deep border-t-gold" aria-hidden />
            <p className="mt-6 font-display text-3xl">Securing your appointment…</p>
            <p className="mt-1 text-sm text-muted">Please don't close this page.</p>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function ServiceOption({ svc, selected, onSelect }: { svc: Service; selected: boolean; onSelect: () => void }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={cn("group flex gap-4 rounded-[var(--radius-card)] bg-white/70 p-3 text-left ring-1 transition", selected ? "ring-2 ring-ink" : "ring-line hover:ring-ink/40")}
    >
      <Photo art={svc.art} tone={svc.tone} path={`services/${svc.id}`} src={svc.image} alt="" className="aspect-[4/5] w-24 shrink-0 rounded-2xl sm:w-28" zoom />
      <span className="flex min-w-0 flex-1 flex-col py-1 pr-1">
        <span className="font-display text-2xl leading-tight">{svc.name}</span>
        <span className="mt-1 text-sm font-semibold">
          {priceLabel(svc)} <span className="font-normal text-muted">· {svc.consultation ? "Consultation" : duration(svc.minutes)}</span>
        </span>
        <span className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-muted">{svc.tagline}</span>
        {svc.consultation ? (
          <span className="mt-2 inline-flex items-center gap-1 text-[0.7rem] font-semibold text-gold-deep">
            <Sparkles className="size-3" aria-hidden /> Consultation first
          </span>
        ) : null}
        <span className={cn("mt-auto inline-flex min-h-9 w-fit items-center gap-1.5 rounded-full px-4 pt-0 text-xs font-semibold transition", selected ? "bg-ink text-ivory" : "border border-ink/50")}>
          {selected ? (
            <>
              <Check className="size-3.5" aria-hidden /> Selected
            </>
          ) : (
            "Select"
          )}
        </span>
      </span>
    </button>
  );
}

function CostTable({ q, paymentType, compact }: { q: ReturnType<typeof quote>; paymentType: "deposit" | "full"; compact?: boolean }) {
  return (
    <dl className={cn("mt-5 space-y-2 border-t border-line pt-4 text-sm", compact && "mt-4")}>
      {q.lines.map((l, i) => (
        <div key={l.label + i} className="flex justify-between gap-4">
          <dt className={i === 0 ? "" : "text-muted"}>{i === 0 ? "Service" : l.label}</dt>
          <dd>{i === 0 ? money(l.amount) : `+${money(l.amount)}`}</dd>
        </div>
      ))}
      {q.discount ? (
        <div className="flex justify-between text-success">
          <dt>Discount ({q.discountCode})</dt>
          <dd>−{money(q.discount)}</dd>
        </div>
      ) : null}
      <div className="flex justify-between border-t border-line pt-3 text-base font-semibold">
        <dt>{compact ? "Estimated total" : "Total"}</dt>
        <dd>{money(q.total)}</dd>
      </div>
      <div className="flex justify-between">
        <dt className="font-semibold text-gold-deep">{paymentType === "full" ? "Due today" : "Deposit due today"}</dt>
        <dd className="font-semibold text-gold-deep">{money(q.dueNow)}</dd>
      </div>
      <div className="flex justify-between text-muted">
        <dt>Remaining at appointment</dt>
        <dd>{money(q.remaining)}</dd>
      </div>
    </dl>
  );
}

function ReferenceUpload({ value, onChange }: { value?: string; onChange: (v?: string) => void }) {
  const [error, setError] = useState("");
  const input = useRef<HTMLInputElement>(null);
  const preview = useMemo(() => value, [value]);
  return (
    <div>
      <p className="text-sm font-semibold">
        Reference hairstyle photo <span className="font-normal text-muted">(optional)</span>
      </p>
      {preview ? (
        <div className="mt-3 flex items-center gap-4">
          <img src={preview} alt="Your reference hairstyle" className="size-24 rounded-xl object-cover" />
          <button type="button" onClick={() => onChange(undefined)} className="inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-error">
            <Trash2 className="size-4" aria-hidden /> Remove
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => input.current?.click()}
          className="mt-3 flex w-full flex-col items-center rounded-2xl border border-dashed border-sand-deep bg-cream/50 px-6 py-8 text-center transition hover:border-gold"
        >
          <ImagePlus className="size-7 text-gold-deep" strokeWidth={1.4} aria-hidden />
          <span className="mt-2 text-sm font-semibold">Upload an inspiration photo</span>
          <span className="text-xs text-muted">JPG or PNG. Helps your stylist prepare.</span>
        </button>
      )}
      <input
        ref={input}
        type="file"
        accept="image/*"
        className="sr-only"
        tabIndex={-1}
        aria-hidden
        onChange={async (e) => {
          const f = e.target.files?.[0];
          if (!f) return;
          try {
            setError("");
            onChange(await readImage(f, 700));
          } catch {
            setError("We couldn't read that image. Please try a JPG or PNG.");
          }
        }}
      />
      {error ? <p className="mt-2 text-sm text-error">{error}</p> : null}
    </div>
  );
}
