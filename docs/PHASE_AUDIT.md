# Amala Spot implementation audit

**Date:** 22 November 2026
**Scope:** Discovery phase for `amala_spot_full_codex_plan.md`.

## Repository state and discovery limits

- This workspace has no `.git` directory or Git metadata. Branch, latest commit, and uncommitted changes cannot be verified. The plan's requested design branch cannot be confirmed or checked out from this copy.
- The app is Next.js App Router / React / TypeScript. Scripts exist for lint, typecheck, build, dev, and start. There is no package lockfile in this workspace listing.
- The reference page `https://banhmiworld.ca/` was opened via web page text extraction. Its page structure includes navigation, a hero, signature items, story, gallery/category imagery, location, and FAQs. A real browser preview or mobile visual inspection was unavailable, so this is not a visual audit.
- No project-owned food photography was found. One font file, `mochilo.otf`, is present; its embedded family is Mochilo and its metadata does not state a licence. It is not Batica and is not used as a substitute. At the initial audit, Batica licensing and delivery files were unavailable. The owner has since supplied `BaticaSans-Regular.otf` and confirmed the site has a webfont licence; the font is now loaded.
- No production URL was opened and no deployment was changed.

## Current implementation map

- `/` (`src/app/page.tsx`) owns the homepage header, mobile navigation, hero, story, feature dishes, category concept catalogue, contact/footer, and `SiteEntry` curtain.
- `src/app/layout.tsx` only supplies metadata and global CSS. It does not own a common header/footer or assistant.
- `/admin` owns admin UI; `/track` owns the private tracking-key lookup. Menu, about, gallery, and checkout routes do not exist in the inspected app tree.
- `OrderingExperience` owns the menu fetch/fallback, category/search filters, cart, item options, checkout, receipt, and the `FoodAssistant`. Basket state is shared between that assistant and the ordering experience through props, but only within that component tree.
- `FoodAssistant` owns its open/closed panel, text chat, speech recognition, speech synthesis toggle, and suggested add-to-basket controls. Its API is `/api/assistant/chat`; Gemini keys are read server-side. It is only mounted at the homepage's inline order-builder, and the homepage promo link is an anchor to `#contact`, not an assistant launcher.
- `/api/menu` reads active categories, available menu items, and options from Supabase using server-only admin configuration. If unavailable, the storefront falls back to static menu data.
- `src/lib/menu.ts` and `src/lib/drinks-menu.ts` hold fallback catalogue entries. Stored amounts are integer kobo (`priceKobo`); display converts to naira by dividing by 100. Database migrations seed sample entries and options; this is not verified live inventory.
- `/api/orders` validates customer and item payloads. With Supabase it delegates authoritative price/availability validation and atomic snapshot creation to `create_customer_order`; without configuration it calculates a clearly labelled demo summary from fallback data. Tracking uses a private 64-character token, stored hashed in the database.
- Admin menu/order APIs and Supabase migrations exist. Migrations include menu CRUD support, atomic order writes/status transitions, and order integrity/indexing. No backend rewrite is indicated by the visual plan.
- `SiteEntry` renders the welcome curtain and removes it on CSS animation end. The current CSS contains its timing and reduced-motion handling; this sequence is a preservation constraint.
- Existing design tokens are in `src/app/globals.css` and currently use crimson/cream/black, DM Sans, Playfair Display, and DM Mono. The homepage includes several guessed/remote Wikimedia `Special:FilePath` URLs and hardcoded sample sections; no local item-specific image mapping exists.

## Audit diagnosis

### Reuse

- Existing API and database flows for menu, orders, tracking, admin, and assistant.
- The current order customization, quantity management, demo receipt, and private tracking-key experience.
- The entrance curtain component and its timing/reduced-motion CSS.
- Existing mobile navigation and some editorial layout components/styles.

### Replace or extend

- Replace homepage hardcoded category item lists with a live data-driven catalogue and create dedicated `/menu`, `/about`, `/gallery`, and `/checkout` routes.
- Introduce a shared application shell, reusable navigation/footer, and app-wide ordering state so the assistant, catalogue, basket, and checkout work across routes.
- Replace the assistant promo link with a true global launcher that mounts the existing assistant.
- Replace guessed remote image paths and initials-only order cards with an audited local image map and responsive food photography layouts. Until item images are verified, do not imply catalogue imagery is complete.
- Reconcile older README/docs design direction with the newer execution brief: Banh Mi World is the influence; use the plan's cream/orange-red/yellow/deep-brown palette. Do not clone its branding or content.

### Blockers and risks

- Batica webfont was absent during the initial audit. The owner later confirmed the supplied Batica file is licensed for this site; it is now loaded.
- Images: no owned image assets exist. Every menu item needs an item-specific verified asset; the live DB data and remote image availability/licences have not been audited. This remains an explicit completion blocker.
- Git branch/commit and Vercel preview state are unavailable in this workspace. No commit or preview readiness can be reported.
- The live Supabase catalogue cannot be verified without configured credentials. Fallback data is illustrative and cannot be represented as real menu inventory/pricing.
- Existing API persists database-backed orders but fallback mode returns a demo summary without a persistent order/tracking record; preserve this honest distinction.

## Phase 1 disposition

Discovery is complete for the source available in this workspace. Visual inspection, live database verification, branch/commit verification, preview deployment inspection remains unavailable and must not be reported as completed. Continue with the design system and implement the remaining app-local work without changing production.
