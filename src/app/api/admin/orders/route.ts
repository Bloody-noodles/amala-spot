import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminConfig, isAdminRequest, supabaseAdminHeaders } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";
export async function GET(request: NextRequest) {
  if (!isAdminRequest(request)) return NextResponse.json({ error: "Admin authentication required." }, { status: 401 });
  try {
    const { url, key } = getSupabaseAdminConfig();
    const response = await fetch(`${url}/rest/v1/orders?select=id,reference,customer_name,customer_phone,customer_email,customer_note,status,subtotal_kobo,created_at,order_items(id,item_name,quantity,base_price_kobo,line_total_kobo,order_item_options(id,option_label,price_kobo))&order=created_at.desc&limit=100`, { headers: supabaseAdminHeaders(key), cache: "no-store" });
    if (!response.ok) throw new Error("Unable to retrieve orders.");
    const orders = await response.json();
    const counts = orders.reduce((acc: Record<string, number>, order: { status: string }) => { acc[order.status] = (acc[order.status] || 0) + 1; return acc; }, {});
    return NextResponse.json({ orders, counts });
  } catch {
    return NextResponse.json({ error: "Could not load orders. Check the Supabase connection and database permissions." }, { status: 503 });
  }
}
