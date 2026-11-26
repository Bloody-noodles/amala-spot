# AI Assistant Specification

## Provider and interaction
Use Google Gemini through server-side Next.js routes. Text chat remains available; supported browsers can start an interruptible live-audio voice call. Verify model availability, quotas, and pricing before deployment.

### Model verification (26 November 2026)

The existing route uses `gemini-3.5-flash-lite` first and `gemini-3.8-flash` as fallback. Google's current model list identifies both as available models. The published paid standard rates checked today are $0.30 input / $2.50 output per million tokens for 3.5 Flash-Lite, and $0.75 input / $3.75 output per million tokens for 3.8 Flash through 31 December 2026 (published to change to $1.50 / $7.50 on 1 January 2027). Free-tier availability varies by model and account. Per-project quota numbers cannot be verified without access to the project's AI Studio rate-limit page; check that page before production use. Recheck pricing and availability before deployment.

Sources: [Gemini model list](https://ai.google.dev/gemini-api/docs/models), [Gemini API pricing](https://ai.google.dev/gemini-api/docs/pricing), [rate limits](https://ai.google.dev/gemini-api/docs/rate-limits).

## Voice path
The browser requests microphone access after the visitor starts a call, then requests a one-use, short-lived Gemini session token from `/api/assistant/token`. The server verifies same-origin requests, limits call attempts, and creates the token with the server-only `GEMINI_API_KEY`. The browser streams 16 kHz mono PCM over Gemini Live's WebSocket and plays 24 kHz response audio. The API key never reaches the browser. Voice availability depends on microphone permission, HTTPS (or localhost), browser audio support, the live model, and Gemini quota; typed chat remains available as a fallback.

Live voice uses the current menu snapshot in its system instruction. Its only application action is adding exact, validated item IDs and quantities to the shared demo basket after the visitor clearly confirms. Voice cannot submit an order, take payment, or contact a restaurant. The Gemini function call is treated as untrusted input.

## Tool concepts
- get_menu_categories
- search_menu
- get_food_details
- get_item_price
- check_item_availability
- get_modifier_options
- add_to_cart / update_cart_quantity / remove_from_cart
- get_cart_summary
- prepare_order_summary

## Rules
- Use actual catalogue data returned by application services.
- Never invent dishes, prices, modifiers, stock states, or order status.
- Treat tool arguments as untrusted and validate them.
- Obtain explicit confirmation before adding items to the basket or submitting any order.
- Add items through the shared basket; only the website checkout may submit a demo order through its existing validated route.
- Keep API keys server-side.
- Handle rate limits, timeouts, malformed calls, and outages gracefully.
- Website and typed assistant remain usable if voice or Gemini is unavailable.
