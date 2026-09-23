# Hair by Chi: Luxury Salon Website & Booking Platform

A premium, editorial website for a modern hair studio: discovery, a 5-step
booking flow with add-ons and deposits, customer accounts, and a private
owner dashboard ("Studio").

```
frontend/   React 19 + Vite + TypeScript + Tailwind v4: the website, accounts and Studio dashboard
backend/    Django + DRF API from the first build (unchanged, see "Backend API" below)
```

## Run it

```bash
cd frontend
npm install
npm run dev            # http://localhost:5173
npm run build          # production build in frontend/dist
```

No backend or API keys are needed to try the whole product. See
[How data works right now](#how-data-works-right-now).

| Demo login | Email | Password |
|---|---|---|
| Customer (`/signin`) | `sarah@example.com` | `hairbychi` |
| Owner (`/studio/login`) | `owner@hairbychi.ca` | `studio2026` |

## What's in it

**Customer site**: Home (hero, quick-booking bar, popular services,
categories, why us, before/after sliders, stylists, portfolio, how it works,
reviews, first-visit offer, FAQ, Instagram strip, final CTA) · Services with
category, price, duration, stylist and "available this week" filters ·
Service detail pages with facts, inclusions, prep, add-ons and policy ·
Lookbook with filters, full-screen viewer and "Book this look" · About ·
Stylists and profiles with next openings · Reviews · Contact with hours, map
and form · FAQ · Policies · Find My Style quiz · Inspiration upload
(consultation request) · Sign in / register / reset password.

**Booking**: Service (+ "Make it yours" add-ons) → Stylist (or no
preference) → Date & Time → Details (hair questions, reference photo) →
Review & Payment (deposit or full, promo codes, policy consent) →
Confirmation (.ics / Google Calendar, directions). Availability honours
salon hours, special hours, each stylist's days and hours, existing
bookings, a clean-up buffer, blocked time and minimum notice. The slot is
re-checked just before "payment", so a race shows *"That appointment was just
booked by another client"* with the closest alternatives. Fully booked days
offer **View next available date** and **Join waitlist**. Consultation-first
services (colour, bridal, custom units) book as a pending consultation.

**Customer account**: overview with upcoming appointment, Beauty Rewards
progress and "Book again"; appointments (view, reschedule, cancel with the
policy outcome shown first, add to calendar, review after completion); saved
looks (♡ on any style or photo, kept for guests and merged on sign-in);
payments; profile and hair preferences. Guests manage bookings at
`/appointment/<ref>` by confirming their email.

**Studio (owner dashboard)**: dashboard KPIs and today's schedule with Check
in / Start / Complete / No-show / Cancel · calendar (day / week / month,
block time) · appointments (search, filters, detail drawer, refunds) · inbox
(messages, consultation requests with photos, waitlist) · customers (spend,
visits, no-shows, history) · services (full editor, including photo, add-ons,
stylists, consultation and active flags) · staff (hours, days, commission,
time off, 30-day stats) · payments · review moderation · discounts · gallery
uploads · reports (revenue by month, top services, stylist performance and
commission, no-show / cancellation / add-on rates) · settings (weekly hours,
holidays, booking rules that feed the policy copy, reminder outbox, reset
demo).

Statuses: Pending, Confirmed, Checked in, In progress, Completed, Cancelled,
No-show.

## Design system

`frontend/src/index.css` defines the tokens: ivory `#FAF7F2`, ink
`#1C1816`, sand `#EDE4D8`, gold `#B99563`, rose `#D9B5AA`, plus status colours.
Type is Cormorant Garamond (headings) with Manrope (body), both self-hosted
through Fontsource. Shared components live in `frontend/src/ui/`: buttons
(primary / secondary / text), form fields, service / stylist / review cards,
calendar, date-time picker, modal, before/after slider, toasts, empty states and
skeletons. The site is mobile-first, with a sticky Book Now bar and a price
+ Book bar on service pages. Accessibility: visible focus rings,
keyboard-operable dialogs and sliders, labelled fields, and availability
shown with text and shape rather than colour alone. Reduced-motion
preferences are respected.

**Photography:** every image slot shows an on-brand illustration until a
real photo is dropped into `frontend/public/images/` at the documented path
(see `frontend/public/images/README.md`), or uploaded from the Studio.

## How data works right now

> ⚠️ **The new frontend runs on a browser-local demo data layer, not the Django API.**

All catalogue data, bookings, accounts and settings live in
`frontend/src/store/store.ts`, seeded from `frontend/src/data/catalog.ts` and
persisted to `localStorage`. This lets the complete product be clicked
through as a static site, but it is **not production-safe**:

- **Auth is demo-only.** Passwords are hashed client-side for storage
  hygiene only, and roles are checked in the browser. Real login, email
  verification, password reset and role-based access must be server-side.
- **Payments are simulated.** The card field is a placeholder; nothing is
  charged. Wire Stripe Payment Element / Apple Pay / Google Pay via a server-
  created PaymentIntent (the existing backend already has Stripe plumbing).
- **Emails and reminders are simulated** as an outbox visible in Studio →
  Settings.
- **Data is per-browser.** Clients can't see each other's bookings and the
  owner can't see real bookings until the store is backed by the API.

Every mutation is a single function in `store/store.ts` or `store/studio.ts`,
which is the seam to replace with API calls. The Django backend does not yet
model multiple stylists, add-ons, customer accounts, reviews, gallery,
waitlist or discounts, so those need new models and endpoints first.

The previous frontend's files (`src/api`, `src/components`, `src/context`,
`src/pages/public`, `src/pages/admin`, and the old `src/lib` helpers) are no
longer routed and can be deleted once the API integration no longer needs them
for reference.

