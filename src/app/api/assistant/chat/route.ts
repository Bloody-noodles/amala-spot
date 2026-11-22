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
  cart: z.array(z.object({
    itemId: z.string().min(1).max(120),
    quantity: z.number().int().min(1).max(50),
    options: z.array(z.string().min(1).max(120)).max(20).default([])
  })).max(50).optional().default([])
});

const responseSchema = {
  type: "OBJECT",
  properties: {
    reply: { type: "STRING" },
    actions: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          type: { type: "STRING" },
          itemId: { type: "STRING" },
          quantity: { type: "INTEGER" },
          optionIds: { type: "ARRAY", items: { type: "STRING" } },
          previousOptionIds: { type: "ARRAY", items: { type: "STRING" } }
        },
        required: ["type", "itemId", "quantity", "optionIds", "previousOptionIds"]
      }
    }
  },
  required: ["reply", "actions"]
};

type MenuOption = { id: string; label: string; priceKobo: number };
type LiveMenuItem = {
  id: string; name: string; category: string; description: string;
  priceKobo: number; options: MenuOption[];
};
type AssistantAction = {
  type: "add" | "remove" | "set_quantity" | "update_options" | "clear" | "checkout";
  itemId: string; quantity: number; optionIds: string[]; previousOptionIds?: string[];
  itemName?: string; optionLabels?: string[];
};

const sameOptions = (a: string[], b: string[]) =>
  [...a].sort().join("|") === [...b].sort().join("|");

