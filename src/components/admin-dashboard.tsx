"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Activity, ArrowLeft, CheckCircle2, ChevronRight, Clock3, LogOut, PackageCheck, RefreshCw, ShieldCheck, XCircle, Utensils } from "lucide-react";
import { AdminMenuManager } from "@/components/admin-menu-manager";

type OrderItem = { id: string; item_name: string; quantity: number; base_price_kobo: number; line_total_kobo: number; order_item_options?: { id: string; option_label: string; price_kobo: number }[] };
type Order = { id: string; reference: string; customer_name: string; customer_phone: string; customer_email: string | null; customer_note: string | null; status: string; subtotal_kobo: number; created_at: string; order_items: OrderItem[] };
const statuses = ["received", "confirmed", "preparing", "ready", "completed", "cancelled"];
const nextStatus: Record<string, string> = { received: "confirmed", confirmed: "preparing", preparing: "ready", ready: "completed" };
const label: Record<string, string> = { received: "New", confirmed: "Confirmed", preparing: "Preparing", ready: "Ready", completed: "Completed", cancelled: "Cancelled" };
const money = (kobo: number) => new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(kobo / 100);
const date = (value: string) => new Intl.DateTimeFormat("en-NG", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));

export function AdminDashboard() {
  const [password, setPassword] = useState("");
  const [view,setView]=useState<"orders"|"menu">("orders");
  const [authenticated, setAuthenticated] = useState(false);
  const [configured, setConfigured] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [selected, setSelected] = useState<string | null>(null);
  const [filter, setFilter] = useState("all");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [note, setNote] = useState("");
  const load = useCallback(async () => {
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/admin/orders", { cache: "no-store" });
      const data = await response.json();
      if (response.status === 401) { setAuthenticated(false); return; }
      if (!response.ok) throw new Error(data.error || "Could not load orders.");
      setOrders(data.orders); setCounts(data.counts || {}); setAuthenticated(true);
    } catch (e) { setError(e instanceof Error ? e.message : "Could not load orders."); }
    finally { setBusy(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);
  const active = orders.find(order => order.id === selected) || null;
  const filtered = useMemo(() => orders.filter(order => filter === "all" || order.status === filter), [orders, filter]);
  const login = async (event: React.FormEvent) => {
    event.preventDefault(); setError(""); setBusy(true);
    try {
      const response = await fetch("/api/admin/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password }) });
      const data = await response.json();
      if (!response.ok) { if (response.status === 503) setConfigured(false); throw new Error(data.error || "Sign in failed."); }
      setPassword(""); await load();
    } catch (e) { setError(e instanceof Error ? e.message : "Sign in failed."); }
    finally { setBusy(false); }
  };
  const update = async (status: string) => {
    if (!active) return;
    setBusy(true); setError(""); setNotice("");
    try {
      const response = await fetch(`/api/admin/orders/${active.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status, note }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not update order.");
      setNotice(`${active.reference} moved to ${label[status]}.`); setNote(""); await load();
    } catch (e) { setError(e instanceof Error ? e.message : "Could not update order."); }
    finally { setBusy(false); }
  };
  const logout = async () => { await fetch("/api/admin/login", { method: "DELETE" }); setAuthenticated(false); setSelected(null); };
  if (!authenticated) return <main className="admin-shell"><div className="admin-login"><Link className="admin-brand" href="/">AMALA<span>SPOT</span><i> / ADMIN</i></Link><ShieldCheck size={34}/><p className="admin-kicker">PRIVATE OPERATIONS</p><h1>ADMIN<br/><em>ACCESS.</em></h1><p className="admin-intro">Sign in to manage orders saved by this independent concept storefront.</p><form onSubmit={login}><label>ADMIN PASSWORD<input type="password" value={password} onChange={e=>setPassword(e.target.value)} autoComplete="current-password" required/></label>{error&&<p className="admin-error">{error}</p>}<button disabled={busy}>{busy ? "CHECKING…" : "UNLOCK DASHBOARD"} <ChevronRight size={16}/></button></form>{!configured&&<p className="admin-setup">Admin credentials are not configured. Set ADMIN_PASSWORD and ADMIN_SESSION_SECRET in the Vercel Production environment, then redeploy.</p>}<Link className="admin-back" href="/">← BACK TO STOREFRONT</Link></div></main>;
  return <main className="admin-shell"><header className="admin-header"><Link className="admin-brand" href="/">AMALA<span>SPOT</span><i> / OPERATIONS</i></Link><div><span><Activity size={14}/> PRIVATE DASHBOARD</span><button onClick={()=>setView(view==="orders"?"menu":"orders")}><Utensils size={15}/> {view==="orders"?"MENU MANAGER":"ORDER ROOM"}</button><button onClick={logout}><LogOut size={15}/> SIGN OUT</button></div></header>{view==="menu"&&<AdminMenuManager/>}<section className={view==="menu"?"admin-main admin-hidden":"admin-main"}><div className="admin-title-row"><div><p className="admin-kicker">ORDER OPERATIONS / LIVE DATABASE</p><h1>THE ORDER<br/><em>ROOM.</em></h1><p className="admin-intro">A working view of orders saved to the Amala Spot concept database.</p></div><button className="admin-refresh" onClick={()=>void load()} disabled={busy}><RefreshCw size={15}/> REFRESH</button></div><div className="admin-stats">{[{name:"ALL ORDERS",value:orders.length,icon:<Activity/>},{name:"NEW",value:counts.received||0,icon:<Clock3/>},{name:"IN PROGRESS",value:(counts.confirmed||0)+(counts.preparing||0),icon:<PackageCheck/>},{name:"COMPLETED",value:counts.completed||0,icon:<CheckCircle2/>}].map(stat=><article key={stat.name}>{stat.icon}<span>{stat.name}</span><strong>{stat.value}</strong></article>)}</div>{error&&<p className="admin-error admin-alert">{error}</p>}{notice&&<p className="admin-notice">{notice}</p>}<div className="admin-workspace"><section className="admin-list"><div className="admin-list-head"><h2>ORDERS <small>{filtered.length}</small></h2><select value={filter} onChange={e=>setFilter(e.target.value)}><option value="all">All statuses</option>{statuses.map(status=><option key={status} value={status}>{label[status]}</option>)}</select></div>{filtered.length===0?<div className="admin-empty"><PackageCheck size={28}/><p>No orders in this view yet.</p><small>New customer orders will appear here after they are saved.</small></div>:filtered.map(order=><button className={`admin-order-row ${selected===order.id?"selected":""}`} key={order.id} onClick={()=>setSelected(order.id)}><span className="admin-order-top"><b>{order.reference}</b><i className={`status status-${order.status}`}>{label[order.status]}</i></span><strong>{order.customer_name}</strong><span>{order.order_items?.length||0} line items · {money(Number(order.subtotal_kobo))}</span><small>{date(order.created_at)}</small></button>)}</section><section className="admin-detail">{!active?<div className="admin-empty admin-detail-empty"><PackageCheck size={32}/><h2>SELECT AN ORDER.</h2><p>Choose an order to inspect customer details, items and status history.</p></div>:<><div className="admin-detail-head"><button onClick={()=>setSelected(null)} className="admin-mobile-back"><ArrowLeft size={15}/> ALL ORDERS</button><p className="admin-kicker">ORDER REFERENCE</p><h2>{active.reference}</h2><i className={`status status-${active.status}`}>{label[active.status]}</i><small>Placed {date(active.created_at)}</small></div><div className="admin-customer"><p className="admin-kicker">CUSTOMER</p><strong>{active.customer_name}</strong><a href={`tel:${active.customer_phone}`}>{active.customer_phone}</a>{active.customer_email&&<a href={`mailto:${active.customer_email}`}>{active.customer_email}</a>}{active.customer_note&&<blockquote>“{active.customer_note}”</blockquote>}</div><div className="admin-items"><p className="admin-kicker">ORDER CONTENTS</p>{active.order_items?.map(item=><article key={item.id}><div><strong>{item.quantity} × {item.item_name}</strong>{item.order_item_options?.map(option=><small key={option.id}>+ {option.option_label}</small>)}</div><b>{money(Number(item.line_total_kobo))}</b></article>)}<div className="admin-total"><span>ORDER TOTAL</span><strong>{money(Number(active.subtotal_kobo))}</strong></div></div><div className="admin-status-actions"><p className="admin-kicker">MOVE ORDER FORWARD</p>{nextStatus[active.status]?<><label>INTERNAL NOTE · OPTIONAL<input value={note} onChange={e=>setNote(e.target.value)} placeholder="Add a short status note"/></label><button disabled={busy} onClick={()=>void update(nextStatus[active.status])}>MARK AS {label[nextStatus[active.status]].toUpperCase()} <ChevronRight size={16}/></button><small>Next step only. Completed and cancelled orders are locked.</small></>:<p className="admin-locked"><XCircle size={15}/> This order is {active.status}. No further status changes are available.</p>}{active.status!=="completed"&&active.status!=="cancelled"&&active.status!=="ready"&&<button className="admin-cancel" disabled={busy} onClick={()=>void update("cancelled")}>CANCEL ORDER</button>}</div></>}</section></div><p className="admin-disclaimer">Independent concept database · No orders are transmitted to or fulfilled by a real restaurant.</p></section></main>;
}
