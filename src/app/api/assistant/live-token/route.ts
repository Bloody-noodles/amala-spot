import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 15;

const LIVE_MODEL = "models/gemini-3.8-live";

export async function POST() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Live voice is not configured. Add GEMINI_API_KEY to the server environment." },
      { status: 503, headers: { "Cache-Control": "no-store" } }
    );
  }

  try {
    const now = Date.now();
    const response = await fetch("https://generativelanguage.googleapis.com/v1alpha/auth_tokens", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey
      },
      body: JSON.stringify({
        uses: 1,
        newSessionExpireTime: new Date(now + 60_000).toISOString(),
        expireTime: new Date(now + 20 * 60_000).toISOString(),
        liveConnectConstraints: {
          model: LIVE_MODEL,
          config: {
            responseModalities: ["AUDIO"],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: { voiceName: "Orus" }
              }
            }
          }
        }
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(10_000)
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok || typeof payload.name !== "string") {
      console.error("Gemini Live token provisioning failed:", response.status, payload);
      return NextResponse.json(
        { error: "Amala AI could not start a secure voice session. Please try again or use text chat." },
        { status: response.status === 429 ? 429 : 502, headers: { "Cache-Control": "no-store" } }
      );
    }

    return NextResponse.json(
      { token: payload.name, model: LIVE_MODEL.replace(/^models\\//, ""), expiresAt: payload.expireTime ?? null },
      { headers: { "Cache-Control": "no-store, max-age=0" } }
    );
  } catch (error) {
    console.error("Gemini Live token route error:", error);
    return NextResponse.json(
      { error: "The voice service could not be reached. Please try again or use text chat." },
      { status: 503, headers: { "Cache-Control": "no-store" } }
    );
  }
}
