import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseAdminConfig, supabaseAdminHeaders } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

const schema = z.object({
  trackingKey: z.string().trim().length(64).regex(/^[a-f0-9]{64}$/i)
});

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Enter the 64-character private tracking key from your order receipt." }, { status: 400 });
  }

  try {
    const { url, key } = getSupabaseAdminConfig();
    const tokenHash = createHash("sha256").update(parsed.data.trackingKey.toLowerCase()).digest("hex");
    const response = await fetch(
      `${url}/rest/v1/orders?lookup_token_hash=eq.${tokenHash}&select=id,reference,status,subtotal_kobo,created_at,order_items(item_name,quantity,line_total_kobo,order_item_options(option_label,price_kobo)),order_events(status,note,created_at)&limit=1`,
      { headers: supabaseAdminHeaders(key), cache: "no-store" }
    );
    if (!response.ok) throw new Error("Tracking lookup failed.");
    const rows = await response.json();
    if (!rows.length) {
      return NextResponse.json({ error: "We couldn't find an order with that tracking key. Check the key and try again." }, { status: 404 });
    }

    const order = rows[0];
    const events = [...(order.order_events || [])].sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
    return NextResponse.json({
      order: {
        reference: order.reference,
        status: order.status,
        totalKobo: order.subtotal_kobo,
        createdAt: order.created_at,
        items: order.order_items || [],
        events
      }
    }, { headers: { "Cache-Control": "no-store, private" } });
  } catch {
    return NextResponse.json({ error: "Order tracking is temporarily unavailable. Please try again shortly." }, { status: 503 });
  }
}
