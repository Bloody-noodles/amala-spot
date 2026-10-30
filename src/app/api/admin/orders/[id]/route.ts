import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseAdminConfig, isAdminRequest, supabaseAdminHeaders } from "@/lib/admin-auth";

const schema = z.object({ status: z.enum(["received", "confirmed", "preparing", "ready", "completed", "cancelled"]), note: z.string().trim().max(300).optional() });
export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  if (!isAdminRequest(request)) return NextResponse.json({ error: "Admin authentication required." }, { status: 401 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Choose a valid next status." }, { status: 400 });
  const { id } = await context.params;
  if (!z.string().uuid().safeParse(id).success) return NextResponse.json({ error: "Invalid order identifier." }, { status: 400 });
  try {
    const { url, key } = getSupabaseAdminConfig();
    const response = await fetch(`${url}/rest/v1/rpc/transition_customer_order_status`, {
      method: "POST",
      headers: supabaseAdminHeaders(key),
      body: JSON.stringify({ p_order_id: id, p_status: parsed.data.status, p_note: parsed.data.note || "Status updated in the Amala Spot admin dashboard." }),
      cache: "no-store"
    });
    if (!response.ok) {
      const detail = await response.text();
      let code = "";
      try { code = JSON.parse(detail).code || ""; } catch { /* Keep the generic failure path. */ }
      if (code === "P0002") return NextResponse.json({ error: "Order not found." }, { status: 404 });
      if (code === "23514" || code === "22023") return NextResponse.json({ error: "That status transition is not allowed. Refresh the order and try again." }, { status: 409 });
      console.error("Atomic order status transition failed:", response.status, detail);
      throw new Error("Unable to transition order.");
    }
    const result = await response.json();
    return NextResponse.json({ ok: true, ...result });
  } catch {
    return NextResponse.json({ error: "The status update could not be completed. Refresh and check the order before retrying." }, { status: 503 });
  }
}
