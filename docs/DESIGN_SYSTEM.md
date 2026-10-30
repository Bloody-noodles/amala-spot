# Design System

## Reference fidelity
Primary reference: https://kaiseki.framer.website/

Recreate its complete composition, section order, typography, image treatment, spacing, cards, motion, interactions, and responsive behaviour. Inspect the full live site and mobile layouts before visual sign-off. Do not replace it with a generic restaurant design.

## Palette direction
Approximate working tokens only; not extracted from reference CSS:
- Crimson: #A90018
- Warm cream: #F5F1E9
- Near-black: #171717
- White: #FFFFFF

Crimson is a major brand colour.

## Typography
- Condensed bold grotesque uppercase for logo and headings.
- High-contrast serif for editorial copy and menu descriptions.
- Compact condensed uppercase grotesque for navigation, labels, and buttons.

Current implementation uses DM Sans, Playfair Display, and DM Mono as initial stand-ins. Verify against the reference before final sign-off.

## Motion
Hero entrance, scroll reveals, sticky navigation, marquee/carousel interactions, and subtle hover feedback. Respect prefers-reduced-motion and preserve keyboard/touch access.

Centralise tokens in globals.css. Record visual deviations in ENGINEERING_DECISIONS.md.
