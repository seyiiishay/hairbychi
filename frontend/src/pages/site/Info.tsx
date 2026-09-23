import { Link } from "react-router-dom";
import { FAQS, SALON } from "../../data/catalog";
import { useStore } from "../../store/store";
import { ButtonLink } from "../../ui/Button";
import { Container, PageHeader } from "../../ui/bits";
import FaqList from "../../ui/Faq";

export function Faq() {
  const groups = ["Booking", "Payments", "Your appointment"] as const;
  return (
    <>
      <PageHeader eyebrow="FAQ" title={<>Good to <em className="text-gold-deep">know</em></>} sub="Quick answers to the questions we hear most." />
      <Container className="max-w-4xl py-14 md:py-20">
        {groups.map((g) => (
          <section key={g} className="mb-14">
            <h2 className="mb-4 text-4xl">{g}</h2>
            <FaqList items={FAQS.filter((f) => f.group === g)} />
          </section>
        ))}
        <div className="rounded-[var(--radius-card)] bg-cream p-8 text-center ring-1 ring-line">
          <h2 className="text-3xl">Still wondering?</h2>
          <p className="mt-2 text-sm text-muted">We're happy to help you choose the right service.</p>
          <div className="mt-5 flex flex-col justify-center gap-3 sm:flex-row">
            <ButtonLink to="/contact">Contact us</ButtonLink>
            <ButtonLink to="/find-my-style" variant="secondary">
              Find My Style
            </ButtonLink>
          </div>
        </div>
      </Container>
    </>
  );
}

export function Policies() {
  const { settings } = useStore();
  const sections = [
    {
      id: "deposits",
      title: "Deposits",
      body: [
        "A deposit is required to secure every appointment. The amount is shown on each service page and at checkout before you pay.",
        "Deposits are non-refundable but fully transferable when you reschedule with at least " + settings.cancellationHours + " hours' notice, and are always deducted from your final total.",
      ],
    },
    {
      id: "cancellation",
      title: "Cancellation & rescheduling",
      body: [
        `You can reschedule or cancel online at any time from your account or confirmation email. Appointments cancelled more than ${settings.cancellationHours} hours before the scheduled time receive a refund of any amount paid beyond the deposit, and the deposit can be applied to a new booking.`,
        `Appointments cancelled less than ${settings.cancellationHours} hours before the scheduled time may lose their deposit. We understand life happens, so please reach out if something unexpected comes up.`,
      ],
    },
    {
      id: "late",
      title: "Late arrivals",
      body: [
        "Many of our services take several hours, so arriving on time helps us give you our best work. If you're running late, please call or text us.",
        `Appointments may be cancelled after ${settings.lateMinutes} minutes without notice, and the deposit kept. Late arrivals may need a simplified style to finish on time.`,
      ],
    },
    {
      id: "no-shows",
      title: "No-shows",
      body: [
        "Missing an appointment without notice forfeits the deposit. After two no-shows, future bookings require full payment upfront.",
      ],
    },
    {
      id: "preparation",
      title: "Hair preparation",
      body: [
        "Unless you've booked our wash service, please arrive with hair washed, fully detangled and blow-dried, free of heavy oils or product. Please remove any previous style, or add our takedown service when booking.",
        "Each service page lists its specific preparation. If your hair isn't prepared, we may need to add prep time at the standard add-on price.",
      ],
    },
    {
      id: "guests",
      title: "Guests",
      body: ["To keep the studio calm and comfortable for everyone, please come alone unless your guest also has an appointment."],
    },
    {
      id: "children",
      title: "Children",
      body: ["Children are welcome when they have their own appointment. For everyone's safety, we're unable to accommodate unbooked children in the studio."],
    },
    {
      id: "privacy",
      title: "Privacy",
      body: [
        "We collect only what we need to book and deliver your appointment: your name, contact details, hair notes and any reference photo you choose to share. We never sell your data.",
        "Card payments are processed by our payment provider. We never see or store your full card details.",
        `To access or delete your information, email ${SALON.email}.`,
      ],
    },
    {
      id: "terms",
      title: "Terms",
      body: [
        "Prices marked “from” may vary with length, size and hair density; your stylist will confirm any change before starting. By booking, you agree to these policies.",
      ],
    },
  ];
  return (
    <>
      <PageHeader eyebrow="Policies" title={<>Clear, kind <em className="text-gold-deep">policies</em></>} sub="So you always know what to expect. Thank you for helping us keep appointments running smoothly for everyone." />
      <Container className="grid gap-12 py-14 md:py-20 lg:grid-cols-[220px_1fr]">
        <nav aria-label="Policy sections" className="hidden lg:block">
          <ul className="sticky top-28 space-y-2 text-sm">
            {sections.map((s) => (
              <li key={s.id}>
                <a href={`#${s.id}`} className="text-muted transition hover:text-ink">
                  {s.title}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <div className="max-w-3xl">
          {sections.map((s) => (
            <section key={s.id} id={s.id} className="scroll-mt-28 border-b border-line py-10 first:pt-0">
              <h2 className="text-4xl">{s.title}</h2>
              {s.body.map((p) => (
                <p key={p} className="mt-4 text-[1.02rem] leading-relaxed text-ink-soft">
                  {p}
                </p>
              ))}
            </section>
          ))}
          <p className="mt-10 text-sm text-muted">
            Questions about a policy? <Link to="/contact" className="font-semibold text-ink underline decoration-gold underline-offset-4">Get in touch</Link>.
          </p>
        </div>
      </Container>
    </>
  );
}
