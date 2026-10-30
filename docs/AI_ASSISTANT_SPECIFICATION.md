# AI Assistant Specification

## Provider and interaction
Use Google Gemini through a server-side Next.js integration. Interaction is turn-by-turn, not continuous interruption-based voice. Verify model availability, quotas, and pricing during implementation.

## Voice path
Browser speech recognition -> server assistant endpoint -> Gemini -> validated application tools -> text response -> browser speech synthesis. Browser speech support varies; typed chat is a first-class fallback.

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
- Obtain explicit confirmation before order submission.
- Submit through the same validated order service as the website.
- Keep API keys server-side.
- Handle rate limits, timeouts, malformed calls, and outages gracefully.
- Website and typed assistant remain usable if voice or Gemini is unavailable.