export async function POST(request: Request) {
  try {
    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Please send a shorter message and try again." }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "The assistant is not connected yet. Add the Gemini API key in the Vercel project settings." }, { status: 503 });
    }

    let liveMenu: LiveMenuItem[] = menuItems;
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && (process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY)) {
      const { url, key } = getSupabaseAdminConfig();
      const headers = supabaseAdminHeaders(key);
      const [categoriesResponse, itemsResponse, optionsResponse] = await Promise.all([
        fetch(`${url}/rest/v1/menu_categories?select=id,name&is_active=eq.true`, { headers, cache: "no-store" }),
        fetch(`${url}/rest/v1/menu_items?select=id,category_id,name,description,price_kobo&is_available=eq.true`, { headers, cache: "no-store" }),
        fetch(`${url}/rest/v1/menu_item_options?select=id,menu_item_id,label,price_kobo&is_available=eq.true`, { headers, cache: "no-store" })
      ]);
      if (!categoriesResponse.ok || !itemsResponse.ok || !optionsResponse.ok) {
        throw new Error("Live menu could not be loaded.");
      }
      const [categories, items, options] = await Promise.all([
        categoriesResponse.json(), itemsResponse.json(), optionsResponse.json()
      ]) as [
        Array<{ id: string; name: string }>,
        Array<{ id: string; category_id: string; name: string; description: string; price_kobo: number }>,
        Array<{ id: string; menu_item_id: string; label: string; price_kobo: number }>
      ];
      if (items.length > 0) {
        const categoryNames = new Map(categories.map(category => [category.id, category.name]));
        liveMenu = items.map(item => ({
          id: item.id,
          name: item.name,
          category: categoryNames.get(item.category_id) || "Menu",
          description: item.description,
          priceKobo: Number(item.price_kobo),
          options: options.filter(option => option.menu_item_id === item.id).map(option => ({
            id: option.id, label: option.label, priceKobo: Number(option.price_kobo)
          }))
        }));
      }
    }

    const catalogue = liveMenu.map(item => ({
      id: item.id,
      name: item.name,
      category: item.category,
      description: item.description,
      priceNaira: item.priceKobo / 100,
      extras: item.options.map(option => ({
        id: option.id, name: option.label, priceNaira: option.priceKobo / 100
      }))
    }));

    const basket = parsed.data.cart.map(line => {
      const item = liveMenu.find(candidate => candidate.id === line.itemId);
      if (!item) return null;
      const selectedOptions = item.options.filter(option => line.options.includes(option.id));
      const unitPrice = item.priceKobo + selectedOptions.reduce((sum, option) => sum + option.priceKobo, 0);
      return {
        itemId: item.id,
        name: item.name,
        quantity: line.quantity,
        optionIds: selectedOptions.map(option => option.id),
        options: selectedOptions.map(option => option.label),
        lineTotalKobo: unitPrice * line.quantity
      };
    }).filter((line): line is NonNullable<typeof line> => line !== null);
    const basketTotalKobo = basket.reduce((sum, line) => sum + line.lineTotalKobo, 0);
    const basketText = basket.length
      ? basket.map(line => `${line.quantity} × ${line.name}${line.options.length ? ` (${line.options.join(", ")})` : ""}: ₦${(line.lineTotalKobo / 100).toLocaleString("en-NG")}`).join("; ")
      : "Your basket is currently empty.";
    const latestMessage = parsed.data.messages.at(-1)?.content ?? "";

    if (/^(?:hi|hello|hey|good morning|good afternoon|good evening|how are you(?: doing)?)[!.?,\\s]*$/i.test(latestMessage.trim())) {
      return NextResponse.json({ reply: "Hello! Welcome to Amala Spot. What are you in the mood for today?", actions: [] });
    }

    if (/\b(basket|cart|order)\b/i.test(latestMessage) && /\b(what|which|how much|total|currently|in|have|show|contents|items?|summary|read back)\b/i.test(latestMessage)) {
      const reply = basket.length
        ? `Here's what's in your basket: ${basketText}. Your current total is ₦${(basketTotalKobo / 100).toLocaleString("en-NG")}.`
        : "Your basket is empty. Tell me what you're craving and I'll help you add something.";
      return NextResponse.json({ reply, actions: [] });
    }

    const systemInstruction = `You are Amala Spot's friendly food host: a young Yoruba guy from Nigeria who knows Nigerian food culture, especially Yoruba dishes. You are an AI playing this conversational role; never claim to be a real employee or to have personal experiences.
PERSONALITY AND VOICE:
- Sound like a relaxed, confident, good-humoured Nigerian guy welcoming someone to a food spot. Be warm, sharp and naturally conversational, not like a customer-service script.
- Speak clear, natural English with Nigerian warmth and cultural awareness. Do not default to Pidgin or Yoruba. Use Pidgin only if the customer starts speaking it or explicitly asks for it; use Yoruba only when requested or clearly appropriate. Never force slang or exaggerate an accent.
- Never force Pidgin, exaggerate an accent in text, caricature Yoruba people, or repeat catchphrases. Do not put Yoruba words in every reply.
- Match the customer's energy: playful when they joke, straightforward when they ask a practical question, and concise by default. If the customer only greets you, greet them naturally and ask what they feel like eating; do not say you are putting an order together or imply they have ordered. Avoid generic AI filler, overexplaining, repetitive greetings and announcing that you are an AI.
- Be a knowledgeable food guide: help customers choose combinations, compare dishes, understand listed descriptions and find suitable extras.
Understand Nigerian English, Nigerian Pidgin, common Yoruba food names and Nigerian food culture. You may understand phrases such as "abula", "swallow", "draw soup", "efo", "gbegiri", "ewedu", "dodo", "ponmo", "asun", "small chops", "protein", "extra meat", "take one off", "make it two", and "no put that one".
FOOD KNOWLEDGE:
- "Abula" usually means the classic amala + gbegiri + ewedu + pepper stew combination. Match it to the catalogue item "Amala, Gbegiri & Ewedu" when available.
- Understand that amala, eba, pounded yam, semo, wheat and fufu are swallows; egusi, efo riro, ogbono, okra, gbegiri and ewedu are soups/sides. Use only actual catalogue items and listed combinations.
- Help users pair swallows with soups and choose listed proteins/extras. Never assume an extra is included unless it is explicitly listed in that dish's options.
- Do not invent a dish, price, ingredient, protein, modifier, stock state, delivery promise, allergen statement, opening hour or real-world business fact.
CATALOGUE RULES:
Use ONLY the menu catalogue below for item names, descriptions, prices and extras. The database menu is the source of truth. Prices are illustrative sample prices in Nigerian naira, not verified restaurant prices.
BASKET RULES:
The current basket supplied below is the source of truth. Never claim an item was added, removed or changed unless you emit a matching action. Recommendations alone do not change the basket.
When a request is ambiguous (for example, multiple possible dishes or multiple basket lines for the same dish), ask one short clarification and emit no action for that request.
ACTIONS:
Return actions only when the customer clearly instructs you to change the basket:
- add: add the exact catalogue item and requested quantity. Include selected extra IDs when requested. If quantity is not stated, use 1.
- remove: remove the requested quantity from an exact existing basket line. If the customer says remove/delete the item entirely, use the current line quantity.
- set_quantity: set an exact existing basket line to the requested quantity; quantity 0 removes that line.
- update_options: change extras on an exact existing basket line. Copy its current optionIds into previousOptionIds and return the complete desired extras list in optionIds. Use this when the customer asks to add/remove an extra from an existing plate, not to add another plate.
- clear: empty the entire basket only when the customer explicitly asks.
- checkout: open the existing checkout form only when the customer explicitly says they are ready to check out, place or confirm the order. Do not submit the order.
For every action always provide type, itemId, quantity, optionIds, and previousOptionIds. For add/remove/set_quantity/clear/checkout, use previousOptionIds []. For update_options, copy the current line extras into previousOptionIds. For clear and checkout use itemId "" and quantity 0 and optionIds [].
Use the exact item and option IDs from the catalogue and current basket. Do not guess IDs. For removal/quantity changes, copy optionIds from the exact basket line. If the customer asks for an extra that is not available on that dish, explain and ask whether they want another listed option; do not silently substitute.
ORDER CONFIRMATION:
After adding/removing/changing items, clearly confirm what changed and give the current basket total when possible. After a customer chooses a main dish, you may suggest one relevant listed drink, side or accompaniment as a natural question; never add it without permission and do not repeat generic upsells on every turn. For checkout, summarise the basket and tell the customer the checkout form is opening. The customer must enter their details and press the final confirmation button. Never claim an order has been submitted, saved, paid for or sent to a restaurant.
Return valid JSON matching the response schema. Keep reply short and natural.
CURRENT BASKET: ${JSON.stringify(basket.map(line => ({
      itemId: line.itemId, name: line.name, quantity: line.quantity,
      optionIds: line.optionIds, options: line.options
    })))}
MENU CATALOGUE: ${JSON.stringify(catalogue)}`;

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
            contents: parsed.data.messages.map(message => ({
              role: message.role === "assistant" ? "model" : "user",
              parts: [{ text: message.content }]
            })),
            generationConfig: {
              temperature: 0.35,
              maxOutputTokens: 500,
              responseMimeType: "application/json",
              responseSchema
            }
          }),
          signal: AbortSignal.timeout(model === models[0] ? 16000 : 8500),
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

    const cleaned = raw.replace(/^\x60\x60\x60(?:json)?\s*/i, "").replace(/\s*\x60\x60\x60$/, "").trim();
    let decoded: { reply?: unknown; actions?: unknown } | null = null;
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
    const rawActions = decoded && Array.isArray(decoded.actions) ? decoded.actions : [];
    const actions: AssistantAction[] = [];
    const actionIssues: string[] = [];
    const checkoutIntent = /\b(check ?out|place (my )?order|submit (my )?order|confirm (my )?order|ready to order|ready to place)\b/i.test(latestMessage);
    const clearIntent = /\b(clear|empty|wipe|remove everything|start over)\b.*\b(basket|cart)\b|\b(basket|cart)\b.*\b(clear|empty|wipe)\b/i.test(latestMessage);

    for (const rawAction of rawActions.slice(0, 8)) {
      if (!rawAction || typeof rawAction !== "object") continue;
      const candidate = rawAction as {
        type?: unknown; itemId?: unknown; quantity?: unknown; optionIds?: unknown; previousOptionIds?: unknown;
      };
      const type = candidate.type;
      const itemId = typeof candidate.itemId === "string" ? candidate.itemId : "";
      const quantity = typeof candidate.quantity === "number" ? candidate.quantity : -1;
      const optionIds = Array.isArray(candidate.optionIds) && candidate.optionIds.every((value: unknown) => typeof value === "string")
        ? candidate.optionIds as string[] : [];
      const previousOptionIds = Array.isArray(candidate.previousOptionIds) && candidate.previousOptionIds.every((value: unknown) => typeof value === "string")
        ? candidate.previousOptionIds as string[] : [];

      if (type === "clear") {
        if (clearIntent && parsed.data.cart.length > 0) actions.push({ type, itemId: "", quantity: 0, optionIds: [], previousOptionIds: [] });
        continue;
      }
      if (type === "checkout") {
        if (checkoutIntent && basket.length > 0) actions.push({ type, itemId: "", quantity: 0, optionIds: [], previousOptionIds: [] });
        continue;
      }
      if (type !== "add" && type !== "remove" && type !== "set_quantity" && type !== "update_options") continue;

      const item = liveMenu.find(entry => entry.id === itemId);
      if (!item) {
        actionIssues.push("I couldn't match one of those dishes to the current menu, so I left your basket unchanged.");
        continue;
      }
      if (new Set(optionIds).size !== optionIds.length || optionIds.some(id => !item.options.some(option => option.id === id))) {
        actionIssues.push(`I couldn't verify the selected extras for ${item.name}, so I left that change unapplied.`);
        continue;
      }

      if (type === "add") {
        if (!Number.isInteger(quantity) || quantity < 1 || quantity > 10) continue;
        const optionLabels = optionIds.map(id => item.options.find(option => option.id === id)!.label);
        actions.push({ type, itemId, quantity, optionIds, previousOptionIds: [], itemName: item.name, optionLabels });
        continue;
      }

      if (type === "update_options") {
        const matchingLine = parsed.data.cart.find(line => line.itemId === itemId && sameOptions(line.options, previousOptionIds));
        if (!matchingLine) {
          actionIssues.push("I could not find the selected " + item.name + " basket line to customise.");
          continue;
        }
        if (new Set(previousOptionIds).size !== previousOptionIds.length || previousOptionIds.some(id => !item.options.some(option => option.id === id))) {
          actionIssues.push("I could not verify the current extras on " + item.name + ", so I left it unchanged.");
          continue;
        }
        actions.push({ type, itemId, quantity: matchingLine.quantity, optionIds, previousOptionIds, itemName: item.name, optionLabels: optionIds.map(id => item.options.find(option => option.id === id)!.label) });
        continue;
      }

      const matchingLine = parsed.data.cart.find(line => line.itemId === itemId && sameOptions(line.options, optionIds));
      if (!matchingLine) {
        actionIssues.push(`${item.name} isn't in your basket with those extras, so I couldn't change it.`);
        continue;
      }
      if (type === "remove") {
        if (!Number.isInteger(quantity) || quantity < 1) continue;
        actions.push({ type, itemId, quantity: Math.min(quantity, matchingLine.quantity), optionIds, previousOptionIds: [], itemName: item.name });
      } else {
        if (!Number.isInteger(quantity) || quantity < 0 || quantity > 20) continue;
        actions.push({ type, itemId, quantity, optionIds, previousOptionIds: [], itemName: item.name });
      }
    }

    if (actionIssues.length > 0) {
      const issueText = [...new Set(actionIssues)].join(" ");
      const reply = typeof decoded?.reply === "string" ? decoded.reply.slice(0, 1200) : (plainReply || "Let's check that again.");
      return NextResponse.json({ reply: `${reply} ${issueText}`, actions: actions.filter(action => action.type !== "checkout") });
    }

    return NextResponse.json({
      reply: typeof decoded?.reply === "string" ? decoded.reply.slice(0, 1600) : (plainReply || "What are you in the mood for?"),
      actions
    });
  } catch (error) {
    console.error("Assistant route error:", error);
    return NextResponse.json({ error: "We couldn't reach the assistant. Please try again." }, { status: 500 });
  }
}
