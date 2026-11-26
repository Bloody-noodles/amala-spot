import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const WINDOW_MS = 10 * 60 * 1000;
const MAX_CALLS = 5;
const attempts = new Map<string, { count: number; resetAt: number }>();

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin || origin !== new URL(request.url).origin) {
    return NextResponse.json({ error: "Request origin could not be verified." }, { status: 403, headers: { "Cache-Control": "no-store" } });
  }

  const now = Date.now();
  if (attempts.size > 2_000) {
    for (const [key, entry] of attempts) if (entry.resetAt <= now) attempts.delete(key);
  }
  const clientKey = request.headers.get("x-real-ip") || request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const current = attempts.get(clientKey);
  if (!current || current.resetAt <= now) attempts.set(clientKey, { count: 1, resetAt: now + WINDOW_MS });
  else if (current.count >= MAX_CALLS) {
    return NextResponse.json(
      { error: "Too many call attempts. Please wait a few minutes and try again." },
      { status: 429, headers: { "Retry-After": String(Math.ceil((current.resetAt - now) / 1000)), "Cache-Control": "no-store" } },
    );
  } else current.count += 1;

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Live voice is not configured yet. Add GEMINI_API_KEY to the site environment." }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }

  try {
    const response = await fetch("https://generativelanguage.googleapis.com/v1alpha/auth_tokens", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
      body: JSON.stringify({
        uses: 1,
        expireTime: new Date(now + 15 * 60 * 1000).toISOString(),
        newSessionExpireTime: new Date(now + 60 * 1000).toISOString(),
      }),
      cache: "no-store",
    });
    if (!response.ok) {
      console.error("[Gemini voice token] Provider rejected session request:", response.status);
      return NextResponse.json({ error: "The voice service could not start a call. Please try again shortly." }, { status: 502, headers: { "Cache-Control": "no-store" } });
    }
    const data = await response.json() as { name?: string };
    if (!data.name) return NextResponse.json({ error: "The voice service returned an invalid session." }, { status: 502, headers: { "Cache-Control": "no-store" } });
    return NextResponse.json({ token: data.name }, { headers: { "Cache-Control": "no-store, max-age=0" } });
  } catch (error) {
    console.error("[Gemini voice token] Session request failed:", error instanceof Error ? error.message : "Unknown network error");
    return NextResponse.json({ error: "The voice service is temporarily unreachable. Please try again." }, { status: 502, headers: { "Cache-Control": "no-store" } });
  }
}
