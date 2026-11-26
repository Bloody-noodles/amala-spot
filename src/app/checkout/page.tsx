"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowUpRight, CheckCircle2, Minus, Plus, Trash2 } from "lucide-react";
import { formatNaira } from "@/lib/menu";
import { useOrdering } from "@/components/ordering-context";

type Receipt = { reference: string; totalKobo: number; customerName: string; message: string; mode?: "saved" | "demo"; lookupToken?: string };

export default function CheckoutPage() {
  const { menu, cart, cartCount, totalKobo, itemTotal, updateQuantity, removeItem, clearCart } = useOrdering();
  const [customer, setCustomer] = useState({ name: "", phone: "", email: "", note: "" });
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/orders", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ customer, items: cart.map(({ itemId, quantity, options }) => ({ itemId, quantity, options })) }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not prepare the demonstration order.");
      setReceipt(data);
      clearCart();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Please try again.");
    } finally {
      setBusy(false);
    }
  }

  if (receipt) return <main className="inner-page checkout-page"><section className="checkout-receipt"><CheckCircle2 size={35}/><span className="app-kicker">{receipt.mode === "saved" ? "ORDER RECORD CREATED" : "DEMO ORDER SUMMARY"}</span><h1>ALL PUT<br/><em>TOGETHER.</em></h1><p className="receipt-reference">REFERENCE · {receipt.reference}</p><strong className="receipt-total">{formatNaira(receipt.totalKobo)}</strong><p>{receipt.message}</p>{receipt.lookupToken && <div className="receipt-key"><b>PRIVATE TRACKING KEY</b><code>{receipt.lookupToken}</code><small>Save this key. It is required to view your order progress.</small><button type="button" onClick={() => navigator.clipboard?.writeText(receipt.lookupToken!)}>COPY KEY</button><Link href="/track">TRACK ORDER ↗</Link></div>}<Link className="primary-link" href="/menu">BACK TO MENU <ArrowUpRight size={16}/></Link></section></main>;

  return <main className="inner-page checkout-page"><section className="inner-hero"><span className="app-kicker">FINAL REVIEW · DEMONSTRATION CHECKOUT</span><h1>YOUR<br/><em>BASKET.</em></h1><p>No payment is collected. Orders are not sent to or fulfilled by a real restaurant.</p></section>
    <div className="checkout-layout"><section className="checkout-lines" aria-label="Basket items">{cart.length ? cart.map(line => {
      const item = menu.find(entry => entry.id === line.itemId);
      if (!item) return null;
      const options = item.options.filter(option => line.options.includes(option.id));
      return <article key={line.key}><div><span className="app-kicker">{item.category}</span><h2>{item.name}</h2><p>{options.length ? options.map(option => option.label).join(" · ") : "Standard serving"}</p><strong>{formatNaira(itemTotal(line))}</strong></div><div className="checkout-line-actions"><button type="button" onClick={() => updateQuantity(line.key, -1)} aria-label={`Remove one ${item.name}`}><Minus size={14}/></button><span>{line.quantity}</span><button type="button" onClick={() => updateQuantity(line.key, 1)} aria-label={`Add one ${item.name}`}><Plus size={14}/></button><button className="checkout-remove" type="button" onClick={() => removeItem(line.key)} aria-label={`Remove ${item.name}`}><Trash2 size={15}/></button></div></article>;
    }) : <div className="checkout-empty"><h2>YOUR BASKET IS EMPTY.</h2><p>Take a look through the menu and add something you like.</p><Link className="text-action" href="/menu">BROWSE THE MENU <ArrowUpRight size={16}/></Link></div>}
      {cart.length > 0 && <div className="checkout-total"><span>{cartCount} ITEMS · DEMO TOTAL</span><strong>{formatNaira(totalKobo)}</strong></div>}
    </section>
    <form className="checkout-form" onSubmit={submit}><span className="app-kicker">YOUR DETAILS</span><h2>WHO’S AT<br/><em>THE TABLE?</em></h2><label>FULL NAME<input required minLength={2} maxLength={100} autoComplete="name" value={customer.name} onChange={event => setCustomer({ ...customer, name: event.target.value })} placeholder="Your name"/></label><label>PHONE NUMBER<input required minLength={7} maxLength={24} autoComplete="tel" value={customer.phone} onChange={event => setCustomer({ ...customer, phone: event.target.value })} placeholder="080…"/></label><label>EMAIL · OPTIONAL<input type="email" maxLength={254} autoComplete="email" value={customer.email} onChange={event => setCustomer({ ...customer, email: event.target.value })} placeholder="you@example.com"/></label><label>ORDER NOTE · OPTIONAL<textarea maxLength={500} value={customer.note} onChange={event => setCustomer({ ...customer, note: event.target.value })} placeholder="Any details for this demo order?"/></label>{error && <p className="form-error" role="alert">{error}</p>}<button className="primary-link checkout-submit" type="submit" disabled={busy || !cart.length}>{busy ? "PREPARING SUMMARY…" : "CONFIRM DEMO ORDER"} <ArrowUpRight size={16}/></button><small>No payment credentials are requested or collected.</small></form></div>
  </main>;
}
