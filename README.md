# KejaLink

KejaLink is a Kenyan room-finder web app. Tenants browse live rooms on a map, pay a small M-Pesa fee to unlock a caretaker's contact details, and book a viewing. Caretakers (building admins) manage their building's rooms from a dashboard, and super admins approve listings and manage buildings.

Built with Next.js (App Router), Supabase (Postgres + Auth + Storage), Google Maps, Tailwind CSS 4, and Safaricom M-Pesa Daraja.

## Roles

- **Tenant** — anonymous; identified by a signed phone-number session cookie after paying for an unlock pass (24h or 48h).
- **Building admin (caretaker)** — email/password account linked to one building. Adds rooms, confirms availability, manages bookings.
- **Super admin** — approves/rejects room listings, creates buildings and caretaker accounts, resolves reports.

## Getting started

```bash
npm install
cp .env.example .env.local   # fill in your values
npm run dev
```

Open http://localhost:3000.

## Environment variables

See `.env.example`. Summary:

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase client (browser-safe) |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-side privileged DB access (API routes only — never expose) |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Map + location picker |
| `SESSION_SECRET` | HMAC key signing the tenant phone-session cookie |
| `CRON_SECRET` | Bearer token guarding `/api/cron/hide-stale` |
| `MPESA_MOCK` | `true` = fake instant payments (demo/dev); `false` = real Daraja |
| `MPESA_ENV` | `sandbox` or `production` |
| `MPESA_CONSUMER_KEY` / `MPESA_CONSUMER_SECRET` | Daraja app credentials |
| `MPESA_SHORTCODE` / `MPESA_PASSKEY` | Lipa Na M-Pesa Online shortcode + passkey |
| `MPESA_CALLBACK_URL` | Public URL Safaricom POSTs STK results to (`/api/mpesa/callback`) |

When `MPESA_MOCK=true` or Daraja credentials are absent, payments are simulated: passes are marked `paid` instantly so the app is fully demoable without Safaricom credentials.

## Database setup

Apply the SQL files in `supabase/` in order in the Supabase SQL editor:

1. `schema.sql` — base tables (buildings, users, rooms, reports)
2. `part3.sql` … `part7.sql`, `fix-links.sql` — bookings, passes, storage bucket, admin linking
3. `part8.sql` — booking ref-code uniqueness
4. `part9.sql` — reviews
5. `part10.sql` — notifications + triggers

The `room-photos` Storage bucket (public read, anon upload) is created by the migrations.

## Payments flow

1. Tenant taps **Unlock** on a room → `POST /api/mpesa/stkpush` → Daraja STK push to their phone (or instant mock pass in mock mode).
2. Safaricom POSTs the result to `/api/mpesa/callback`, which flips the pass to `paid` (with expiry) or `failed`.
3. The client polls `GET /api/mpesa/status?checkoutRequestId=…` until the pass resolves.
4. A valid `paid` pass (via the signed session cookie) gates the caretaker contact details and `POST /api/bookings`.

Bookings can be cancelled by the tenant (`POST /api/bookings/cancel` with the booking ref code) or confirmed/cancelled by the caretaker (`POST /api/bookings/status`, bearer-token authenticated).

## Cron

`vercel.json` schedules `GET /api/cron/hide-stale` daily: rooms not confirmed available by their caretaker for 14+ days are automatically hidden. Vercel Cron sends the `Authorization: Bearer $CRON_SECRET` header automatically when the env var is set.

## Scripts

```bash
npm run dev    # dev server
npm run build  # production build
npm run lint   # eslint
```

## Project layout

- `app/` — pages (App Router): public home/search/room, `/dashboard` (caretaker), `/admin` (super admin), `/login`
- `app/api/` — route handlers: `mpesa/`, `bookings/`, `reviews/`, `notifications/`, `admin/`, `auth/`, `cron/`
- `components/` — shared UI (modals, cards, map, notification bell, reviews)
- `lib/` — Supabase clients, session signing, auth providers
- `supabase/` — SQL migrations (apply in order)
