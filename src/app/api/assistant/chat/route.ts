import { NextResponse } from "next/server";
import { z } from "zod";
import { menuItems } from "@/lib/menu";
import { getSupabaseAdminConfig, supabaseAdminHeaders } from "@/lib/admin-auth";

export const runtime = "nodejs";
export const maxDuration = 30;

const schema = z.object({
  messages: z.array(z.object({
    role: z.enum(["user", "assistant"]),
    content: z.string().trim().min(1).max(1200)
  })).min(1).max(12),
  cart: z.array(z.object({ itemId: z.string().min(1).max(120), quantity: z.number().int().min(1).max(50), options: z.array(z.string().min(1).max(120)).max(20).default([]) })).max(50).optional().default([])
});

const responseSchema = {
  type: "OBJECT",
  properties: {
    reply: { type: "STRING" },
    suggestions: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          itemId: { type: "STRING" },
          quantity: { type: "INTEGER" }
        },
        required: ["itemId", "quantity"]
      }
    }
  },
  required: ["reply", "suggestions"]
};

export async function POST(request: Request) {
  try {
    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: "Please send a shorter message and try again." }, { status: 400 });

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return NextResponse.json({ error: "The assistant is not connected yet. Add the Gemini API key in the Vercel project settings." }, { status: 503 });

    let liveMenu = menuItems;
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && (process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY)) {
      const { url, key } = getSupabaseAdminConfig();
      const headers = supabaseAdminHeaders(key);
      const [categoriesResponse, itemsResponse, optionsResponse] = await Promise.all([
        fetch(`${url}/rest/v1/menu_categories?select=id,name&is_active=eq.true`, { headers, cache: "no-store" }),
        fetch(`${url}/rest/v1/menu_items?select=id,category_id,name,description,price_kobo&is_available=eq.true`, { headers, cache: "no-store" }),
        fetch(`${url}/rest/v1/menu_item_options?select=id,menu_item_id,label,price_kobo&is_available=eq.true`, { headers, cache: "no-store" })
      ]);
      if (!categoriesResponse.ok || !itemsResponse.ok || !optionsResponse.ok) throw new Error("Live menu could not be loaded.");
      const [categories, items, options] = await Promise.all([categoriesResponse.json(), itemsResponse.json(), optionsResponse.json()]);
      const categoryNames = new Map(categories.map((category: { id: string; name: string }) => [category.id, category.name]));
      liveMenu = items.map((item: { id: string; category_id: string; name: string; description: string; price_kobo: number }) => ({
        id: item.id, name: item.name, category: categoryNames.get(item.category_id) || "Menu",
        description: item.description, priceKobo: Number(item.price_kobo),
        options: options.filter((option: { menu_item_id: string }) => option.menu_item_id === item.id).map((option: { id: string; label: string; price_kobo: number }) => ({ id: option.id, label: option.label, priceKobo: Number(option.price_kobo) }))
      }));
    }
    const catalogue = liveMenu.map(item => ({
      id: item.id, name: item.name, category: item.category, description: item.description,
      priceNaira: item.priceKobo / 100,
      extras: item.options.map(option => ({ id: option.id, name: option.label, priceNaira: option.priceKobo / 100 }))
    }));

    const basket = parsed.data.cart.map(line => {
      const item = liveMenu.find(candidate => candidate.id === line.itemId);
      if (!item) return null;
      const selectedOptions = item.options.filter(option => line.options.includes(option.id));
      const unitPrice = item.priceKobo + selectedOptions.reduce((sum, option) => sum + option.priceKobo, 0);
      return { name: item.name, quantity: line.quantity, options: selectedOptions.map(option => option.label), lineTotalKobo: unitPrice * line.quantity };
    }).filter((line): line is NonNullable<typeof line> => line !== null);
    const basketTotalKobo = basket.reduce((sum, line) => sum + line.lineTotalKobo, 0);
    const basketText = basket.length
      ? basket.map(line => `${line.quantity} × ${line.name}${line.options.length ? ` (${line.options.join(", ")})` : ""}: ₦${(line.lineTotalKobo / 100).toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`).join("; ")
      : "Your basket is currently empty.";
    const basketQuestion = parsed.data.messages.at(-1)?.content ?? "";
    if (/\\b(basket|cart)\\b/i.test(basketQuestion) && /\\b(what|which|how much|total|currently|in|have|show|contents|items?)\\b/i.test(basketQuestion)) {
      const reply = basket.length
        ? `Your basket currently contains ${basketText}. Your current total is ₦${(basketTotalKobo / 100).toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}.`
        : "Your basket is currently empty. Add a dish from the menu or tap an AI suggestion to get started.";
      return NextResponse.json({ reply, suggestions: [] });
    }

    const systemInstruction = `You are the friendly Amala Spot food guide for an independent Nigerian food website concept.
Speak naturally, warmly and concisely. You may understand Nigerian English, Nigerian food culture and casual phrasing. You are a food-discovery assistant, not a general-purpose chatbot: answer food, menu, taste, meal-choice and ordering questions helpfully; if the user changes to an unrelated topic, respond briefly and steer back to food.
Use ONLY the menu catalogue below for dish names, descriptions, prices and extras. Never invent stock, opening hours, delivery, allergens, ingredients not listed, real restaurant facts or availability. If asked about unavailable information, say it is not verified in this concept.
Prices are illustrative sample prices in Nigerian naira, not real restaurant prices. If asked, be transparent.
Help people discover dishes and make choices. Ask one useful follow-up if needed.
When a user clearly asks to add menu items to their basket, return those exact item IDs and quantities in suggestions. Suggestions are only proposals; the customer must tap Add to basket. Do not claim an order was placed, paid for or sent.
Return valid JSON matching the response schema, with a concise reply and suggestions (empty array unless the customer clearly requests adding items).
MENU CATALOGUE: ${JSON.stringify(catalogue)}`;

    // Use Google's current Flash-Lite model for fast food-guide turns, with
    // Flash as a fallback if the primary model is temporarily overloaded.
    const models = ["gemini-3.5-flash-lite", "gemini-3.8-flash"];
    let response: Response | null = null;
    let lastFailure = "provider";
    for (const model of models) {
      try {
        const attempt = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: systemInstruction }] },
            contents: parsed.data.messages.map(message => ({ role: message.role === "assistant" ? "model" : "user", parts: [{ text: message.content }] })),
            generationConfig: { temperature: 0.55, maxOutputTokens: 400, responseMimeType: "application/json", responseSchema }
          }),
          signal: AbortSignal.timeout(9500),
          cache: "no-store"
        });
        if (attempt.ok) { response = attempt; break; }
        if (attempt.status !== 429 && attempt.status !== 503) { response = attempt; break; }
        lastFailure = "unavailable";
        console.warn(`Gemini model ${model} returned ${attempt.status}; trying fallback.`);
      } catch (error) {
        lastFailure = "network or timeout";
        console.warn(`Gemini model ${model} failed before responding; trying fallback.`, error);
      }
    }

    if (!response || !response.ok) {
      const status = response?.status;
      if (status === 429 || status === 503 || !response) {
        if (response) console.error("Gemini assistant models unavailable:", status, await response.text());
        else console.error("All Gemini assistant attempts failed:", lastFailure);
        return NextResponse.json({ error: "Amala AI is experiencing heavy demand. Please try again in a moment." }, { status: 503 });
      }
      console.error("Gemini request failed:", status, await response.text());
      return NextResponse.json({ error: "The assistant could not respond just now. Please try again." }, { status: 502 });
    }

    const result = await response.json();
    const raw = result.candidates?.[0]?.content?.parts?.map((part: { text?: string }) => part.text ?? "").join("").trim() ?? "";
    if (!raw) {
      const reason = result.candidates?.[0]?.finishReason;
      console.error("Gemini returned no text:", reason || "unknown finish reason");
      return NextResponse.json({ error: "Amala AI could not form a reply just now. Please try a shorter message." }, { status: 502 });
    }

    // Structured output is requested, but the provider can occasionally wrap
    // JSON in prose or code fences. Recover JSON when possible; otherwise keep
    // a plain-text answer instead of failing the entire chat request.
    const cleaned = raw.replace(/^\x60\x60\x60(?:json)?\s*/i, "").replace(/\s*\x60\x60\x60$/, "").trim();
    let decoded: { reply?: unknown; suggestions?: unknown } | null = null;
    try {
      decoded = JSON.parse(cleaned);
    } catch {
      const objectStart = cleaned.indexOf("{");
      const objectEnd = cleaned.lastIndexOf("}");
      if (objectStart >= 0 && objectEnd > objectStart) {
        try { decoded = JSON.parse(cleaned.slice(objectStart, objectEnd + 1)); } catch { decoded = null; }
      }
    }

    const plainReply = cleaned.replace(/^Here is the response:?\s*/i, "").slice(0, 1600);
    const allowed = new Set(liveMenu.map(item => item.id));
    const rawSuggestions = decoded && Array.isArray(decoded.suggestions) ? decoded.suggestions : [];
    const suggestions = rawSuggestions.filter((entry): entry is { itemId: string; quantity: number } => {
      if (!entry || typeof entry !== "object") return false;
      const candidate = entry as { itemId?: unknown; quantity?: unknown };
      return typeof candidate.itemId === "string" && allowed.has(candidate.itemId) &&
        typeof candidate.quantity === "number" && Number.isInteger(candidate.quantity) && candidate.quantity > 0 && candidate.quantity <= 10;
    }).slice(0, 5);

    const suggestionDetails = suggestions.map((entry: { itemId: string; quantity: number }) => {
      const item = liveMenu.find(candidate => candidate.id === entry.itemId);
      if (!item) return null;
      return { itemId: item.id, quantity: entry.quantity, item: { id: item.id, name: item.name, category: item.category, description: item.description, priceKobo: item.priceKobo, options: item.options } };
    }).filter((entry): entry is NonNullable<typeof entry> => entry !== null);

    return NextResponse.json({
      reply: typeof decoded?.reply === "string" ? decoded.reply.slice(0, 1600) : (plainReply || "What are you in the mood for?"),
      suggestions: suggestionDetails
    });
  } catch (error) {
    console.error("Assistant route error:", error);
    return NextResponse.json({ error: "We couldn't reach the assistant. Please try again." }, { status: 500 });
  }
}
