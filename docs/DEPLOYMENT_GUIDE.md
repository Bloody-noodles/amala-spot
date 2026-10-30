# Deployment Guide

## Hosting
Vercel is the target host. GitHub is the source of truth; pushes to the production branch should deploy after the Vercel GitHub integration is connected.

## Environment variables
See .env.example. Configure real values in local .env.local and Vercel project settings only. Never commit secrets.

Required service configuration before enabling those features:
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY
- SUPABASE_SERVICE_ROLE_KEY (server-only)
- GEMINI_API_KEY (server-only)
- GEMINI_MODEL

## Deployment checks
- Confirm Vercel project is linked to Bloody-noodles/amala-spot.
- Confirm framework detection is Next.js and root directory is repository root.
- Run install, lint, typecheck, and build.
- Configure environment variables separately for development, preview, and production.
- Inspect build and runtime logs after deployment.
- Verify the deployed site and critical flows.

The current Vercel project was created but is not yet linked to GitHub because the Vercel GitHub integration is not installed/authorized for this team.
