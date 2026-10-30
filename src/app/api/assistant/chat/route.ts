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
  })).min(1).max(12)
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

    const systemInstruction = `You are the friendly Amala Spot food guide for an independent Nigerian food website concept.
Speak naturally, warmly and concisely. You may understand Nigerian English and casual phrasing.
Use ONLY the menu catalogue below for dish names, descriptions, prices and extras. Never invent stock, opening hours, delivery, allergens, ingredients not listed, real restaurant facts or availability. If asked about unavailable information, say it is not verified in this concept.
Prices are illustrative sample prices in Nigerian naira, not real restaurant prices. If asked, be transparent.
Help people discover dishes and make choices. Ask one useful follow-up if needed.
When a user clearly asks to add menu items to their basket, return those exact item IDs and quantities in suggestions. Suggestions are only proposals; the customer must tap Add to basket. Do not claim an order was placed, paid for or sent.
Return valid JSON matching the response schema, with a concise reply and suggestions (empty array unless the customer clearly requests adding items).
MENU CATALOGUE: ${JSON.stringify(catalogue)}`;

    const response = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemInstruction }] },
        contents: parsed.data.messages.map(message => ({
          role: message.role === "assistant" ? "model" : "user",
          parts: [{ text: message.content }]
        })),
        generationConfig: {
          temperature: 0.55,
          maxOutputTokens: 500,
          responseMimeType: "application/json",
          responseSchema
        }
      }),
      signal: AbortSignal.timeout(25000),
      cache: "no-store"
    });

    if (!response.ok) {
      if (response.status === 429) return NextResponse.json({ error: "The assistant is busy right now. Please try again shortly." }, { status: 429 });
      console.error("Gemini request failed:", response.status, await response.text());
      return NextResponse.json({ error: "The assistant couldn't respond just now. Please try again." }, { status: 502 });
    }

    const result = await response.json();
    const raw = result.candidates?.[0]?.content?.parts?.map((part: { text?: string }) => part.text ?? "").join("") ?? "";
    const decoded = JSON.parse(raw);
    const allowed = new Set(liveMenu.map(item => item.id));
    const suggestions = Array.isArray(decoded.suggestions)
      ? decoded.suggestions.filter((entry: { itemId?: string; quantity?: number }) =>
          typeof entry.itemId === "string" && allowed.has(entry.itemId) &&
          typeof entry.quantity === "number" && Number.isInteger(entry.quantity) && entry.quantity > 0 && entry.quantity <= 10
        ).slice(0, 5)
      : [];

    return NextResponse.json({
      reply: typeof decoded.reply === "string" ? decoded.reply.slice(0, 1600) : "What are you in the mood for?",
      suggestions
    });
  } catch (error) {
    console.error("Assistant route error:", error);
    return NextResponse.json({ error: "We couldn't reach the assistant. Please try again." }, { status: 500 });
  }
}
