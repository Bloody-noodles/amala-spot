"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, Circle, Clock3, Search, ShieldCheck } from "lucide-react";

type Event = { status: string; note: string | null; created_at: string };
type Order = { reference: string; status: string; totalKobo: number; createdAt: string; items: { item_name: string; quantity: number; line_total_kobo: number }[]; events: Event[] };
const stages = ["received", "confirmed", "preparing", "ready", "completed"];
const labels: Record<string, string> = { received: "Order received", confirmed: "Order confirmed", preparing: "Being prepared", ready: "Ready", completed: "Completed", cancelled: "Cancelled" };
const money = (kobo: number) => new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(kobo / 100);
const date = (value: string) => new Intl.DateTimeFormat("en-NG", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));

export default function TrackOrderPage() {
  const [reference, setReference] = useState("");
  const [trackingKey, setTrackingKey] = useState("");
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function lookup(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); setOrder(null); setBusy(true);
    try {
      const response = await fetch("/api/orders/track", { method: "POST", headers: { "Content-Type": "application/json" }, cache: "no-store", body: JSON.stringify({ reference, trackingKey }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to find this order.");
      setOrder(data.order);
    } catch (e) { setError(e instanceof Error ? e.message : "Please try again."); }
    finally { setBusy(false); }
  }

  const currentIndex = order ? stages.indexOf(order.status) : -1;
  return <main className="tracking-page">
    <header className="tracking-header"><Link className="wordmark" href="/">AMALA<span>SPOT</span><i>®</i></Link><Link href="/" className="tracking-back"><ArrowLeft size={15}/> BACK TO SITE</Link></header>
    <section className="tracking-main">
      <span className="eyebrow">ORDER LOOKUP · PRIVATE ACCESS</span>
      <h1>YOUR ORDER.<br/><em>IN THE KNOW.</em></h1>
      <p className="tracking-intro">Enter the reference and private tracking key shown on your order receipt to view its latest status.</p>
      <form className="tracking-form" onSubmit={lookup}>
        <label>ORDER REFERENCE<input value={reference} onChange={e=>setReference(e.target.value.toUpperCase())} placeholder="AS-XXXXXXXXXX" autoComplete="off" required/></label>
        <label>PRIVATE TRACKING KEY<input value={trackingKey} onChange={e=>setTrackingKey(e.target.value.trim())} placeholder="Paste your 64-character key" autoComplete="off" minLength={64} maxLength={64} required/></label>
        <button type="submit" disabled={busy}><Search size={16}/>{busy ? "CHECKING…" : "FIND MY ORDER"}</button>
        {error && <p className="tracking-error" role="alert">{error}</p>}
      </form>
      {order && <section className="tracking-result" aria-live="polite">
        <div className="tracking-result-head"><div><span className="eyebrow">ORDER · {order.reference}</span><h2>{labels[order.status] || order.status}</h2></div><span className={`status status-${order.status}`}>{order.status}</span></div>
        {order.status === "cancelled" ? <p className="tracking-cancelled">This order has been cancelled. The timeline below records the latest update.</p> : <div className="tracking-timeline">{stages.map((stage,index)=>{const done=currentIndex>=index;const event=[...order.events].reverse().find(item=>item.status===stage);return <article className={done?"is-done":""} key={stage}><span className="tracking-step-icon">{done?<CheckCircle2 size={19}/>:<Circle size={19}/>}</span><div><b>{labels[stage]}</b>{event&&<small>{date(event.created_at)}</small>}</div></article>;})}</div>}
        <div className="tracking-order-meta"><span>PLACED {date(order.createdAt)}</span><strong>{money(order.totalKobo)}</strong></div>
        <div className="tracking-items"><span className="eyebrow">ORDER SUMMARY</span>{order.items.map((item,index)=><div key={index}><span>{item.quantity} × {item.item_name}</span><b>{money(item.line_total_kobo)}</b></div>)}</div>
        <div className="tracking-events"><span className="eyebrow">UPDATE HISTORY</span>{order.events.map((item,index)=><article key={index}><Clock3 size={14}/><div><b>{labels[item.status] || item.status}</b><small>{date(item.created_at)}</small>{item.note&&<p>{item.note}</p>}</div></article>)}</div>
        <p className="tracking-refresh">Status is checked when you look up the order. Refresh this page and search again for the latest update.</p>
      </section>}
      <div className="tracking-security"><ShieldCheck size={17}/><p>Your tracking key is private. Anyone with both the order reference and key can view its status, so keep the key to yourself.</p></div>
      <p className="tracking-disclaimer">Independent portfolio concept. Orders are stored in a demonstration database and are not sent to a real restaurant, paid for, or fulfilled.</p>
    </section>
  </main>;
}
