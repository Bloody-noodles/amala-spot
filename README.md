# Amala Spot

An independent, portfolio-grade Nigerian food discovery and ordering concept. The project recreates the **Kaiseki Framer reference** as closely as possible, replacing its Japanese dining content with Nigerian food, and adds a Gemini-powered conversational ordering assistant.

> **Project status:** Foundation / implementation in progress  
> **This is an independent concept project.** It is not commissioned by, affiliated with, or operated by the real-world business that inspired it. Menu items, prices, availability, and business details are sample content until independently verified.

## Product vision

One cohesive application with two connected experiences:

1. A premium, responsive food website with editorial storytelling, category discovery, an interactive menu, cart, and demonstration checkout.
2. A Gemini-powered assistant that helps visitors discover dishes and prepare a cart through typed chat or turn-by-turn voice.

The website and assistant must share one canonical menu and the same server-side business logic. The assistant must never invent prices, menu items, modifiers, availability, or order status.

## Design contract

**Reference:** https://kaiseki.framer.website/

This is a high-fidelity recreation target, not loose inspiration. Preserve the reference's composition, section sequence, typography hierarchy, image treatment, spacing, card patterns, marquee/carousel behaviour, interactions, and responsive layouts. Inspect the complete reference—including lower sections and mobile—before declaring the visual implementation complete. Do not simplify or redesign it for convenience.

Approved palette direction: crimson red, warm cream, near-black, and white. Approximate working tokens (not extracted from source CSS): `#A90018`, `#F5F1E9`, `#171717`, `#FFFFFF`. Crimson is a major brand colour.

Typography direction:
- Bold, slightly condensed grotesque uppercase for logo and major headings.
- Elegant high-contrast serif for editorial copy and menu descriptions.
- Compact condensed uppercase grotesque for navigation, labels, and buttons.

Required motion and UX: hero entry animation, scroll reveals, sticky navigation, reference-matched marquee/carousel interactions, responsive desktop/tablet/mobile layouts, accessible touch targets, and `prefers-reduced-motion` support.

## Product scope

### Public experience
- Responsive, reference-faithful website.
- Nigerian food categories and data-driven menu.
- Item details, images, prices, availability, and optional modifiers.
- Cart and demonstration checkout.
- Integrated typed and voice assistant.
- Clear disclosure that orders are demonstrations, not real restaurant fulfilment.

### Admin experience
- Protected admin authentication.
- Category/menu CRUD, image and modifier management, availability controls.
- Demonstration order overview and status management.

### Initial exclusions
- No payment gateway or collection of payment credentials.
- No real order routing, dispatch, or fulfilment.
- No claim that the real-world business receives or accepts submitted demo orders.
- No unnecessary microservices or second backend.

## Proposed stack

| Area | Choice |
|---|---|
| Web | Next.js App Router, React, TypeScript |
| Styling | Tailwind CSS + custom CSS |
| Motion | Framer Motion |
| Icons | Lucide |
| Data | Supabase PostgreSQL |
| Authentication | Supabase Auth |
| Validation | Zod |
| Server | Next.js Route Handlers and server-side domain modules |
| AI | Google Gemini API |
| Voice | Browser Web Speech APIs with typed fallback |
| Hosting | Vercel |
| Source control | GitHub |

Keep one Next.js application. Verify current package versions, Gemini model availability, quota and pricing before implementation; free-tier limits can change.

## Architecture and safety rules

- Supabase is the source of truth for categories, menu items, prices, modifiers, availability, customers, and demo orders.
- Website, cart, checkout, admin, and assistant call shared server-side services.
- Never expose Supabase service-role credentials or Gemini API keys in client code.
- Validate all input and recompute prices/totals on the server.
- Treat model-generated tool arguments as untrusted input.
- AI may prepare an order but must obtain explicit confirmation before submission.
- If Gemini or browser speech APIs fail, the core website and typed assistant remain usable.
- Use Supabase RLS and server-side admin role checks.
- Store NGN amounts as integer kobo, not floating-point values.
- Preserve item/price/modifier snapshots in order records.
- Create order, items, modifiers, and initial event atomically.
- Public order lookup must use a secure token or equivalent—not a guessable reference alone.

