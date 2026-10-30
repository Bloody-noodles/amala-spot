# Testing Strategy

## Required checks
- ESLint.
- TypeScript type check.
- Production build.
- Component tests for interactive UI.
- Unit tests for price calculation, modifier validation, and cart validation.
- API tests for invalid payloads, stale prices, unavailable items, and duplicate submission.
- Authorization tests for admin routes and customer/order data.
- End-to-end tests for browse -> cart -> demo checkout and typed assistant flows.
- Responsive checks at desktop, tablet, and mobile widths.
- Accessibility checks for keyboard navigation, labels, focus, and reduced motion.

Do not report a check as passed unless it was run. Record unavailable test coverage as a limitation.


## Regression coverage added in the live-menu and order-status integration milestone
- Assistant suggestions include the canonical live menu item snapshot rather than relying on static fallback IDs.
- Selecting an assistant suggestion refreshes the storefront's canonical menu before the basket action is available.
- Admin order status and its audit event are committed atomically through `transition_customer_order_status`.
- Concurrent or stale status updates are rejected by the database transition guard.
- Apply Supabase migrations in order before deploying code that calls a newly introduced RPC.