## Deploying the frontend

`frontend/vercel.json` rewrites all routes to `index.html` for client-side
routing. On another static host, add the equivalent SPA fallback.

---

# Backend API (first build)

A guest-only booking site for an independent hair stylist: clients browse
services, pick a time, and submit a **request** (never an instant booking);
the stylist reviews, approves, or declines from a TOTP-secured admin
dashboard. Built from the product docs supplied for this project
(`01-prd-updated.md` and the Lovable frontend guide) — see
[Deviations & assumptions](#deviations--assumptions-from-the-docs) below for
every place this implementation had to fill a gap or pick a default.

```
backend/    Django + Django REST Framework API (Railway)
frontend/   React + Vite + TypeScript + Tailwind (Vercel)
```

## Quick start (local dev)

**Backend**

```bash
cd backend
python3 -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env            # CAPTCHA_BYPASS=True keeps CAPTCHA a no-op locally
python manage.py migrate
python manage.py seed_demo_data       # sample categories/services + Tue–Sat 9–5 hours
python manage.py bootstrap_admin      # prints a TOTP secret + backup codes — SAVE THESE
python manage.py runserver            # http://localhost:8000
```

Scan the printed `otpauth://` URI into any authenticator app (Google
Authenticator, Authy, 1Password, …) to log into `/admin/login`.

**Frontend** (separate terminal)

```bash
cd frontend
npm install
cp .env.example .env.local      # VITE_API_BASE_URL=http://localhost:8000
npm run dev                     # http://localhost:5173
```

With no Stripe/CAPTCHA keys configured, both the card form and the CAPTCHA
widget render a clearly-labelled dev placeholder instead of loading
third-party scripts — the full booking flow is clickable end-to-end without
any external credentials, and was verified this way (see
[What's been verified](#whats-been-verified)).

**Run the backend test suite**

```bash
cd backend && python manage.py test
```

Covers the deposit math, strike escalation, buffer/slot conflict handling,
and the pending → approve/decline lifecycle (`bookings/tests.py`).

## Architecture

| Layer | Choice | Why |
|---|---|---|
| API | Django 5 + DRF | matches the PRD's Railway/Django target, batteries-included admin auth & ORM |
| DB | SQLite (dev) / Postgres via `DATABASE_URL` (prod) | Railway Postgres plugin sets `DATABASE_URL` automatically |
| Payments | Stripe (SetupIntent at submit, capture at approval) | PRD Section 6 — never charge before manual approval |
| Email | Resend HTTP API, or console-logged when unconfigured | PRD Section 7 |
| Admin auth | `pyotp` TOTP + hashed one-time backup codes, custom session token | PRD Section 9 — "decoupled, reusable auth module," not Django's own `auth.User` |
| Frontend | React + Vite + TS + Tailwind v4 | Lovable's default stack per the frontend guide |

Apps in `backend/`: `catalog` (services/categories), `clients`, `bookings`
(the core state machine + business rules in `bookings/services.py`),
`availability` (recurring hours, day blocks, slot computation), `adminauth`,
`payments`, `notifications`, `common` (pagination, error shape, timezone
helpers).

### Business rules implemented

- **Buffer** (AV-06): a single global `BUFFER_MINUTES` (default 30) is
  appended once after every appointment when computing
  `calendar_blocked_until`; it is never part of the duration a client sends
  or sees.
- **Deposit** (6.1): flat deposit only above `DEPOSIT_THRESHOLD_AMOUNT`,
  `DEPOSIT_AMOUNT_SINGLE_SERVICE` vs `DEPOSIT_AMOUNT_MULTI_SERVICE` — all
  three are env constants, never stylist-editable.
- **Strikes** (8.1): a no-show or a late (< `CLIENT_ACTION_CUTOFF_HOURS`)
  client cancellation increments `Client.strike_count`; at
  `STRIKE_HIGH_RISK_COUNT` (default 2) `high_risk_flag` is set and every
  future booking requires full payment upfront. Cleared only manually by
  the stylist (never auto-reset). Repeat-client matching is by email OR
  phone.
- **Concurrent pending requests** (Section 3, Workflow 6): both are
  accepted; approving one auto-declines any other pending request
  overlapping the same (service + buffer) window.
- **Blocked day** (Section 5): blocks immediately; any already-approved
  booking that day is flagged into a resolution queue and gets the
  immediate generic email, then the specific refund/reschedule email once
  the stylist resolves it individually. That reschedule doesn't touch the
  client's normal one-time reschedule limit.
- **Soft-archive only** — no hard delete of bookings anywhere in the API.

## Deviations & assumptions from the docs

The uploaded docs were `01-prd-updated.md` and the Lovable frontend guide.
Both explicitly reference several other canonical docs
(`06-api-contracts.md`, `05-error-messages.md`, `02-data-model-schema.md`,
etc.) that were **not** included in this build's inputs. Where those gaps
mattered, here's exactly what was decided and why — check these against the
real docs before shipping:

| Item | What this build does | Why |
|---|---|---|
| **Deposit threshold amount** ⚠️ OPEN in PRD | Defaults to `$75.00` via `DEPOSIT_THRESHOLD_AMOUNT` env var | PRD explicitly leaves this undecided; a working default was needed so the deposit engine (and its tests) function. **Change the env var — no code change needed.** |
| **Admin session timeout** ⚠️ OPEN in PRD | Defaults to 60 minutes via `ADMIN_SESSION_TIMEOUT_MINUTES` | Same — PRD Section 9 leaves this undecided. |
| **Tax handling** ⚠️ BLOCKING in PRD | Not implemented — prices are treated as final, no tax line | PRD says this needs an accountant's sign-off before build; adding either tax-inclusive pricing or Stripe Tax without that answer would be guessing at a compliance question. |
| **Card-surcharge disclosure** ⚠️ OPEN in PRD | Not implemented — no surcharge is added or itemized | Same reasoning: PRD flags this as needing a legal/compliance check. |
| **`05-error-messages.md`** (not supplied) | `frontend/src/lib/errors.ts` has plain-English copy per error code, clearly commented as a placeholder | The frontend guide requires mapping codes to copy; without the real copy doc, reasonable non-technical strings were written instead of guessing the client's exact wording. |
| **`POST /api/bookings/precheck`** (not in the original endpoint checklist) | Added: takes `service_ids`, `email`, `phone`; returns the same deposit/strike-warning shape as booking creation, without creating a booking or requiring CAPTCHA | The PRD requires an inline strike warning "before payment" (Section 7 / ST-06) and a deposit preview, but guest contact info (needed to look up strike history) isn't collected until BK-05, one step before payment — there is no documented endpoint that produces this preview at that point. |
| **`POST /api/payments/setup-intent`** (not in the checklist table) | Added: creates a Stripe SetupIntent server-side (using the secret key) and returns its `client_secret` | Stripe.js cannot create a SetupIntent from a publishable key alone — some server endpoint has to exist for the documented "Setup Intent via Stripe.js" flow to work at all. |
| **`POST /api/admin/uploads/proof`** (not in the checklist table) | Added: multipart upload, returns a `proof_url` to pass into the existing `approve` body | The approve contract's `{ proof_url, proof_note }` shape is unchanged; this just gives the dashboard a way to produce a real `proof_url` for a file the stylist has on her computer, matching "she uploads proof… attached to the booking record." |
| **`POST /api/admin/bookings/:id/resolve-conflict`** (not in the checklist table) | Added: `{ action: "cancel" \| "reschedule", new_start_time? }` | The PRD describes the blocked-day resolution workflow (Section 5) in detail but the original endpoint list has no action for it — this is the endpoint AV-04's "resolution queue" needs to actually be processed. |
| Proof-of-payment file storage | Local filesystem (`MEDIA_ROOT`) via Django's default storage | **Known limitation**: on Railway this is ephemeral and will not survive a redeploy. Swap `STORAGES["default"]` for an S3-compatible backend (or Supabase Storage) before production launch. |
| Slot granularity | Candidate start times are generated every 30 minutes (`SLOT_GRANULARITY_MINUTES`) | Not specified anywhere in the supplied docs; 30 minutes is a common, editable default. |
| CAPTCHA / Stripe absent locally | Both render an inline dev placeholder instead of loading the real widget/script | Lets the entire flow be exercised (and was exercised, end-to-end, via a headless browser — see below) without live third-party credentials. |

Everything else — statuses, field names, the pagination envelope, the
Monday=0 weekday convention, buffer visibility rules, etc. — follows the two
supplied docs directly.

## What's been verified

This was built and checked, not just written:

- `backend`: `python manage.py check` clean; 13 unit tests covering deposit
  tiers, strike escalation to high-risk, offline-approval-requires-proof,
  no-show-requires-note, manual override gating, buffer-aware slot
  conflicts, and the "two pending → approve one, auto-decline the other"
  workflow — all passing.
- `frontend`: `npm run build` (TypeScript strict + Vite) with zero errors.
- End-to-end, via a headless Chromium session driving the real dev servers:
  browse → add to cart → pick a slot → guest details → offline payment →
  submit → confirmation screen; the admin login → pending booking →
  approve-with-proof-upload → mark-arrived flow; the guest `/manage/:token`
  cancel flow; and blocking a day → resolution queue appearing →
  rescheduling the affected booking from the dashboard.

## Deploying

- **Backend → Railway**: set the env vars from `backend/.env.example`,
  attach a Postgres plugin (sets `DATABASE_URL` automatically), the
  `Procfile`'s `release: migrate` runs on every deploy. Run
  `python manage.py bootstrap_admin` once per environment (staging and
  production need separate TOTP credentials per PRD Section 12).
- **Frontend → Vercel**: set the env vars from `frontend/.env.example`,
  point `VITE_API_BASE_URL` at the Railway API host, set `CORS_ALLOWED_ORIGINS`
  on the backend to the Vercel origin.
- Schedule `python manage.py expire_pending_bookings` (Railway cron, or any
  scheduler) every few minutes to auto-expire unactioned pending requests
  past their requested time (PRD Section 3).
