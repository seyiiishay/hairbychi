import { Link } from "react-router-dom";
import { PrimaryButton } from "../../components/Shared";

export default function Home() {
  return (
    <div className="space-y-16">
      <section className="text-center">
        <p className="text-sm font-medium uppercase tracking-wide text-brand-600">Independent hair stylist</p>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight text-stone-900 sm:text-5xl">BraidsByChi</h1>
        <p className="mx-auto mt-4 max-w-md text-stone-500">
          Braids, twists, and styling — request a time that works for you and I'll confirm it personally.
        </p>
        <div className="mt-8 flex justify-center">
          <Link to="/book">
            <PrimaryButton className="px-8 py-3 text-base">Book now</PrimaryButton>
          </Link>
        </div>
      </section>

      <section className="grid gap-6 sm:grid-cols-3">
        {[
          {
            title: "Pick your service(s)",
            body: "Browse by category — braids, twists, styling — and add as many as you like to one booking.",
          },
          {
            title: "Choose a time",
            body: "See real availability and pick a slot that works for your schedule.",
          },
          {
            title: "Request & wait for confirmation",
            body: "Every request is reviewed personally — you'll get an email as soon as it's approved.",
          },
        ].map((step, i) => (
          <div key={step.title} className="rounded-xl border border-stone-200 bg-white p-5 text-center shadow-sm">
            <div className="mx-auto mb-3 flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-sm font-semibold text-brand-700">
              {i + 1}
            </div>
            <h3 className="font-medium text-stone-900">{step.title}</h3>
            <p className="mt-1 text-sm text-stone-500">{step.body}</p>
          </div>
        ))}
      </section>

      <section className="rounded-2xl border border-brand-100 bg-brand-50 p-8 text-center">
        <h2 className="text-lg font-medium text-stone-900">Already have a booking?</h2>
        <p className="mt-1 text-sm text-stone-500">
          Use the manage link from your confirmation email to cancel or reschedule.
        </p>
      </section>
    </div>
  );
}
