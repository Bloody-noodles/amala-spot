import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminConfig, isAdminRequest, supabaseAdminHeaders } from "@/lib/admin-auth";
export const dynamic="force-dynamic";
async function db(path:string,init:RequestInit={}){const {url,key}=getSupabaseAdminConfig();return fetch(`${url}/rest/v1/${path}`,{...init,headers:{...supabaseAdminHeaders(key),...(init.headers||{})},cache:"no-store"});}
export async function GET(request:NextRequest){
 if(!isAdminRequest(request))return NextResponse.json({error:"Admin authentication required."},{status:401});
 try{
  const [c,i,o]=await Promise.all([db("menu_categories?select=id,name,sort_order,is_active&order=sort_order.asc"),db("menu_items?select=id,category_id,name,description,price_kobo,is_available&order=name.asc"),db("menu_item_options?select=id,menu_item_id,label,price_kobo,is_available&order=label.asc")]);
  if(!c.ok||!i.ok||!o.ok)throw new Error("Menu query failed");
  const [categories,items,options]=await Promise.all([c.json(),i.json(),o.json()]);
  return NextResponse.json({categories,items:items.map((item:any)=>({...item,price_kobo:Number(item.price_kobo),options:options.filter((x:any)=>x.menu_item_id===item.id).map((x:any)=>({...x,price_kobo:Number(x.price_kobo)}))}))});
 }catch{return NextResponse.json({error:"Could not load menu data."},{status:503});}
}
export async function POST(request:NextRequest){
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
  if(!/^[a-z0-9-]{2,60}$/.test(id)||!category_id||name.length<2||name.length>100||description.length>500||!Number.isSafeInteger(price_kobo)||price_kobo<0)return NextResponse.json({error:"Check the dish details and price."},{status:400});
  const r=await db("menu_items",{method:"POST",headers:{"Prefer":"return=representation"},body:JSON.stringify({id,category_id,name,description,price_kobo,is_available:body.is_available!==false})});
  if(!r.ok)return NextResponse.json({error:"Could not save dish. Its ID may already exist, or the category may be invalid."},{status:400});
  const item=(await r.json())[0];
  const options=Array.isArray(body.options)?body.options:[];
  for(const option of options){
   const oid=String(option.id||"").trim(),label=String(option.label||"").trim(),price=Number(option.price_kobo);
   if(!/^[a-z0-9-]{1,50}$/.test(oid)||label.length<1||label.length>80||!Number.isSafeInteger(price)||price<0)return NextResponse.json({error:"Dish saved, but an extra has invalid details. Edit the dish to correct its extras."},{status:400});
  }
  if(options.length){
   const o=await db("menu_item_options",{method:"POST",headers:{"Prefer":"return=minimal"},body:JSON.stringify(options.map((x:any)=>({id:String(x.id),menu_item_id:id,label:String(x.label),price_kobo:Number(x.price_kobo),is_available:x.is_available!==false})))});
   if(!o.ok)return NextResponse.json({error:"Dish saved, but extras could not be saved. Reopen the dish and retry."},{status:400});
  }
  return NextResponse.json({item},{status:201});
 }catch{return NextResponse.json({error:"Invalid menu request."},{status:400});}
}