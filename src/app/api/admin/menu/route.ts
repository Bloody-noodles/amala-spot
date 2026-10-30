import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminConfig, isAdminRequest, supabaseAdminHeaders, hasSafeRequestOrigin } from "@/lib/admin-auth";
export const dynamic="force-dynamic";
async function db(path:string,init:RequestInit={}){const {url,key}=getSupabaseAdminConfig();return fetch(`${url}/rest/v1/${path}`,{...init,headers:{...supabaseAdminHeaders(key),...(init.headers||{})},cache:"no-store"});}
export async function GET(request:NextRequest){
 if(!isAdminRequest(request))return NextResponse.json({error:"Admin authentication required."},{status:401});
 try{
  const [c,i,o]=await Promise.all([db("menu_categories?select=id,name,sort_order,is_active&order=sort_order.asc"),db("menu_items?select=id,category_id,name,description,price_kobo,is_available&order=name.asc"),db("menu_item_options?select=id,menu_item_id,label,price_kobo,is_available&order=label.asc")]);
  if(!c.ok||!i.ok||!o.ok)throw new Error("Menu query failed");
  const [categories,items,options]=await Promise.all([c.json(),i.json(),o.json()]) as [unknown, Array<{id:string;price_kobo:number}>, Array<{menu_item_id:string;price_kobo:number}>];
  return NextResponse.json({categories,items:items.map((item)=>({...item,price_kobo:Number(item.price_kobo),options:options.filter((x)=>x.menu_item_id===item.id).map((x)=>({...x,price_kobo:Number(x.price_kobo)}))}))});
 }catch{return NextResponse.json({error:"Could not load menu data."},{status:503});}
}
export async function POST(request:NextRequest){
 if(!hasSafeRequestOrigin(request))return NextResponse.json({error:"Cross-origin requests are not allowed."},{status:403});
 if(!isAdminRequest(request))return NextResponse.json({error:"Admin authentication required."},{status:401});
 try{
  const body=await request.json();
  if(body.kind==="category"){
   const id=String(body.id||"").trim(),name=String(body.name||"").trim();
   if(!/^[a-z0-9-]{2,50}$/.test(id)||name.length<2||name.length>60)return NextResponse.json({error:"Enter a valid category name."},{status:400});
   const r=await db("menu_categories",{method:"POST",headers:{"Prefer":"return=representation"},body:JSON.stringify({id,name,sort_order:Number(body.sort_order)||100,is_active:true})});
   if(!r.ok)return NextResponse.json({error:"Could not create category. Check whether its ID or name already exists."},{status:400});
   return NextResponse.json({category:(await r.json())[0]},{status:201});
  }
  const id=String(body.id||"").trim(),category_id=String(body.category_id||"").trim(),name=String(body.name||"").trim(),description=String(body.description||"").trim(),price_kobo=Number(body.price_kobo);
  const options=Array.isArray(body.options)?body.options:[];
  if(!/^[a-z0-9-]{2,60}$/.test(id)||!category_id||name.length<2||name.length>100||description.length>500||!Number.isSafeInteger(price_kobo)||price_kobo<0||options.length>20)return NextResponse.json({error:"Check the dish details and price."},{status:400});
  const seen=new Set<string>();
  for(const option of options){
   const oid=String(option.id||"").trim(),label=String(option.label||"").trim(),price=Number(option.price_kobo);
   if(!/^[a-z0-9-]{1,50}$/.test(oid)||seen.has(oid)||label.length<1||label.length>80||!Number.isSafeInteger(price)||price<0)return NextResponse.json({error:"One or more extras have invalid or duplicate details."},{status:400});
   seen.add(oid);
  }
  const payload={id,category_id,name,description,price_kobo,is_available:body.is_available!==false,options:options.map((x: {id:string;label:string;price_kobo:number;is_available?:boolean})=>({id:String(x.id).trim(),label:String(x.label).trim(),price_kobo:Number(x.price_kobo),is_available:x.is_available!==false}))};
  const r=await db("rpc/create_admin_menu_item",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({p_payload:payload})});
  if(!r.ok){
   const detail=await r.text();
   const status=r.status===404?503:r.status===409?409:400;
   return NextResponse.json({error:status===503?"Menu write function is not installed. Apply the required database migration.":"Could not create dish. Check its ID, category, and extras.",detail:process.env.NODE_ENV==="development"?detail:undefined},{status});
  }
  return NextResponse.json(await r.json(),{status:201});
 }catch{return NextResponse.json({error:"Invalid menu request."},{status:400});}
}