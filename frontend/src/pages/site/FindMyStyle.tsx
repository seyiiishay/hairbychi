import { useState } from "react";
import { ArrowLeft, RotateCcw, Sparkles } from "lucide-react";
import type { Service, StyleGoal } from "../../data/types";
import { cn } from "../../lib/format";
import { useStore } from "../../store/store";
import { Button, ButtonLink } from "../../ui/Button";
import { Container } from "../../ui/bits";
import { ServiceCard } from "../../ui/cards";

type Time = "u2" | "2-4" | "4";
type Budget = "u100" | "100-200" | "200";

const QUESTIONS = [
  {
    key: "goal",
    title: "What are you looking for?",
    options: [
      { v: "protective", label: "Protective style", hint: "Give my hair a rest" },
      { v: "natural", label: "Natural style", hint: "Celebrate my texture" },
      { v: "occasion", label: "Special occasion", hint: "Wedding, event, photos" },
      { v: "quick", label: "Quick style", hint: "In and out" },
      { v: "low-maintenance", label: "Low maintenance", hint: "Wake up and go" },
    ],
  },
  {
    key: "time",
    title: "How much time do you want to spend?",
    options: [
      { v: "u2", label: "Under 2 hours" },
      { v: "2-4", label: "2 to 4 hours" },
      { v: "4", label: "4+ hours", hint: "I'll bring a book" },
    ],
  },
  {
    key: "budget",
    title: "Your budget",
    options: [
      { v: "u100", label: "Under $100" },
      { v: "100-200", label: "$100 to $200" },
      { v: "200", label: "$200+" },
    ],
  },
] as const;

function score(svc: Service, goal: StyleGoal, time: Time, budget: Budget) {
  let n = 0;
  if (svc.goals.includes(goal)) n += 3;
  const m = svc.minutes;
  if ((time === "u2" && m < 120) || (time === "2-4" && m >= 120 && m <= 240) || (time === "4" && m > 240)) n += 2;
  const p = svc.price;
  if ((budget === "u100" && p < 100) || (budget === "100-200" && p >= 100 && p <= 200) || (budget === "200" && p > 200)) n += 2;
  else if (budget === "200" || (budget === "100-200" && p < 100)) n += 1; // under budget is still a fit
  return n;
}

export default function FindMyStyle() {
  const s = useStore();
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const step = Object.keys(answers).length;
  const done = step >= QUESTIONS.length;
  const q = QUESTIONS[Math.min(step, QUESTIONS.length - 1)];

  const results = done
    ? s.services
        .filter((x) => x.active && x.categoryId !== "addons")
        .map((x) => ({ x, n: score(x, answers.goal as StyleGoal, answers.time as Time, answers.budget as Budget) }))
        .filter((r) => r.n >= 3)
        .sort((a, b) => b.n - a.n || Number(b.x.popular) - Number(a.x.popular))
        .slice(0, 3)
        .map((r) => r.x)
    : [];

  return (
    <section className="relative min-h-[80vh] overflow-hidden bg-cream">
      <div className="pointer-events-none absolute -top-24 -right-24 size-[520px] rounded-full bg-rose-soft blur-3xl" aria-hidden />
      <Container className="relative max-w-4xl py-14 md:py-20">
        <p className="eyebrow mb-4 flex items-center gap-2">
          <Sparkles className="size-4" aria-hidden /> Find My Style
        </p>
        {!done ? (
          <div key={step} className="animate-fade-up">
            <p className="mb-2 text-sm text-muted">
              Question {step + 1} of {QUESTIONS.length}
            </p>
            <div className="mb-8 flex gap-1.5" aria-hidden>
              {QUESTIONS.map((_, i) => (
                <span key={i} className={cn("h-1 flex-1 rounded-full transition", i <= step ? "bg-gold" : "bg-sand-deep")} />
              ))}
            </div>
            <h1 className="text-5xl leading-[1.02] md:text-7xl">{q.title}</h1>
            <div className="mt-10 grid gap-3 sm:grid-cols-2">
              {q.options.map((o) => (
                <button
                  key={o.v}
                  onClick={() => setAnswers({ ...answers, [q.key]: o.v })}
                  className="group flex min-h-20 items-center justify-between rounded-2xl bg-white/80 px-6 py-5 text-left ring-1 ring-line transition hover:-translate-y-0.5 hover:ring-ink"
                >
                  <span>
                    <span className="block font-display text-2xl">{o.label}</span>
                    {"hint" in o ? <span className="text-sm text-muted">{o.hint}</span> : null}
                  </span>
                  <span className="grid size-9 place-items-center rounded-full border border-line transition group-hover:bg-ink group-hover:text-ivory" aria-hidden>
                    →
                  </span>
                </button>
              ))}
            </div>
            {step > 0 ? (
              <button
                onClick={() => {
                  const next = { ...answers };
                  delete next[QUESTIONS[step - 1].key];
                  setAnswers(next);
                }}
                className="mt-8 inline-flex min-h-11 items-center gap-2 text-sm font-semibold"
              >
                <ArrowLeft className="size-4" aria-hidden /> Back
              </button>
            ) : null}
          </div>
        ) : (
          <div className="animate-fade-up">
            <h1 className="text-5xl md:text-7xl">
              We think you'd <em className="text-gold-deep">love:</em>
            </h1>
            {results.length ? (
              <div className="mt-10 grid gap-x-6 gap-y-10 sm:grid-cols-3">
                {results.map((r) => (
                  <ServiceCard key={r.id} service={r} />
                ))}
              </div>
            ) : (
              <p className="mt-6 text-muted">Nothing matches all three exactly. Try a different budget or time, or share a photo and we'll recommend something.</p>
            )}
            <div className="mt-12 flex flex-col gap-3 sm:flex-row">
              <Button variant="secondary" onClick={() => setAnswers({})}>
                <RotateCcw className="size-4" aria-hidden /> Start over
              </Button>
              <ButtonLink to="/inspiration" variant="text" arrow>
                Have a photo instead? Upload your inspiration
              </ButtonLink>
            </div>
          </div>
        )}
      </Container>
    </section>
  );
}
