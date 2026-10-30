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
