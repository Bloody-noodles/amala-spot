# AI Assistant Specification

## Provider and interaction
Use Google Gemini through the server-side Next.js assistant endpoint. The interaction is turn-by-turn: each customer utterance is transcribed, sent to Gemini, validated against application data, then spoken back. This is intentionally not an always-open streaming audio session. Typed chat remains available as a first-class fallback.

## Dedicated voice-call experience
- A dedicated call panel with start/end controls.
- Explicit states: idle, listening, thinking, and speaking.
- Animated waveform reacts to the current state; reduced-motion preferences are respected.
- Browser speech recognition captures customer turns using the Nigerian English locale where supported.
- Browser speech synthesis reads Amala AI replies aloud.
- The microphone is stopped while Amala AI speaks, then listening resumes for the next turn.
- Closing the assistant or opening checkout ends the microphone session.
- Unsupported browsers and denied microphone permission retain the typed assistant.

## Nigerian food intelligence
- Understand Nigerian English, Nigerian Pidgin, common Yoruba food terms, and food-ordering phrases.
- Interpret "abula" as the Amala, Gbegiri & Ewedu menu combination when present.
- Understand swallow/soup pairings, proteins, sides, drinks, and listed extras.
- Use the live Supabase menu as the source of truth; the local catalogue is a fallback only.
- Never invent menu items, prices, extras, ingredients, stock, allergens, delivery, opening hours, or restaurant facts.

## Basket actions
The assistant endpoint returns structured actions, never direct database mutations:
- `add`: add a catalogue item, quantity, and verified option IDs.
- `remove`: remove a quantity from an exact existing basket line.
- `set_quantity`: set the quantity on an exact existing basket line; zero removes it.
- `update_options`: add/remove extras on an existing line without accidentally creating a second plate.
- `clear`: clear the basket only on explicit customer instruction.
- `checkout`: open the existing checkout form only on explicit customer intent.

The server validates item IDs, option IDs, quantities, and exact basket-line matches against the current catalogue and basket. The client applies validated actions to the same basket used by manual ordering. The assistant receives the current basket on each turn and must not claim a change unless it returns the matching action.

## Order confirmation and management
- The assistant may prepare and update the basket but cannot bypass checkout.
- Checkout opens the existing form; the customer supplies required details and explicitly presses the final confirmation button.
- The existing `POST /api/orders` route remains the only order-creation path.
- When Supabase credentials are configured, the route calls `create_customer_order(jsonb)`, which recalculates prices from the database and writes order snapshots/events atomically.
- The existing protected admin dashboard and order-status workflow remain unchanged.
- The assistant must never claim an order was submitted, saved, paid for, or sent to a real restaurant before the checkout API confirms it. This project remains an independent demo with no real fulfilment.

## Tool and security rules
- Use actual catalogue data returned by application services.
- Treat model-generated action arguments as untrusted and validate them server-side.
- Never expose Gemini or Supabase secret keys in client code.
- Never let the assistant write directly to Supabase or bypass the order route.
- Obtain explicit customer confirmation before order submission.
- Handle rate limits, timeouts, malformed model output, and speech API failures gracefully.
- Do not change the existing admin, tracking, order schema, or fulfilment model to implement voice controls.
