import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseAdminConfig, isAdminRequest, supabaseAdminHeaders } from "@/lib/admin-auth";

const schema = z.object({ status: z.enum(["received", "confirmed", "preparing", "ready", "completed", "cancelled"]), note: z.string().trim().max(300).optional() });
const transitions: Record<string, string[]> = {
  received: ["confirmed", "cancelled"],
  confirmed: ["preparing", "cancelled"],
  preparing: ["ready", "cancelled"],
  ready: ["completed"],
  completed: [],
  cancelled: []
};
export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  if (!isAdminRequest(request)) return NextResponse.json({ error: "Admin authentication required." }, { status: 401 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Choose a valid next status." }, { status: 400 });
  const { id } = await context.params;
  try {
    const { url, key } = getSupabaseAdminConfig();
    const headers = { ...supabaseAdminHeaders(key), Prefer: "return=representation" };
    const currentResponse = await fetch(`${url}/rest/v1/orders?id=eq.${encodeURIComponent(id)}&select=id,status,reference`, { headers, cache: "no-store" });
    if (!currentResponse.ok) throw new Error("Unable to read order.");
    const current = (await currentResponse.json())[0];
    if (!current) return NextResponse.json({ error: "Order not found." }, { status: 404 });
    if (!transitions[current.status]?.includes(parsed.data.status)) return NextResponse.json({ error: `Cannot move an order from ${current.status} to ${parsed.data.status}.` }, { status: 409 });
    const updateResponse = await fetch(`${url}/rest/v1/orders?id=eq.${encodeURIComponent(id)}`, { method: "PATCH", headers, body: JSON.stringify({ status: parsed.data.status }) });
    if (!updateResponse.ok) throw new Error("Unable to update order status.");
    const eventResponse = await fetch(`${url}/rest/v1/order_events`, { method: "POST", headers: { ...headers, Prefer: "return=minimal" }, body: JSON.stringify({ order_id: id, status: parsed.data.status, note: parsed.data.note || "Status updated in the Amala Spot admin dashboard." }) });
    if (!eventResponse.ok) throw new Error("Status changed, but the order event could not be recorded.");
    return NextResponse.json({ ok: true, reference: current.reference, status: parsed.data.status });
  } catch {
    return NextResponse.json({ error: "The status update could not be completed. Refresh and check the order before retrying." }, { status: 503 });
  }
}
