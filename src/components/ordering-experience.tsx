"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { ArrowUpRight, Minus, Plus, Search, X } from "lucide-react";
import { formatNaira } from "@/lib/menu";
import { isolateModal } from "@/lib/modal-isolation";
import { useOrdering } from "@/components/ordering-context";

export function OrderingExperience() {
  const { menu, addItem } = useOrdering();
  const [category, setCategory] = useState("All");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const [options, setOptions] = useState<string[]>([]);
  const [quantity, setQuantity] = useState(1);
  const modalRef = useRef<HTMLElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const categories = ["All", ...Array.from(new Set(menu.map(item => item.category)))];
  const visible = useMemo(() => menu.filter(item =>
    (category === "All" || item.category === category) &&
    `${item.name} ${item.description} ${item.category}`.toLowerCase().includes(query.trim().toLowerCase())
  ), [menu, category, query]);
  const activeItem = menu.find(item => item.id === selected) ?? null;

  useEffect(() => {
    if (!activeItem) return;
    const modal = modalRef.current;
    const restorePage = modal ? isolateModal(modal) : () => {};
    const focusable = () => modal?.querySelectorAll<HTMLElement>('button:not([disabled]), input:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])') ?? [];
    modal?.querySelector<HTMLElement>(".modal-close")?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") { event.preventDefault(); setSelected(null); return; }
      if (event.key !== "Tab") return;
      const elements = Array.from(focusable());
      if (!elements.length) { event.preventDefault(); return; }
      const first = elements[0];
      const last = elements[elements.length - 1];
      if (!modal?.contains(document.activeElement)) { event.preventDefault(); first.focus(); }
      else if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => { window.removeEventListener("keydown", onKeyDown); restorePage(); if (!modal?.isConnected) triggerRef.current?.focus(); };
  }, [activeItem]);

  return <section className="catalogue" aria-label="Menu catalogue">
    <div className="catalogue-tools">
      <label className="catalogue-search"><Search size={18}/><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search dishes and drinks" aria-label="Search menu"/></label>
      <div className="catalogue-filters" role="group" aria-label="Filter by category">{categories.map(name => <button type="button" key={name} aria-pressed={category === name} className={category === name ? "active" : ""} onClick={() => setCategory(name)}>{name}</button>)}</div>
    </div>
    <p className="catalogue-count" role="status" aria-live="polite">{visible.length} MENU {visible.length === 1 ? "ITEM" : "ITEMS"} <span>· SAMPLE CATALOGUE</span></p>
    {visible.length ? <div className="catalogue-list">{visible.map((item, index) => <article className="catalogue-row" key={item.id}>
      <div className="catalogue-number" aria-hidden="true">{String(index + 1).padStart(2, "0")}</div>
      <div className={`catalogue-art${item.image ? " has-photo" : ""} ${item.category === "Drinks & Refreshments" ? "is-drink" : "is-food"}`}>{item.image ? <Image src={item.image} alt={item.imageAlt ?? item.name} fill sizes="(max-width: 640px) calc(100vw - 80px), (max-width: 900px) calc((100vw - 100px) / 2), (max-width: 1200px) calc((100vw - 140px) / 3), 360px"/> : <div aria-hidden="true"><span>{item.category}</span><b>{item.name.split(/\s+/).map(word => word[0]).join("").slice(0, 3)}</b><small>PHOTO<br/>REQUIRED</small></div>}</div>
      <div className="catalogue-copy"><span className="app-kicker">{item.category}</span><h2>{item.name}</h2><p>{item.description}</p>{!item.image && <small className="catalogue-image-note">Item-specific image not yet verified.</small>}</div>
      <div className="catalogue-action"><strong>{formatNaira(item.priceKobo)}</strong><button type="button" aria-label={`Add ${item.name} to basket`} onClick={event => { triggerRef.current = event.currentTarget; setSelected(item.id); setOptions([]); setQuantity(1); }}>ADD TO BASKET <Plus size={16}/></button></div>
    </article>)}</div> : <div className="catalogue-empty"><h2>NO MATCHES JUST YET.</h2><p>Try a different dish or category.</p></div>}

    {activeItem && <div className="order-modal-backdrop" onMouseDown={event => { if (event.target === event.currentTarget) setSelected(null); }}><section ref={modalRef} className="order-modal" role="dialog" aria-modal="true" aria-labelledby="customise-title">
      <button className="modal-close icon-button" type="button" onClick={() => setSelected(null)} aria-label="Close item customisation"><X/></button><span className="eyebrow">{activeItem.category}</span><h3 id="customise-title">{activeItem.name}</h3><p>{activeItem.description}</p>
      <div className="modal-options"><b>MAKE IT YOURS <small>OPTIONAL EXTRAS</small></b>{activeItem.options.length ? activeItem.options.map(option => <label key={option.id}><input type="checkbox" checked={options.includes(option.id)} onChange={event => setOptions(current => event.target.checked ? [...current, option.id] : current.filter(id => id !== option.id))}/><span>{option.label}</span><strong>+ {formatNaira(option.priceKobo)}</strong></label>) : <p>No extras available for this item.</p>}</div>
      <div className="modal-bottom"><div className="quantity-control" role="group" aria-label={`${activeItem.name} quantity controls`}><button type="button" onClick={() => setQuantity(value => Math.max(1, value - 1))} disabled={quantity <= 1} aria-label={`Decrease ${activeItem.name} quantity`}><Minus size={14}/></button><output aria-label={`${activeItem.name} quantity`} aria-live="polite" aria-atomic="true">{quantity}</output><button type="button" onClick={() => setQuantity(value => Math.min(20, value + 1))} disabled={quantity >= 20} aria-label={`Increase ${activeItem.name} quantity`}><Plus size={14}/></button></div><button className="checkout-button" type="button" onClick={() => { addItem(activeItem.id, quantity, options); setSelected(null); }}>ADD · {formatNaira((activeItem.priceKobo + activeItem.options.filter(option => options.includes(option.id)).reduce((sum, option) => sum + option.priceKobo, 0)) * quantity)} <ArrowUpRight size={16}/></button></div>
    </section></div>}
  </section>;
}