## Food catalogue direction

The proposed catalogue is broad Nigerian food, with particular attention to Yoruba dishes: Amala, Eba, Iyan, Semo, Ewedu, Gbegiri, Efo Riro, Egusi, Ogbono, Jollof rice, fried rice, Ofada rice, beans, plantain, Asun rice, moi moi, grills/BBQ, spaghetti, porridge, pepper soup, shawarma, chicken and chips, zobo, smoothies, and parfait. This is proposed scope, not a verified inventory. Keep all catalogue content data-driven.

## Proposed data model

`categories`, `menu_items`, `menu_item_images`, `modifier_groups`, `modifier_options`, `menu_item_modifier_groups`, `item_availability`, `customers`, `orders`, `order_items`, `order_item_modifiers`, `order_events`, and `admin_profiles`.

Detailed columns, indexes, constraints, migrations, and RLS policies belong in `docs/DATABASE_SCHEMA.md`.

## Assistant interaction

Selected interaction: **turn-by-turn**, not continuous interruption-based conversation.

Initial voice path: browser speech recognition → Next.js server → Gemini → validated application tools → text response → browser speech synthesis. Typed chat is a first-class fallback; browser support varies.

Approved tool concepts: category lookup, menu search, food details, price lookup, availability, modifier lookup, cart add/update/remove, cart summary, and order-summary preparation. The assistant cannot access the database directly or bypass checkout validation.

## Demonstration checkout

Collect full name, phone, optional email, and optional note. No payment details. Re-fetch current items, prices, availability, and valid modifiers on the server; recalculate totals; reject stale/invalid carts; use idempotency where practical; create records transactionally.

Initial statuses: `submitted`, `reviewed`, `confirmed`, `cancelled`. These are demo workflow states only.

## Delivery milestones

1. Repository and documentation.
2. Next.js foundation and design tokens.
3. Full high-fidelity website.
4. Supabase schema and menu services.
5. Cart and demonstration checkout.
6. Protected admin dashboard.
7. Gemini typed/voice assistant.
8. Integration, accessibility, security, and responsive QA.
9. Vercel deployment and portfolio presentation.

## Coding-agent instructions

Read this README and relevant `docs/` specifications before implementation. Inspect existing code before editing. Preserve the approved design and architecture. Implement coherent milestones; reuse components and server-side services; never trust client totals or AI arguments; keep secrets server-side; run lint, type-check, tests, and production build; report checks not run; fix regressions; update docs when contracts change; record deviations in `docs/ENGINEERING_DECISIONS.md`. Never claim a feature was tested unless it was actually tested. Ask for clarification only when a decision blocks safe or correct work.

For each milestone: state objective/acceptance criteria, inspect, implement, run checks, review the diff, update docs, and commit or open a PR with test evidence and known limitations.

## Documentation map

- `docs/PROJECT_OVERVIEW.md`
- `docs/PRODUCT_REQUIREMENTS.md`
- `docs/DESIGN_SYSTEM.md`
- `docs/UI_UX_SPECIFICATION.md`
- `docs/SYSTEM_ARCHITECTURE.md`
- `docs/DATABASE_SCHEMA.md`
- `docs/APPLICATION_WORKFLOWS.md`
- `docs/AI_ASSISTANT_SPECIFICATION.md`
- `docs/API_SPECIFICATION.md`
- `docs/SECURITY_AND_VALIDATION.md`
- `docs/DEVELOPMENT_ROADMAP.md`
- `docs/TESTING_STRATEGY.md`
- `docs/DEPLOYMENT_GUIDE.md`
- `docs/ENGINEERING_DECISIONS.md`

## Completion standard

The full reference has been audited; the site closely matches its sections and responsive behaviour; menu, cart, checkout, and admin flows work; server-side validation is enforced; demo orders are clearly disclosed; AI uses approved tools and explicit confirmation; typed assistant works without voice; secrets are protected; production build/deployment succeeds; and documentation reflects tested reality.

**Guiding principle:** Build the product described here, not the easiest approximation of it.
