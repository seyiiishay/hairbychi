import { useState, type FormEvent } from "react";
import { Clock, Mail, MapPin, Phone } from "lucide-react";
import { SALON } from "../../data/catalog";
import { clock, uid } from "../../lib/format";
import { sendMessage, useStore } from "../../store/store";
import { Button, ButtonLink } from "../../ui/Button";
import { Container, PageHeader } from "../../ui/bits";
import { Input, Select, Textarea } from "../../ui/form";
import { SocialIcon } from "../../ui/Logo";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export function HoursTable() {
  const s = useStore();
  return (
    <dl className="divide-y divide-line text-sm">
      {DAYS.map((d, i) => {
        const h = s.hours[(i + 1) % 7];
        const today = new Date().getDay() === (i + 1) % 7;
        return (
          <div key={d} className="flex justify-between py-2.5">
            <dt className={today ? "font-semibold" : ""}>
              {d}
              {today ? <span className="ml-2 text-xs text-gold-deep">Today</span> : null}
            </dt>
            <dd className={h ? "" : "text-muted"}>{h ? `${clock(h.open)} – ${clock(h.close)}` : "Closed"}</dd>
          </div>
        );
      })}
    </dl>
  );
}

export default function Contact() {
  const [form, setForm] = useState({ name: "", email: "", phone: "", reason: "General question", message: "" });
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const set = (k: keyof typeof form) => (e: { target: { value: string } }) => setForm({ ...form, [k]: e.target.value });
  const submit = (e: FormEvent) => {
    e.preventDefault();
    setSending(true);
    setTimeout(() => {
      sendMessage({ ...form, id: uid("m-"), createdAt: new Date().toISOString(), read: false });
      setSending(false);
      setSent(true);
    }, 700);
  };
  return (
    <>
      <PageHeader eyebrow="Contact" title={<>We'd love to <em className="text-gold-deep">hear from you</em></>} sub="Questions about a style, a bridal party or a special request? Send a note and we'll reply within one business day." />
      <Container className="grid gap-12 py-14 md:py-20 lg:grid-cols-[1fr_1.1fr]">
        <div className="space-y-10">
          <ul className="space-y-5 text-[0.95rem]">
            <li className="flex gap-4">
              <MapPin className="mt-0.5 size-5 text-gold-deep" aria-hidden />
              <a href={SALON.mapsUrl} target="_blank" rel="noreferrer" className="hover:underline">
                {SALON.address}
              </a>
            </li>
            <li className="flex gap-4">
              <Phone className="mt-0.5 size-5 text-gold-deep" aria-hidden />
              <a href={`tel:${SALON.phone}`} className="hover:underline">
                {SALON.phone}
              </a>
            </li>
            <li className="flex gap-4">
              <Mail className="mt-0.5 size-5 text-gold-deep" aria-hidden />
              <a href={`mailto:${SALON.email}`} className="hover:underline">
                {SALON.email}
              </a>
            </li>
          </ul>
          <div>
            <h2 className="mb-3 flex items-center gap-2 text-3xl">
              <Clock className="size-5 text-gold-deep" aria-hidden /> Business hours
            </h2>
            <HoursTable />
          </div>
          <div className="flex gap-3">
            {(["instagram", "tiktok", "facebook"] as const).map((n) => (
              <a key={n} href={SALON[n]} target="_blank" rel="noreferrer" className="grid size-11 place-items-center rounded-full border border-line transition hover:border-ink hover:bg-ink hover:text-ivory" aria-label={n}>
                <SocialIcon name={n} />
              </a>
            ))}
          </div>
          <div className="overflow-hidden rounded-[var(--radius-card)] ring-1 ring-line">
            <iframe title="Map to Hair by Chi" src={SALON.mapEmbed} className="h-72 w-full grayscale-[40%]" loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
          </div>
        </div>

        <div>
          <div className="rounded-[1.75rem] bg-white/80 p-6 ring-1 ring-line md:p-10">
            {sent ? (
              <div className="py-10 text-center" role="status">
                <h2 className="text-4xl">Message sent</h2>
                <p className="mt-3 text-muted">Thank you, {form.name.split(" ")[0]}. We'll be in touch at {form.email} within one business day.</p>
              </div>
            ) : (
              <form onSubmit={submit} className="grid gap-5 sm:grid-cols-2">
                <h2 className="text-4xl sm:col-span-2">Send a message</h2>
                <Input label="Name" required autoComplete="name" value={form.name} onChange={set("name")} className="sm:col-span-2" />
                <Input label="Email" type="email" required autoComplete="email" value={form.email} onChange={set("email")} />
                <Input label="Phone" type="tel" optional autoComplete="tel" value={form.phone} onChange={set("phone")} />
                <Select label="Reason for contacting" value={form.reason} onChange={set("reason")} className="sm:col-span-2">
                  <option>General question</option>
                  <option>Which service should I book?</option>
                  <option>Bridal enquiry</option>
                  <option>Group or event booking</option>
                  <option>Feedback about a visit</option>
                  <option>Careers</option>
                </Select>
                <Textarea label="Message" required rows={5} value={form.message} onChange={set("message")} className="sm:col-span-2" />
                <Button type="submit" size="lg" loading={sending} className="sm:col-span-2">
                  Send Message
                </Button>
              </form>
            )}
          </div>
          <div className="mt-6 flex flex-col items-start justify-between gap-4 rounded-[var(--radius-card)] bg-ink p-6 text-ivory sm:flex-row sm:items-center">
            <div>
              <p className="font-display text-2xl">Need an appointment?</p>
              <p className="text-sm text-ivory/70">See live availability and book in minutes.</p>
            </div>
            <ButtonLink to="/book" variant="light" arrow>
              Book Online
            </ButtonLink>
          </div>
        </div>
      </Container>
    </>
  );
}
