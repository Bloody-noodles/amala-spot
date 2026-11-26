# Project Overview

Amala Spot is an independent Nigerian food discovery and demonstration-ordering concept. It is not operated by the real-world business that inspired it. Catalogue and price data are illustrative unless independently verified.

## Current execution direction

Follow `amala_spot_full_codex_plan.md`: Banh Mi World informs composition and interaction principles; the Amala Spot identity uses warm cream, orange-red, golden yellow, and deep brown. Build distinct home, full menu, about, gallery, checkout, tracking, and admin experiences. Keep the existing Next.js app, Supabase order/menu architecture, Gemini assistant route, and entrance sequence.

## Boundaries

- Demo checkout only; no payment credentials, payment processing, dispatch, or real fulfilment.
- Never expose server secrets or trust client prices or AI tool arguments.
- Use integer kobo in storage and server-side order validation.
- Do not deploy/promote to production without owner approval.
- Batica Sans is loaded as the display face from `public/fonts/BaticaSans-Regular.otf`; the owner confirmed its site licence.
- Item-specific verified imagery is required for visual completion. Never imply generic or unverified imagery is item-specific.

## Architecture

One Next.js App Router application. Supabase is the source of truth when configured; static fallback data is illustrative. The public menu API, order creation RPC, private-key order tracking, admin endpoints, and Gemini chat endpoint already exist. Shared client ordering state should connect catalogue actions, assistant suggestions, basket, and checkout.
