# System Architecture

## Application shape
One Next.js App Router application with clear server/client boundaries. No separate Express/FastAPI service or microservices initially.

## Responsibilities
- Next.js: UI, route handlers, server-side orchestration, validation.
- Supabase PostgreSQL: canonical menu, modifiers, availability, customers, demonstration orders.
- Supabase Auth: admin authentication.
- Gemini API: natural-language understanding and approved tool selection.
- Vercel: hosting and deployment.

## Data flow
Browser UI / assistant -> Next.js route handler -> validation + domain service -> Supabase.
Gemini requests approved tools through the server; it never connects directly to the database.

## Shared domain services
Menu lookup, price/availability validation, modifier validation, cart validation, order creation, and order summaries must be reusable by both regular UI and AI tool handlers.

## Security
Keep Gemini and Supabase service-role secrets server-side. Apply RLS and server-side admin checks. Recalculate all order totals on the server. Treat model output and browser input as untrusted.
