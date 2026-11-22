# AI Assistant Specification

## Provider and interaction
Use the Gemini Developer API Live API for native bidirectional audio. The browser receives a one-use, short-lived credential from a server-side Next.js route; the permanent GEMINI_API_KEY never enters client code. The live session streams microphone audio directly to Gemini and plays streamed audio responses. The typed chat remains a first-class alternative through the existing server-side assistant route.

## Voice experience
- A dedicated call panel with start/end controls and explicit connecting, listening, thinking, and speaking states.
- Native audio-in/audio-out conversation; do not use browser SpeechRecognition or SpeechSynthesis as the voice engine.
- Microphone capture uses mono PCM at 16 kHz; model audio playback uses PCM at 24 kHz.
- Enable input/output transcription captions where supported.
- Support interruption by stopping queued playback when the Live API reports an interruption.
- Close the microphone, audio context and WebSocket when the customer ends the call, closes the panel, or enters checkout.
- Show a clear permission or connection error and preserve typed chat if voice is unavailable.
- Use a bounded session credential and handle session expiry or disconnect without claiming the call is still active.

## Persona and menu grounding
- Amala AI is a warm, knowledgeable young Yoruba male food host, speaking natural Nigerian English with occasional light Pidgin/Yoruba only when appropriate.
- Understand Nigerian English, common Yoruba food terms, abula, swallows, soups, proteins, sides and listed extras.
- Use the live menu supplied by the ordering experience; menu item IDs, option IDs and prices are authoritative.
- Never invent dishes, prices, ingredients, availability, allergens, delivery, opening hours or real-world restaurant facts.
- Sample prices are illustrative only.

## Basket tools
The Live API function tools are limited to:
- get_basket
- add_to_basket
- remove_from_basket
- set_basket_quantity
- update_basket_options
- clear_basket
- open_checkout

All tool arguments are untrusted. The client validates item IDs, option IDs, quantities and exact basket-line matches against the current menu and React basket before applying actions. The React basket remains the source of truth; the current basket snapshot is refreshed in the Live session after every mutation. Recommendations do not add items. Clearing requires an explicit confirmation. Checkout requires explicit customer intent and only opens the existing form.

## Order confirmation and management
- The assistant cannot submit an order or bypass checkout.
- The customer must review the basket, enter required details and explicitly confirm.
- The existing POST /api/orders route remains the only order-creation path.
- Supabase order persistence, admin dashboard and order tracking remain unchanged.
- Never claim an order was submitted, saved, paid for or sent to a real restaurant before the checkout API confirms it. This remains an independent demo with no real fulfilment.

## Security and reliability
- Keep GEMINI_API_KEY and Supabase secrets server-side.
- Provision short-lived Live API credentials from the server with model and audio constraints.
- Never write directly to Supabase from the Live assistant.
- Handle token failures, rate limits, malformed tool calls, microphone denial, interruptions and network disconnects gracefully.
- Do not change the existing order schema, admin workflow, tracking workflow or Kaiseki-inspired visual design to implement voice controls.
