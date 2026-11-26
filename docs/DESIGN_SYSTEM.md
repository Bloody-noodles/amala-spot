# Amala Spot Design System

## Direction

Use Banh Mi World as a reference for hierarchy, spacing, image presentation, confident restrained colour, and responsive navigation. Translate those principles into Amala Spot's Nigerian/Yoruba identity; do not copy their identity, copy, imagery, or exact sections.

## Tokens

- Warm cream: `#F8F1E5`
- Orange-red: `#E94F2B`
- Golden yellow: `#FFC928` (sparingly)
- Deep brown: `#40271D`
- White: `#FFFFFF`

Use cream and white for surfaces, brown for text, and orange-red for primary actions and accents. Keep text/background contrast accessible. Centralise values and responsive gutters in `src/app/globals.css`.

## Typography

Batica is the display face. The workspace-provided `BaticaSans-Regular.otf` is loaded from `public/fonts/`; the owner confirmed it is licensed for this site. Body copy uses the system sans-serif stack, with Georgia for editorial copy.

## Components and layout

- Shared site header, navigation, footer, and responsive content container.
- Display headings use strong uppercase editorial hierarchy; body descriptions remain readable and restrained.
- Catalogue rows/cards prioritize name, description, price, category, and add action. Avoid a uniform grid of generic square food images.
- Food imagery is item-specific and locally owned/verified. Where no verified image exists, show a neutral labelled placeholder and track it as missing; never silently substitute a category image.
- Shared assistant launcher/panel and shared basket state belong to the app shell.

## Motion and accessibility

Preserve the existing entrance animation sequence and timing. Add restrained reveal/hover motion only with keyboard equivalents and `prefers-reduced-motion` handling. Maintain visible focus, semantic headings, descriptive controls, useful alt text, touch targets, and no horizontal overflow.

## Reference audit status

The reference page text structure was inspected on 22 November 2026. Desktop/mobile rendered inspection is not available in this workspace and remains an outstanding sign-off requirement.
