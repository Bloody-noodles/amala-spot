"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight, Plus } from "lucide-react";
import { formatNaira } from "@/lib/menu";
import { useOrdering } from "@/components/ordering-context";

export function FeaturedMenu() {
  const { menu, addItem } = useOrdering();
  const photoFeatured = menu.filter(item => item.image).slice(0, 3);
  const featured = photoFeatured.length ? photoFeatured : menu.slice(0, 3);
  return <div className="home-featured-grid">{featured.map((item, index) => <article className="home-featured-item" key={item.id}>
    <div className={`home-featured-art art-${index + 1}${item.image ? " has-photo" : ""}`}>{item.image ? <Image src={item.image} alt={item.imageAlt ?? item.name} fill sizes="(max-width: 640px) 100vw, 33vw"/> : <div aria-hidden="true"><span>{item.category}</span><b>{String(index + 1).padStart(2, "0")}</b><small>ITEM PHOTO<br/>AWAITING VERIFICATION</small></div>}</div>
    <div className="home-featured-meta"><div><span className="app-kicker">{item.category}</span><h3>{item.name}</h3><p>{item.description}</p></div><strong>{formatNaira(item.priceKobo)}</strong></div>
    <button type="button" className="home-featured-add" aria-label={`Add ${item.name} to basket`} onClick={() => addItem(item.id)}>ADD TO BASKET <Plus size={15}/></button>
  </article>)}<Link className="home-featured-all" href="/menu">BROWSE THE COMPLETE MENU <ArrowUpRight/></Link></div>;
}
