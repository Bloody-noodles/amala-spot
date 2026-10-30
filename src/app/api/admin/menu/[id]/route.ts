import { NextRequest,NextResponse } from "next/server";
import { getSupabaseAdminConfig,isAdminRequest,supabaseAdminHeaders,hasSafeRequestOrigin } from "@/lib/admin-auth";
export const dynamic="force-dynamic";
async function db(path:string,init:RequestInit={}){const {url,key}=getSupabaseAdminConfig();return fetch(`${url}/rest/v1/${path}`,{...init,headers:{...supabaseAdminHeaders(key),...(init.headers||{})},cache:"no-store"});}
export async function PATCH(request:NextRequest,{params}:{params:Promise<{id:string}>}){
 if(!hasSafeRequestOrigin(request))return NextResponse.json({error:"Cross-origin requests are not allowed."},{status:403});
 if(!isAdminRequest(request))return NextResponse.json({error:"Admin authentication required."},{status:401});
 const {id}=await params;
 try{
  const body=await request.json();
  const name=String(body.name||"").trim(),category_id=String(body.category_id||"").trim(),description=String(body.description||"").trim(),price_kobo=Number(body.price_kobo),options=Array.isArray(body.options)?body.options:[];
  if(name.length<2||name.length>100||!category_id||description.length>500||!Number.isSafeInteger(price_kobo)||price_kobo<0||options.length>20)return NextResponse.json({error:"Check the dish details."},{status:400});
  const seen=new Set<string>();
  for(const x of options){const optionId=String(x.id||"").trim(),label=String(x.label||"").trim(),price=Number(x.price_kobo);if(!/^[a-z0-9-]{1,50}$/.test(optionId)||seen.has(optionId)||label.length<1||label.length>80||!Number.isSafeInteger(price)||price<0)return NextResponse.json({error:"One or more extras have invalid or duplicate details."},{status:400});seen.add(optionId);}
  const payload={name,category_id,description,price_kobo,is_available:body.is_available!==false,options:options.map((x: { id: string; label: string; price_kobo: number; is_available?: boolean })=>({id:String(x.id).trim(),label:String(x.label).trim(),price_kobo:Number(x.price_kobo),is_available:x.is_available!==false}))};
  const updated=await db("rpc/update_admin_menu_item",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({p_item_id:id,p_payload:payload})});
  if(!updated.ok){const detail=await updated.text();const missing=updated.status===404;return NextResponse.json({error:missing?"Menu write function is not installed. Apply the required database migration.":"Could not update dish. Check its category and extras.",detail:process.env.NODE_ENV==="development"?detail:undefined},{status:missing?503:updated.status===409?409:400});}
  return NextResponse.json(await updated.json());
 }catch{return NextResponse.json({error:"Invalid menu update."},{status:400});}
}
export async function DELETE(request:NextRequest,{params}:{params:Promise<{id:string}>}){
 if(!hasSafeRequestOrigin(request))return NextResponse.json({error:"Cross-origin requests are not allowed."},{status:403});
 if(!isAdminRequest(request))return NextResponse.json({error:"Admin authentication required."},{status:401});
 const {id}=await params;
 try{const r=await db(`menu_items?id=eq.${encodeURIComponent(id)}`,{method:"PATCH",headers:{"Prefer":"return=representation"},body:JSON.stringify({is_available:false,updated_at:new Date().toISOString()})});if(!r.ok)return NextResponse.json({error:"Could not hide dish."},{status:400});const rows=await r.json();return NextResponse.json({success:rows.length>0});}
 catch{return NextResponse.json({error:"Could not hide dish."},{status:503});}
}