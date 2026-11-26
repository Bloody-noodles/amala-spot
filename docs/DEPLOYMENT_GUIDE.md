# Deployment Guide

## Hosting
Vercel is the target host. GitHub is the source of truth; pushes to the production branch should deploy after the Vercel GitHub integration is connected.

## Environment variables
See `.env.example`. Configure local values in `.env.local` and hosted values in Vercel project settings only. Never commit secrets.

Server-side values for the configured features:
- NEXT_PUBLIC_SUPABASE_URL
- SUPABASE_SECRET_KEY (server-only; `SUPABASE_SERVICE_ROLE_KEY` is accepted as a legacy alias)
- GEMINI_API_KEY (server-only)
- ADMIN_PASSWORD
- ADMIN_SESSION_SECRET (at least 32 characters)

The assistant route currently uses `gemini-3.5-flash-lite` with `gemini-3.8-flash` as its fallback; it does not read a `GEMINI_MODEL` variable. See `docs/AI_ASSISTANT_SPECIFICATION.md` for model documentation.

## Deployment checks
- Confirm the selected Vercel project and repository association in the team's Vercel settings; this workspace has no Git metadata or `.vercel` link, so that association cannot be verified here.
- Confirm framework detection is Next.js and root directory is the repository root.
- Run install, lint, typecheck, and build.
- Configure environment variables separately for development, preview, and production.
- Inspect build and runtime logs after deployment.
- Verify the deployed site and critical flows.

The Preview-only GitHub Actions workflow requires repository secrets `VERCEL_TOKEN`, `VERCEL_ORG_ID`, and `VERCEL_PROJECT_ID`. It accepts a manual run from `design/banhmi-visual-refresh` or a same-repository pull request from that branch into `main`; its deploy command does not use `--prod`. This workspace has no GitHub/Vercel credentials, so no Preview deployment or project linkage was verified.
