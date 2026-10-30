import { NextResponse } from "next/server";
import { getSupabaseAdminConfig, supabaseAdminHeaders } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { url, key } = getSupabaseAdminConfig();
    const headers = supabaseAdminHeaders(key);
    const [categoriesResponse, itemsResponse, optionsResponse] = await Promise.all([
      fetch(`${url}/rest/v1/menu_categories?select=id,name,sort_order&is_active=eq.true&order=sort_order.asc`, { headers, cache: "no-store" }),
      fetch(`${url}/rest/v1/menu_items?select=id,category_id,name,description,price_kobo&is_available=eq.true&order=name.asc`, { headers, cache: "no-store" }),
      fetch(`${url}/rest/v1/menu_item_options?select=id,menu_item_id,label,price_kobo&is_available=eq.true`, { headers, cache: "no-store" })
    ]);
    if (!categoriesResponse.ok || !itemsResponse.ok || !optionsResponse.ok) throw new Error("Menu query failed.");
    const [categories, items, options] = await Promise.all([categoriesResponse.json(), itemsResponse.json(), optionsResponse.json()]);
    const categoryNames = new Map(categories.map((category: { id: string; name: string }) => [category.id, category.name]));
    const menu = items.map((item: { id: string; category_id: string; name: string; description: string; price_kobo: number }) => ({
      id: item.id,
      name: item.name,
      category: categoryNames.get(item.category_id) || "Menu",
      description: item.description,
      priceKobo: Number(item.price_kobo),
      options: options.filter((option: { menu_item_id: string }) => option.menu_item_id === item.id).map((option: { id: string; label: string; price_kobo: number }) => ({
        id: option.id, label: option.label, priceKobo: Number(option.price_kobo)
      }))
    }));
    return NextResponse.json({ categories: categories.map((category: { name: string }) => category.name), items: menu }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Public menu query failed:", error);
    return NextResponse.json({ error: "The live menu is temporarily unavailable." }, { status: 503 });
  }
}
