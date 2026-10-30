import { NextRequest,NextResponse } from "next/server";
import { getSupabaseAdminConfig,isAdminRequest,supabaseAdminHeaders } from "@/lib/admin-auth";
export const dynamic="force-dynamic";
async function db(path:string,init:RequestInit={}){const {url,key}=getSupabaseAdminConfig();return fetch(`${url}/rest/v1/${path}`,{...init,headers:{...supabaseAdminHeaders(key),...(init.headers||{})},cache:"no-store"});}
export async function PATCH(request:NextRequest,{params}:{params:Promise<{id:string}>}){
 if(!isAdminRequest(request))return NextResponse.json({error:"Admin authentication required."},{status:401});
 const {id}=await params;
 try{
  const body=await request.json();
  const name=String(body.name||"").trim(),category_id=String(body.category_id||"").trim(),description=String(body.description||"").trim(),price_kobo=Number(body.price_kobo),options=Array.isArray(body.options)?body.options:[];
  if(name.length<2||name.length>100||!category_id||description.length>500||!Number.isSafeInteger(price_kobo)||price_kobo<0||options.length>20)return NextResponse.json({error:"Check the dish details."},{status:400});
  for(const x of options){if(!/^[a-z0-9-]{1,50}$/.test(String(x.id||""))||String(x.label||"").trim().length<1||String(x.label).length>80||!Number.isSafeInteger(Number(x.price_kobo))||Number(x.price_kobo)<0)return NextResponse.json({error:"One or more extras have invalid details."},{status:400});}
  const updated=await db(`menu_items?id=eq.${encodeURIComponent(id)}`,{method:"PATCH",headers:{"Prefer":"return=representation"},body:JSON.stringify({name,category_id,description,price_kobo,is_available:body.is_available!==false,updated_at:new Date().toISOString()})});
  if(!updated.ok)return NextResponse.json({error:"Could not update this dish."},{status:400});
  const rows=await updated.json();if(!rows.length)return NextResponse.json({error:"Dish not found."},{status:404});
  const removed=await db(`menu_item_options?menu_item_id=eq.${encodeURIComponent(id)}`,{method:"DELETE",headers:{"Prefer":"return=minimal"}});
  if(!removed.ok)return NextResponse.json({error:"Dish updated, but existing extras could not be replaced."},{status:503});
  if(options.length){const inserted=await db("menu_item_options",{method:"POST",headers:{"Prefer":"return=minimal"},body:JSON.stringify(options.map((x:any)=>({id:String(x.id),menu_item_id:id,label:String(x.label).trim(),price_kobo:Number(x.price_kobo),is_available:x.is_available!==false})))});
   if(!inserted.ok)return NextResponse.json({error:"Dish updated, but extras could not be saved. Reopen and retry."},{status:503});}
  return NextResponse.json({item:rows[0]});
 }catch{return NextResponse.json({error:"Invalid menu update."},{status:400});}
}
export async function DELETE(request:NextRequest,{params}:{params:Promise<{id:string}>}){
 if(!isAdminRequest(request))return NextResponse.json({error:"Admin authentication required."},{status:401});
 const {id}=await params;
 try{const r=await db(`menu_items?id=eq.${encodeURIComponent(id)}`,{method:"PATCH",headers:{"Prefer":"return=representation"},body:JSON.stringify({is_available:false,updated_at:new Date().toISOString()})});if(!r.ok)return NextResponse.json({error:"Could not hide dish."},{status:400});const rows=await r.json();return NextResponse.json({success:rows.length>0});}
 catch{return NextResponse.json({error:"Could not hide dish."},{status:503});}
}