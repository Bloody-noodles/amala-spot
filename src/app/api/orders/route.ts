import { NextResponse } from "next/server";
import { z } from "zod";
import { menuItems } from "@/lib/menu";

const requestSchema = z.object({
  customer: z.object({
    name: z.string().trim().min(2).max(100),
    phone: z.string().trim().min(7).max(24),
    email: z.union([z.string().email().max(254),z.literal("")]).optional(),
    note: z.string().max(500).optional()
  }),
  items: z.array(z.object({
    itemId: z.string().min(1),
    quantity: z.number().int().min(1).max(20),
    options: z.array(z.string()).max(10)
  })).min(1).max(40)
});

export async function POST(request: Request) {
  try {
    const parsed = requestSchema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({error:"Please check the order details and try again."},{status:400});
    let totalKobo = 0;
    const lines = [];
    for (const line of parsed.data.items) {
      const item = menuItems.find(entry=>entry.id===line.itemId);
      if (!item) return NextResponse.json({error:"A selected menu item is no longer available in this demo."},{status:400});
      const uniqueOptions = new Set(line.options);
      if (uniqueOptions.size !== line.options.length) return NextResponse.json({error:"Duplicate item options are not allowed."},{status:400});
      const options = line.options.map(id=>item.options.find(option=>option.id===id));
      if (options.some(option=>!option)) return NextResponse.json({error:"An invalid extra was selected."},{status:400});
      const unitKobo = item.priceKobo + options.reduce((sum,option)=>sum+(option?.priceKobo??0),0);
      totalKobo += unitKobo * line.quantity;
      lines.push({itemId:item.id,name:item.name,quantity:line.quantity,unitKobo,options:options.map(option=>({id:option!.id,label:option!.label,priceKobo:option!.priceKobo}))});
    }
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY;
    const legacyServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const serverKey = supabaseSecretKey || legacyServiceRoleKey;

    if (supabaseUrl && serverKey) {
      const databaseResponse = await fetch(`${(supabaseUrl.endsWith("/") ? supabaseUrl.slice(0, -1) : supabaseUrl)}/rest/v1/rpc/create_customer_order`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: serverKey,
          ...(supabaseSecretKey ? {} : { Authorization: `Bearer ${serverKey}` })
        },
        body: JSON.stringify({ payload: parsed.data }),
        cache: "no-store"
      });
      if (!databaseResponse.ok) {
        return NextResponse.json({ error: "We couldn't save this order. Please review the details and try again." }, { status: 503 });
      }
      const savedOrder = await databaseResponse.json();
      return NextResponse.json({ ...savedOrder, mode: "saved" }, { status: 201 });
    }

    const reference = `AS-DEMO-${Date.now().toString(36).toUpperCase()}`;
    return NextResponse.json({
      reference,totalKobo,customerName:parsed.data.customer.name,
      items:lines,
      mode: "demo",
      message:"This is a demonstration summary only. It has not been saved, sent to a restaurant, or paid for. Connect Supabase to enable database persistence."
    },{status:201});
  } catch {
    return NextResponse.json({error:"Unable to prepare the demo order right now."},{status:400});
  }
}
