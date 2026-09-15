# BraidsByChi — Frontend

React + Vite + TypeScript + Tailwind v4. Talks only to the Django REST API
in `../backend`. See the repo root `README.md` for the full picture.

## Develop

```bash
npm install
cp .env.example .env.local   # point VITE_API_BASE_URL at your backend
npm run dev                  # http://localhost:5173
```

## Build

```bash
npm run build
```

## Structure

```
src/
  api/         # axios client, typed endpoint wrappers, shared types
  lib/         # timezone display, pagination helper, error-code copy
  context/     # cart state (localStorage-backed), admin session auth
  components/  # shared UI, layouts, Stripe card form, CAPTCHA widget
  pages/public/  # browse -> cart -> slots -> details -> payment -> confirm, /manage/:token
  pages/admin/   # login, bookings dashboard, booking detail, availability, services, client detail
```

## Notes

- CAPTCHA and Stripe gracefully no-op with a visible placeholder when their
  env vars aren't set, so the app is fully clickable in local dev without
  real keys (pair with `CAPTCHA_BYPASS=True` on the backend).
- All timestamps from the API are UTC; display conversion to America/Regina
  happens in `src/lib/timezone.ts`.
