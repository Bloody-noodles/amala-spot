# Security and Validation

- Keep Gemini and Supabase service-role keys server-side.
- Use Supabase RLS for all customer/order data.
- Enforce admin roles server-side on every admin operation.
- Validate external input with Zod.
- Treat model tool arguments as untrusted.
- Re-fetch menu data and recalculate prices/totals at checkout.
- Validate quantities, availability, and modifier relationships.
- Use idempotency protection for order submission where practical.
- Do not expose customer records or order details publicly.
- Protect order lookup with a secure token, not a guessable order number.
- Rate-limit order and assistant endpoints.
- Return safe errors without secrets, stack traces, or internal database details.
- Do not collect payment credentials.
- Never commit .env files or secrets.
