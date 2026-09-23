import { useRef, useState, type FormEvent } from "react";
import { ImagePlus, Trash2 } from "lucide-react";
import { dateKey, uid } from "../../lib/format";
import { currentUser, requestConsultation, useStore } from "../../store/store";
import { Button, ButtonLink } from "../../ui/Button";
import { Container } from "../../ui/bits";
import { Input, Textarea, readImage } from "../../ui/form";

export default function Inspiration() {
  const user = currentUser(useStore());
  const fileRef = useRef<HTMLInputElement>(null);
  const [image, setImage] = useState<string>();
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [form, setForm] = useState({
    name: user ? `${user.firstName} ${user.lastName}` : "",
    email: user?.email ?? "",
    phone: user?.phone ?? "",
    notes: "",
    preferredDate: "",
  });
  const set = (k: keyof typeof form) => (e: { target: { value: string } }) => setForm({ ...form, [k]: e.target.value });

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!image && !form.notes.trim()) {
      setError("Please add a photo or describe the look you have in mind.");
      return;
    }
    setSending(true);
    setTimeout(() => {
      requestConsultation({ id: uid("c-"), ...form, image, status: "new", createdAt: new Date().toISOString() });
      setSending(false);
      setSent(true);
    }, 800);
  };

  return (
    <section className="bg-cream">
      <Container className="grid gap-12 py-14 md:py-20 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20">
        <div>
          <p className="eyebrow mb-4">Style consultation</p>
          <h1 className="text-6xl leading-[0.98] md:text-7xl">
            Have a look <em className="text-gold-deep">in mind?</em>
          </h1>
          <p className="mt-6 max-w-md text-lg leading-relaxed text-muted">
            Don't know the name of the style? Upload your inspiration. A stylist will review your photo, recommend the right service and confirm pricing before anything is booked.
          </p>
          <ol className="mt-10 space-y-5">
            {["Upload a photo and add a few notes", "A stylist reviews it within one business day", "We send your recommended service, price and a booking link"].map((t, i) => (
              <li key={t} className="flex items-center gap-4">
                <span className="grid size-10 shrink-0 place-items-center rounded-full bg-ink font-display text-lg text-gold">{i + 1}</span>
                <span className="text-[0.95rem]">{t}</span>
              </li>
            ))}
          </ol>
        </div>

        <div className="rounded-[1.75rem] bg-white/85 p-6 ring-1 ring-line md:p-10">
          {sent ? (
            <div className="py-12 text-center" role="status">
              <h2 className="text-4xl">Request received</h2>
              <p className="mt-3 text-muted">We'll email {form.email} with a recommendation within one business day.</p>
              <ButtonLink to="/services" variant="secondary" className="mt-8">
                Browse services meanwhile
              </ButtonLink>
            </div>
          ) : (
            <form onSubmit={submit} className="flex flex-col gap-5">
              <div>
                <p className="mb-2 text-sm font-semibold">Inspiration photo</p>
                {image ? (
                  <div className="relative">
                    <img src={image} alt="Your inspiration" className="max-h-80 w-full rounded-2xl object-cover" />
                    <button type="button" onClick={() => setImage(undefined)} className="absolute top-3 right-3 inline-flex min-h-10 items-center gap-1.5 rounded-full bg-ivory/90 px-4 text-sm font-semibold">
                      <Trash2 className="size-4" aria-hidden /> Remove
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={async (e) => {
                      e.preventDefault();
                      const f = e.dataTransfer.files[0];
                      if (f) setImage(await readImage(f).catch(() => undefined));
                    }}
                    className="flex w-full flex-col items-center rounded-2xl border-2 border-dashed border-sand-deep bg-cream/60 px-6 py-12 text-center transition hover:border-gold"
                  >
                    <ImagePlus className="size-9 text-gold-deep" strokeWidth={1.3} aria-hidden />
                    <span className="mt-3 font-semibold">Upload image</span>
                    <span className="text-sm text-muted">Tap to choose, or drag a photo here</span>
                  </button>
                )}
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  tabIndex={-1}
                  aria-hidden
                  onChange={async (e) => {
                    const f = e.target.files?.[0];
                    if (!f) return;
                    try {
                      setImage(await readImage(f));
                      setError("");
                    } catch {
                      setError("We couldn't read that image. Please try a JPG or PNG.");
                    }
                  }}
                />
              </div>
              <Textarea label="Add notes" value={form.notes} onChange={set("notes")} placeholder="Length, colour, anything you'd change from the photo…" />
              <div className="grid gap-5 sm:grid-cols-2">
                <Input label="Name" required value={form.name} onChange={set("name")} autoComplete="name" />
                <Input label="Email" type="email" required value={form.email} onChange={set("email")} autoComplete="email" />
                <Input label="Phone" type="tel" optional value={form.phone} onChange={set("phone")} autoComplete="tel" />
                <Input label="Ideal date" type="date" optional min={dateKey(new Date())} value={form.preferredDate} onChange={set("preferredDate")} />
              </div>
              {error ? (
                <p className="text-sm text-error" role="alert">
                  {error}
                </p>
              ) : null}
              <Button type="submit" size="lg" loading={sending}>
                Request a style consultation
              </Button>
              <p className="text-center text-xs text-muted">Free, with no obligation to book.</p>
            </form>
          )}
        </div>
      </Container>
    </section>
  );
}
