# Engineering Decisions

## Accepted
- Next.js App Router + TypeScript.
- Supabase PostgreSQL/Auth.
- Gemini as AI provider.
- Turn-by-turn voice with typed fallback.
- Vercel deployment.
- Single application; no separate backend initially.
- Demonstration checkout only; no payment gateway or real fulfilment.
- Integer kobo for NGN.
- Shared server-side domain services for website and AI.

## Open
- Exact fonts and final palette after reference audit.
- Full section inventory and precise responsive behaviour from Kaiseki.
- Final catalogue content and verified prices, if available.
- Exact schema, RLS policies, API contracts, and admin roles.
- Gemini model and current quota/pricing.
- Image licensing and asset pipeline.
- Testing stack and production domain.

Record changes with date, rationale, alternatives, and consequences.


## 2026-10-30 — Canonical assistant suggestions and atomic order transitions
- The assistant API returns validated suggestion details from the same live menu snapshot used to ground its response. The storefront refreshes its canonical menu before rendering the basket action, avoiding a static-catalogue mismatch.
- Admin order status changes and order-event history are written through one PostgreSQL function with row locking and an explicit transition graph. This prevents an order status from changing without its corresponding audit event.
- The new database function is delivered as migration `0002_atomic_order_status.sql`; apply it in Supabase before relying on the updated admin status endpoint.
