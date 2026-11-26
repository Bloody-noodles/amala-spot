"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef } from "react";
import { Minus, Plus, ShoppingBag, X } from "lucide-react";
import { formatNaira } from "@/lib/menu";
import { useOrdering } from "@/components/ordering-context";
import { FoodAssistant } from "@/components/food-assistant";
import { isolateModal } from "@/lib/modal-isolation";

const links = [
  { href: "/menu", label: "MENU" },
  { href: "/about", label: "OUR STORY" },
  { href: "/gallery", label: "GALLERY" },
  { href: "/track", label: "TRACK ORDER" }
];

export function SiteShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { menu, cart, cartCount, totalKobo, cartOpen, setCartOpen, addItem, updateQuantity, removeItem, itemTotal } = useOrdering();
  const basketRef = useRef<HTMLElement>(null);
  const basketCloseRef = useRef<HTMLButtonElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const skipFocusRestoreRef = useRef(false);
  const closeBasket = useCallback((restoreFocus = true) => {
    skipFocusRestoreRef.current = !restoreFocus;
    setCartOpen(false);
  }, [setCartOpen]);
  useEffect(() => {
    if (!cartOpen) return;
    const restorePage = basketRef.current ? isolateModal(basketRef.current) : () => {};
    previousFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    basketCloseRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") { event.preventDefault(); closeBasket(); return; }
      if (event.key !== "Tab") return;
      const focusable = Array.from(basketRef.current?.querySelectorAll<HTMLElement>('button:not(:disabled), a[href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])') ?? []);
      if (!focusable.length) { event.preventDefault(); return; }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (!basketRef.current?.contains(document.activeElement)) { event.preventDefault(); first.focus(); }
      else if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      restorePage();
      if (skipFocusRestoreRef.current) { skipFocusRestoreRef.current = false; return; }
      if (previousFocusRef.current?.isConnected) previousFocusRef.current.focus();
    };
  }, [cartOpen, closeBasket]);
  if (pathname.startsWith("/admin")) return <>{children}</>;
  return <>
    <div className="site-announcement"><span>ROOTED IN FLAVOUR.</span><span>GOOD FOOD. GOOD PEOPLE. GOOD TIMES.</span></div>
    <header className="app-header">
      <Link className="app-wordmark" href="/" aria-label="Amala Spot home">AMALA<span>SPOT</span><i>®</i></Link>
      <nav className="app-nav" aria-label="Main navigation">{links.map(link => <Link key={link.href} href={link.href} aria-current={pathname === link.href ? "page" : undefined}>{link.label}</Link>)}</nav>
      <div className="app-header-actions">
        <button className="app-basket-trigger" type="button" onClick={() => cartOpen ? closeBasket() : setCartOpen(true)} aria-label={`Basket, ${cartCount} items`} aria-haspopup="dialog" aria-expanded={cartOpen} aria-controls={cartOpen ? "shared-basket" : undefined}><ShoppingBag size={17}/><span>BASKET</span><b>{cartCount}</b></button>
        <Link className="app-order-cta" href="/menu">ORDER FOOD <span aria-hidden>↗</span></Link>
      </div>
    </header>
    {children}
    <footer className="app-footer">
      <Link className="app-wordmark" href="/">AMALA<span>SPOT</span><i>®</i></Link>
      <p>Nigerian food, made for the table.</p>
      <nav aria-label="Footer navigation">{links.slice(0, 3).map(link => <Link key={link.href} href={link.href}>{link.label}</Link>)}</nav>
      <small>INDEPENDENT CONCEPT · SAMPLE MENU · NO REAL RESTAURANT FULFILMENT</small>
    </footer>
    <FoodAssistant onAddItem={(itemId, quantity) => addItem(itemId, quantity)} cart={cart.map(({ itemId, quantity, options }) => ({ itemId, quantity, options }))}/>
    {cartCount > 0 && pathname !== "/checkout" && <Link className="mobile-basket-bar" href="/checkout"><span><ShoppingBag size={17}/> {cartCount} ITEMS</span><strong>{formatNaira(totalKobo)}</strong><b>CHECKOUT ↗</b></Link>}
    {cartOpen && <div className="basket-backdrop" onMouseDown={event => { if (event.target === event.currentTarget) closeBasket(); }}>
      <aside id="shared-basket" ref={basketRef} className="shared-basket" role="dialog" aria-modal="true" aria-labelledby="shared-basket-title">
        <header><div><span className="app-kicker">YOUR SELECTION</span><h2 id="shared-basket-title">BASKET <small>({cartCount})</small></h2></div><button ref={basketCloseRef} type="button" onClick={() => closeBasket()} aria-label="Close basket"><X/></button></header>
        {cart.length === 0 ? <p className="shared-basket-empty">Your basket is waiting. Add something good from the menu.</p> : <div className="shared-basket-lines">{cart.map(line => {
          const item = menu.find(entry => entry.id === line.itemId);
          if (!item) return null;
          const options = item.options.filter(option => line.options.includes(option.id));
          return <article key={line.key}><div><b>{item.name}</b><small>{options.length ? options.map(option => option.label).join(" · ") : "Standard serving"}</small><strong>{formatNaira(itemTotal(line))}</strong></div><section><button type="button" onClick={() => updateQuantity(line.key, -1)} aria-label={`Remove one ${item.name}`}><Minus size={14}/></button><output aria-label={`${item.name} quantity`}>{line.quantity}</output><button type="button" onClick={() => updateQuantity(line.key, 1)} aria-label={`Add one ${item.name}`}><Plus size={14}/></button><button className="shared-remove" type="button" aria-label={`Remove ${item.name} from basket`} onClick={() => removeItem(line.key)}>REMOVE</button></section></article>;
        })}</div>}
        <div className="shared-basket-total"><span>DEMO TOTAL</span><strong>{formatNaira(totalKobo)}</strong></div>
        <p className="shared-demo-note">Illustrative sample prices. Checkout does not collect payment or send orders to a restaurant.</p>
        <Link className="app-order-cta shared-checkout-link" href="/checkout" onClick={() => closeBasket(false)}>REVIEW BASKET & CHECKOUT ↗</Link>
      </aside>
    </div>}
  </>;
}
