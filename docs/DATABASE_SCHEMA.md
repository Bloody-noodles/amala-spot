# Database Schema

Planned relational model; final SQL migrations, exact columns, constraints, indexes, and RLS policies must be reviewed before production use.

| Table | Responsibility |
|---|---|
| categories | Category records and ordering |
| menu_items | Canonical menu item data |
| menu_item_images | Item image references |
| modifier_groups | Modifier group definitions |
| modifier_options | Selectable modifier options |
| menu_item_modifier_groups | Allowed modifier links |
| item_availability | Current availability |
| customers | Minimal contact details |
| orders | Demonstration order header |
| order_items | Immutable item snapshots |
| order_item_modifiers | Modifier snapshots |
| order_events | Order lifecycle history |
| admin_profiles | Roles linked to auth.users |

## Invariants
- Store NGN as integer kobo.
- Never trust browser-submitted prices or totals.
- Snapshot item names, prices, and selected modifiers on order creation.
- Order header, lines, modifiers, and initial event must be atomic.
- Cart can remain client-side initially.
- Public order lookup requires a secure token, not only a predictable reference.
- RLS denies public access to customer/order records and restricts admin writes.

## First migration: persistent ordering

Apply `supabase/migrations/0001_initial_schema.sql` to a new Supabase project using the SQL Editor or Supabase CLI. It creates:

- `menu_categories`, `menu_items`, and `menu_item_options`, seeded from the current illustrative 18-item catalogue.
- `orders`, `order_items`, `order_item_options`, and `order_events` for immutable order snapshots and lifecycle history.
- RLS on all tables. Public read policies are limited to active categories and available menu records; order/customer tables have no public policies.
- `create_customer_order(jsonb)`, a SECURITY DEFINER RPC callable only by `service_role`. It validates availability and modifier relationships again in PostgreSQL, calculates totals from database prices, writes the header/lines/options/event in one transaction, and stores only a SHA-256 hash of a cryptographically random lookup token.

The Next.js order route calls this RPC only when both `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are configured. Otherwise it deliberately remains in demo-receipt mode. The service-role key must exist only in server-side environment variables; never prefix it with `NEXT_PUBLIC_` or commit it.

## Configure a Supabase-backed test environment

1. Create a Supabase project for this independent concept.
2. Apply the migration above.
3. In Vercel Project Settings → Environment Variables, set `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` for the intended environment. Use the project URL and the service-role/secret key from Supabase API settings.
4. Redeploy after adding the variables.
5. Place a clearly labelled test order and verify the order header, line snapshots, option snapshots, and initial `received` event in the Supabase Table Editor.

The anon key remains in `.env.example` for future public menu reads, but this order-write path does not need it. No payment gateway, restaurant dispatch, customer-facing order lookup, admin interface, or production fulfilment is enabled by this migration. Do not enter real customer data into this showcase until privacy, retention, access, and fulfilment processes are designed and approved.
