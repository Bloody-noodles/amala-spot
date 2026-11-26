# UI/UX Specification

## Public page structure

- `/`: short editorial homepage with the approved headline, story, a small data-driven signature selection, menu CTA, assistant discovery, and contact CTA.
- `/menu`: searchable, category-filtered full catalogue with item name, category, description, naira price, customization, and basket action.
- `/about`: concise project/food story without unverified restaurant claims.
- `/gallery`: supplementary photography destination. It must use verified, correctly credited item-specific assets and must never substitute for the catalogue.
- `/checkout`: shared basket review, quantity/remove controls, customer name/phone and optional email/note, no-payment disclaimer, and existing order endpoint.
- `/track`: preserve lookup by private 64-character tracking key and the status event timeline.
- `/admin`: preserve existing protected menu/order management.

## Shared shell and ordering

Public routes share navigation, footer, assistant launcher, and ordering provider. The menu and assistant update the same basket; the basket drawer and mobile basket bar use that state. The assistant remains text-first capable, with browser voice controls where supported. Checkout recalculates via the existing server endpoint and shows the private key only for database-backed saved orders.

## Visual direction

Follow `docs/DESIGN_SYSTEM.md`. Do not copy Banh Mi World content or identity. Do not alter the existing homepage entrance animation sequence, timing, reveal, or reduced-motion behaviour.

## Imagery status

All 41 fallback menu entries have locally mapped item-specific photos, descriptive alt text, and attribution records. Owner-provided Ofada Rice & Ayamase and Five Alive Berry Blast images are approved for this site. The homepage teaser and curated `/gallery` share the same image mapping. See `docs/IMAGE_ASSET_AUDIT.md` for source and crop decisions. Live Supabase catalogue completeness and browser-rendered responsive crops remain unverified; any genuinely unmapped live item must continue to show an explicit placeholder instead of a mismatched photo.

## Responsive and accessibility requirements

Support 320–375 px, 390–430 px, 768–1024 px, and 1280–1440 px layouts. Check overflow, sticky navigation, assistant/basket collisions, keyboard use, visible focus, semantic buttons/headings, labels, alt text, contrast, touch targets, and reduced motion in a browser before sign-off.

Browser-based desktop and mobile visual inspection has not yet been performed in this workspace.
