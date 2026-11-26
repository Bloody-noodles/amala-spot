# Amala Spot

An independent Nigerian food discovery and demonstration ordering concept. The current implementation direction and phased acceptance criteria are in [amala_spot_full_codex_plan.md](amala_spot_full_codex_plan.md). Banh Mi World is a design reference for hierarchy, image composition, spacing, and responsive behaviour; the product must retain its own Nigerian/Yoruba identity.

## Project boundaries

Menu items, prices, availability, and business details are illustrative unless verified against an authorized source. Checkout is a demonstration and does not collect payment or dispatch orders to a real restaurant. Production changes require the owner's explicit approval.

## Stack

- Next.js App Router, React, TypeScript
- Tailwind CSS v4 and custom CSS
- Supabase PostgreSQL through server-side Next.js route handlers and SQL functions
- Gemini API through the server-side assistant route
- Gemini Live voice calls with streamed microphone audio, short-lived server-issued session tokens, and typed chat fallback

## Local development

Install the package dependencies, configure values from `.env.example`, and run `npm run dev`. Available checks are `npm test`, `npm run lint`, `npm run typecheck`, and `npm run build`.

The Supabase fallback catalogue is sample data. Supabase credentials and Gemini keys must remain server-side. Read the relevant specifications in `docs/` before changing API, data, security, or deployment contracts.

## Known requirements and limitations

- `BaticaSans-Regular.otf` is loaded as the display face; the owner confirmed its site licence. See `docs/DESIGN_SYSTEM.md`.
- All 41 fallback menu items have local mapped photos, alt text, and attribution records. Live catalogue completeness and rendered responsive crops still need verification; see `docs/IMAGE_ASSET_AUDIT.md` and `docs/IMPLEMENTATION_STATUS.md`.
- Voice calls require a configured server-side `GEMINI_API_KEY` and microphone permission in a supported secure browser context. Browser/mobile Preview inspection, configured Gemini/Supabase journeys, and deployment verification remain outstanding; see `docs/PHASE_AUDIT.md` and `docs/IMPLEMENTATION_STATUS.md`.

## Documentation

See `docs/PROJECT_OVERVIEW.md`, `docs/DESIGN_SYSTEM.md`, `docs/UI_UX_SPECIFICATION.md`, `docs/SYSTEM_ARCHITECTURE.md`, `docs/DATABASE_SCHEMA.md`, `docs/API_SPECIFICATION.md`, `docs/SECURITY_AND_VALIDATION.md`, `docs/AI_ASSISTANT_SPECIFICATION.md`, and `docs/DEPLOYMENT_GUIDE.md`.
