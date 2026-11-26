# Engineering Decisions

## 2026-11-22 — Baseline design brief and shared storefront state (historical)

- The newer `amala_spot_full_codex_plan.md` supersedes the earlier Kaiseki/crimson direction in this file and related legacy documentation. Banh Mi World informs composition only; Amala Spot uses the plan's cream/orange-red/yellow/deep-brown palette.
- App-wide order state now lives in an ordering provider in the shared layout. Menu actions and the existing food assistant add to that same basket; checkout uses the existing order API.
- Batica remains the required display font, but no licensed webfont file is available in the workspace. The current design uses a documented system fallback. Do not report Batica as implemented.
- No item-specific food images are present. The catalogue uses clearly labelled graphic placeholders while the photo audit is outstanding; these are not represented as dish photography.
- The global public shell includes navigation, basket access, mobile basket bar, assistant, and footer. Admin remains on its existing dedicated shell. Tracking retains the existing private-key workflow.
- Git metadata, preview deployment state, and real browser inspection are unavailable in this workspace. No production deployment was attempted.

## 2026-11-26 — Current implementation status

- The owner confirmed `BaticaSans-Regular.otf` is licensed for this site. It is loaded as the display face from `public/fonts/`; system sans-serif and Georgia remain the body/editorial stacks.
- All 41 fallback menu items have local item-matched photos, alt text, and attribution records. Owner-provided Ofada and Five Alive Berry Blast photos are approved for use. The source mapping and visual review notes are in `docs/IMAGE_ASSET_AUDIT.md` and `public/images/menu/ATTRIBUTION.md`.
- The homepage, menu, and curated gallery use the mapped local photo set. Browser-rendered crop review, the live Supabase catalogue comparison, and configured service journeys remain outstanding; consult `docs/IMPLEMENTATION_STATUS.md` for evidence and limitations.
- The shared shell, menu, assistant, basket, checkout, tracking, and admin flows remain on the existing application and data architecture. No production deployment or change was made.

## 2026-11-26 â€” Readable type, editorial menu cards, and live voice

- Sinteca Medium/Bold handle interface text and navigation; Batica remains for display headings, with Georgia used selectively for editorial copy. Navigation and actions were enlarged for comfortable scanning.
- Featured dishes use framed, individually art-directed photo treatments; the full menu uses responsive image cards with clear price and add actions.
- Voice mode follows the Patisso live-audio pattern: a same-origin rate-limited server route issues a one-use, short-lived Gemini token; the browser streams microphone audio over Gemini Live and returns audio to the visitor. Gemini receives the current menu and can only add exact menu items to the shared sample basket after clear visitor confirmation.
- Text chat remains available. Voice requires a configured Gemini key, microphone permission, supported secure browser audio APIs, and Gemini Live service availability. No order submission or production deployment was added.

## Accepted
- Next.js App Router + TypeScript.
- Supabase PostgreSQL/Auth.
- Gemini as AI provider.
- Gemini Live voice calls with typed fallback.
- Vercel deployment.
- Single application; no separate backend initially.
- Demonstration checkout only; no payment gateway or real fulfilment.
- Integer kobo for NGN.
- Shared server-side domain services for website and AI.

## Open at 2026-11-26
- Verify fallback catalogue coverage and prices against authorized non-production Supabase data.
- Run configured assistant, voice, saved-order, tracking, and admin journeys in a safe service environment.
- Trigger and inspect the Vercel Preview, including responsive screenshots and browser-rendered image crops.
- Complete manual keyboard and screen-reader review.
- Recover the repository's Git branch/commit and Preview credentials so the protected workflow can run.

Record changes with date, rationale, alternatives, and consequences.


## 2026-10-30 — Canonical assistant suggestions and atomic order transitions
- The assistant API returns validated suggestion details from the same live menu snapshot used to ground its response. The storefront refreshes its canonical menu before rendering the basket action, avoiding a static-catalogue mismatch.
- Admin order status changes and order-event history are written through one PostgreSQL function with row locking and an explicit transition graph. This prevents an order status from changing without its corresponding audit event.
- The new database function is delivered as migration `0002_atomic_order_status.sql`; apply it in Supabase before relying on the updated admin status endpoint.
