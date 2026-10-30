"use client";

import { useMemo, useState } from "react";
import { Minus, Plus, Search, ShoppingBag, X, CheckCircle2, ArrowRight } from "lucide-react";
import { formatNaira, menuItems } from "@/lib/menu";
import { FoodAssistant } from "@/components/food-assistant";

type CartLine = { key:string; itemId:string; quantity:number; options:string[] };
type Receipt = { reference:string; totalKobo:number; message:string; mode?:"saved"|"demo" };
const categories = ["All", ...Array.from(new Set(menuItems.map(item=>item.category)))];

export function OrderingExperience() {
  const [category,setCategory]=useState("All");
  const [query,setQuery]=useState("");
  const [cart,setCart]=useState<CartLine[]>([]);
  const [selected,setSelected]=useState<string|null>(null);
  const [chosen,setChosen]=useState<string[]>([]);
  const [quantity,setQuantity]=useState(1);
  const [checkout,setCheckout]=useState(false);
  const [customer,setCustomer]=useState({name:"",phone:"",email:"",note:""});
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState("");
  const [receipt,setReceipt]=useState<Receipt|null>(null);
  const [showCart,setShowCart]=useState(false);

  const visible=useMemo(()=>menuItems.filter(item=>(category==="All"||item.category===category)&&(`${item.name} ${item.description}`.toLowerCase().includes(query.toLowerCase()))),[category,query]);
  const selectedItem=menuItems.find(item=>item.id===selected) ?? null;
  const cartCount=cart.reduce((sum,line)=>sum+line.quantity,0);
  const lineTotal=(line:CartLine)=>{const item=menuItems.find(entry=>entry.id===line.itemId)!;return (item.priceKobo+item.options.filter(option=>line.options.includes(option.id)).reduce((sum,option)=>sum+option.priceKobo,0))*line.quantity;};
  const total=cart.reduce((sum,line)=>sum+lineTotal(line),0);
  const addSelected=()=>{if(!selectedItem)return;const key=`${selectedItem.id}:${[...chosen].sort().join(",")}`;setCart(current=>{const found=current.find(line=>line.key===key);return found?current.map(line=>line.key===key?{...line,quantity:line.quantity+quantity}:line):[...current,{key,itemId:selectedItem.id,quantity,options:chosen}]});setSelected(null);setChosen([]);setQuantity(1);setShowCart(true);};
  const updateQty=(key:string,delta:number)=>setCart(current=>current.map(line=>line.key===key?{...line,quantity:line.quantity+delta}:line).filter(line=>line.quantity>0));
  const submit=async()=>{setError("");if(!customer.name.trim()||!customer.phone.trim()){setError("Please enter your name and phone number.");return;}if(!cart.length){setError("Your basket is empty.");return;}setBusy(true);try{const response=await fetch("/api/orders",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({customer,items:cart.map(({itemId,quantity,options})=>({itemId,quantity,options}))})});const data=await response.json();if(!response.ok)throw new Error(data.error||"Could not prepare the demo order.");setReceipt(data);setCart([]);setCheckout(false);setShowCart(false);}catch(e){setError(e instanceof Error?e.message:"Something went wrong. Please try again.");}finally{setBusy(false);}};
  const naira=(value:number)=>formatNaira(value);
  const addAssistantItem=(itemId:string,amount:number)=>{const item=menuItems.find(entry=>entry.id===itemId);if(!item)return;const key=`${item.id}:`;setCart(current=>{const found=current.find(line=>line.key===key);return found?current.map(line=>line.key===key?{...line,quantity:line.quantity+amount}:line):[...current,{key,itemId:item.id,quantity:amount,options:[]}]});setShowCart(true);};

  return <section className="ordering-experience" id="order-builder">
    <div className="ordering-top"><div><span className="eyebrow">BUILD YOUR ORDER · DEMO MENU</span><h3>WHAT ARE WE<br/><em>HAVING TODAY?</em></h3><p>Choose a dish, make it yours, then review your basket.</p></div><button className="basket-trigger" onClick={()=>setShowCart(v=>!v)}><ShoppingBag size={18}/> YOUR BASKET <b>{cartCount}</b></button></div>
    <div className="order-controls"><label className="menu-search"><Search size={17}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search dishes or ingredients" aria-label="Search menu"/></label><div className="order-categories" role="group" aria-label="Filter menu by category">{categories.map(name=><button key={name} className={category===name?"active":""} onClick={()=>setCategory(name)}>{name}</button>)}</div></div>
    <div className="order-layout"><div className="order-grid">{visible.map(item=><article className="order-card" key={item.id}><div className="order-card-art"><span>{item.category}</span><b>{item.name.split(" ").map(word=>word[0]).join("").slice(0,3)}</b></div><div className="order-card-body"><div><h4>{item.name}</h4><p>{item.description}</p></div><div className="order-card-foot"><strong>{naira(item.priceKobo)}</strong><button onClick={()=>{setSelected(item.id);setChosen([]);setQuantity(1);}}>CUSTOMISE <Plus size={14}/></button></div></div></article>)}</div>
      <aside className={`basket-panel ${showCart?"is-open":""}`}><div className="basket-head"><div><span className="eyebrow">YOUR SELECTION</span><h4>THE BASKET <small>({cartCount})</small></h4></div><button className="icon-button" onClick={()=>setShowCart(false)} aria-label="Close basket"><X/></button></div>
        {cart.length===0?<p className="basket-empty">Your basket is waiting. Add a dish to get started.</p>:<><div className="basket-lines">{cart.map(line=>{const item=menuItems.find(entry=>entry.id===line.itemId)!;const opts=item.options.filter(option=>line.options.includes(option.id));return <div className="basket-line" key={line.key}><div className="basket-line-title"><div><b>{item.name}</b><small>{opts.length?opts.map(option=>option.label).join(" · "):"Standard serving"}</small></div><strong>{naira(lineTotal(line))}</strong></div><div className="quantity-control"><button onClick={()=>updateQty(line.key,-1)} aria-label={`Remove one ${item.name}`}><Minus size={13}/></button><span>{line.quantity}</span><button onClick={()=>updateQty(line.key,1)} aria-label={`Add one ${item.name}`}><Plus size={13}/></button><button className="remove-line" onClick={()=>setCart(current=>current.filter(entry=>entry.key!==line.key))}>REMOVE</button></div></div>;})}</div><div className="basket-total"><span>DEMO TOTAL</span><strong>{naira(total)}</strong></div><button className="checkout-button" onClick={()=>setCheckout(true)}>CONTINUE TO CHECKOUT <ArrowRight size={16}/></button></>}
        <small className="demo-disclaimer">Illustrative sample prices only. No payment or restaurant submission.</small>
      </aside></div>

    {selectedItem&&<div className="order-modal-backdrop" role="presentation" onMouseDown={e=>{if(e.target===e.currentTarget)setSelected(null);}}><section className="order-modal" role="dialog" aria-modal="true" aria-labelledby="customise-title"><button className="modal-close icon-button" onClick={()=>setSelected(null)} aria-label="Close item customisation"><X/></button><span className="eyebrow">{selectedItem.category}</span><h3 id="customise-title">{selectedItem.name}</h3><p>{selectedItem.description}</p><div className="modal-options"><b>MAKE IT YOURS <small>OPTIONAL EXTRAS</small></b>{selectedItem.options.length?selectedItem.options.map(option=><label key={option.id}><input type="checkbox" checked={chosen.includes(option.id)} onChange={e=>setChosen(current=>e.target.checked?[...current,option.id]:current.filter(id=>id!==option.id))}/><span>{option.label}</span><strong>+ {naira(option.priceKobo)}</strong></label>):<p>No extras available for this item.</p>}</div><div className="modal-bottom"><div className="quantity-control"><button onClick={()=>setQuantity(v=>Math.max(1,v-1))}><Minus size={14}/></button><span>{quantity}</span><button onClick={()=>setQuantity(v=>v+1)}><Plus size={14}/></button></div><button className="checkout-button" onClick={addSelected}>ADD · {naira((selectedItem.priceKobo+selectedItem.options.filter(option=>chosen.includes(option.id)).reduce((sum,option)=>sum+option.priceKobo,0))*quantity)}</button></div></section></div>}

    {checkout&&<div className="order-modal-backdrop"><section className="order-modal checkout-modal" role="dialog" aria-modal="true" aria-labelledby="checkout-title"><button className="modal-close icon-button" onClick={()=>setCheckout(false)} aria-label="Close checkout"><X/></button><span className="eyebrow">FINAL REVIEW</span><h3 id="checkout-title">YOUR DETAILS.</h3><p>Submit your details to validate the basket and generate a receipt. No payment is collected and no order is dispatched to a restaurant.</p><div className="checkout-fields"><label>FULL NAME<input value={customer.name} onChange={e=>setCustomer({...customer,name:e.target.value})} autoComplete="name" placeholder="Your name" required/></label><label>PHONE NUMBER<input value={customer.phone} onChange={e=>setCustomer({...customer,phone:e.target.value})} autoComplete="tel" placeholder="080..." required/></label><label>EMAIL · OPTIONAL<input type="email" value={customer.email} onChange={e=>setCustomer({...customer,email:e.target.value})} autoComplete="email" placeholder="you@example.com"/></label><label>ORDER NOTE · OPTIONAL<textarea value={customer.note} onChange={e=>setCustomer({...customer,note:e.target.value})} placeholder="Any details for this demo order?"/></label></div><div className="checkout-summary"><span>{cartCount} ITEMS</span><strong>{naira(total)}</strong></div>{error&&<p className="form-error" role="alert">{error}</p>}<button className="checkout-button" onClick={submit} disabled={busy}>{busy?"SUBMITTING ORDER…":"CONFIRM ORDER DETAILS"} <ArrowRight size={16}/></button><small className="demo-disclaimer">No payment is collected. This independent concept does not dispatch orders to a real restaurant.</small></section></div>}

    {receipt&&<div className="order-modal-backdrop"><section className="order-modal receipt-modal" role="dialog" aria-modal="true" aria-labelledby="receipt-title"><CheckCircle2 className="receipt-check"/><span className="eyebrow">{receipt.mode==="saved"?"ORDER RECORD CREATED":"DEMO ORDER SUMMARY"}</span><h3 id="receipt-title">{receipt.mode==="saved"?"ORDER<br/>RECORDED.":"ALL PUT<br/>TOGETHER."}</h3><p className="receipt-reference">REFERENCE · {receipt.reference}</p><strong className="receipt-total">{naira(receipt.totalKobo)}</strong><p>{receipt.message}</p><button className="checkout-button" onClick={()=>setReceipt(null)}>BACK TO MENU</button></section></div>}
    <p className="ordering-footnote">Independent concept experience. Prices are fictional sample values for interface testing, not verified restaurant prices.</p>
    <FoodAssistant onAddItem={addAssistantItem}/>
  </section>;
}
