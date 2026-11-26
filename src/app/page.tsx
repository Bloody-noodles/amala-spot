import Link from "next/link";
import Image from "next/image";
import { ArrowDown, ArrowUpRight } from "lucide-react";
import { SiteEntry } from "@/components/site-entry";
import { FeaturedMenu } from "@/components/featured-menu";
import { galleryItems } from "@/lib/gallery";

export default function Home() {
  return <SiteEntry><main className="home-page">
    <section className="home-hero">
      <div className="home-hero-copy"><span className="app-kicker">NIGERIAN FOOD · MADE FOR THE TABLE</span><h1>GOOD FOOD.<br/><em>GOOD PEOPLE.</em><br/>GOOD TIMES.</h1><p>Yoruba roots, Nigerian soul, and a seat for everybody. Find something that feels like home.</p><Link className="primary-link" href="/menu">EXPLORE THE MENU <ArrowUpRight size={16}/></Link></div>
      <div className="home-hero-art" aria-label="Amala, ewedu, gbegiri and obe ata"><div className="home-hero-photo"><Image src="/images/home/abula-hero.jpg" alt="Amala served with ewedu, gbegiri and rich obe ata stew." fill priority sizes="(max-width: 640px) 100vw, 50vw"/></div><div className="home-art-index">AMALA · EWEDU · GBEGIRI<br/>A TASTE OF HOME</div></div>
      <a className="home-scroll" href="#signature"><span>SCROLL TO EXPLORE</span><ArrowDown size={15}/></a>
    </section>

    <section className="home-marquee" aria-label="Our food values"><div>ROOTED IN FLAVOUR <b>✳</b> MADE TO BE SHARED <b>✳</b> ALWAYS ROOM FOR ONE MORE <b>✳</b> ROOTED IN FLAVOUR <b>✳</b> MADE TO BE SHARED <b>✳</b></div></section>

    <section className="home-story" id="story"><div className="home-section-top"><span className="app-kicker">01 / A LITTLE ABOUT US</span><span>THE TABLE IS BIG ENOUGH.</span></div><div className="home-story-grid"><h2>FOOD IS OUR<br/><em>LOVE LANGUAGE.</em></h2><div><p className="home-story-lead">The best meals do more than fill a plate. They bring people closer, tell stories, and make ordinary days worth celebrating.</p><p>We’re building a home for the dishes we grew up loving and the flavours we keep coming back to. Yoruba roots, Nigerian soul, and a seat for everybody.</p><Link className="text-action" href="/about">OUR STORY <ArrowUpRight size={16}/></Link></div></div></section>

    <section className="home-signature" id="signature"><div className="home-section-heading"><div><span className="app-kicker">02 / SOMETHING FOR EVERY CRAVING</span><h2>COME HUNGRY.<br/><em>LEAVE HAPPY.</em></h2></div><p>Comfort, colour, and the familiar flavours that bring us back to the table.</p></div><FeaturedMenu/><p className="sample-disclosure">Sample catalogue and prices for interface demonstration. Not verified restaurant inventory or pricing.</p></section>

    <section className="home-gallery-teaser"><div><span className="app-kicker">03 / A FEW FAMILIAR FAVOURITES</span><h2>NAIJA ON<br/><em>THE TABLE.</em></h2><p>A closer look at selected dishes and drinks, matched to the menu and credited in the gallery.</p><Link className="text-action" href="/gallery">VISIT THE GALLERY <ArrowUpRight size={16}/></Link></div><div className="gallery-teaser-art" role="group" aria-label="Selected menu photography">{galleryItems.slice(0, 3).map((item, index) => <figure className={`gallery-teaser-photo gallery-teaser-photo-${index + 1}`} key={item.id}><Image src={item.image!} alt={item.imageAlt ?? item.name} fill sizes="(max-width: 640px) 58vw, 34vw"/><figcaption><span className="app-kicker">{item.category}</span><strong>{item.name}</strong></figcaption></figure>)}</div></section>

    <section className="home-note"><span className="app-kicker">GOOD FOOD IS BETTER SHARED</span><h2>PASS THE PLATE.<br/><em>SHARE THE LOVE.</em></h2><Link className="light-action" href="/menu">FIND YOUR NEXT FAVOURITE <ArrowUpRight size={17}/></Link><div aria-hidden className="home-note-stamp">MADE<br/>WITH<br/>HEART</div></section>

    <section className="home-assistant-promo"><div className="assistant-promo-mark">A<span>·</span>I</div><div><span className="app-kicker">A LITTLE HELP CHOOSING?</span><h2>LET’S FIND<br/><em>YOUR CRAVING.</em></h2><p>Talk it through with Amala AI. Get a recommendation and add it to your sample basket when you’re ready.</p></div><p className="assistant-hint">Tap “Talk to Amala” for a live voice call, or browse the full menu.</p></section>

    <section className="home-contact"><span className="app-kicker">04 / PULL UP A CHAIR</span><h2>SEE YOU<br/><em>AT THE TABLE.</em></h2><Link className="primary-link" href="/menu">EXPLORE THE MENU <ArrowUpRight size={16}/></Link></section>
  </main></SiteEntry>;
}
