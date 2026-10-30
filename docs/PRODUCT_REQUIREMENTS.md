# Product Requirements

## Public experience
- Responsive homepage faithfully recreating the Kaiseki reference.
- Food category navigation and data-driven menu.
- Item descriptions, images, sample prices, availability, and optional modifiers.
- Search/filter, cart, and demonstration checkout.
- Typed Gemini assistant and turn-by-turn voice enhancement.
- Clear disclosure that orders are demonstrations, not real restaurant fulfilment.

## Admin experience
- Supabase-authenticated admin access.
- Category/menu CRUD, image and modifier management, availability controls.
- Demonstration order overview and status management.

## Initial exclusions
- Payment processing or collection of payment credentials.
- Real order routing, kitchen tickets, delivery, or fulfilment.
- Customer account requirement for demo checkout.
- Unnecessary microservices or a separate API server.

## Acceptance
All menu data comes from one canonical source; checkout validates current values server-side; AI cannot fabricate facts or submit without explicit confirmation; admin functions are protected.
