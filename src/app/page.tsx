import Image from "next/image";
import Link from "next/link";
import { ArrowDown, ArrowUpRight } from "lucide-react";
import { MobileNavigation } from "@/components/mobile-navigation";

const categories = ["AMALA", "RICE", "SWALLOWS", "SOUPS", "GRILLS", "SMALL CHOPS", "DRINKS"];
const dishes = [
  { name: "Amala & Ewedu", note: "A Yoruba classic, rich and deeply comforting.", price: "₦ —", image: "photo-1604908176997-125f25cc6f3d", tag: "HOUSE FAVOURITE" },
  { name: "Smoky Jollof Rice", note: "Long-grain rice with a bold, slow-cooked pepper base.", price: "₦ —", image: "photo-1512058564366-18510be2db19", tag: "RICE & STAPLES" },
  { name: "Asun", note: "Peppered, fire-kissed meat with a proper kick.", price: "₦ —", image: "photo-1544025162-d76694265947", tag: "FROM THE GRILL" }
];

function Eyebrow({ children }: { children: React.ReactNode }) {
  return <span className="eyebrow">{children}</span>;
}

export default function Home() {
  return (
    <main>
      <div className="announcement"><span>THE TASTE OF HOME, WITH A LITTLE EXTRA.</span><span>MADE FOR THE WAY WE EAT <span aria-hidden>↗</span></span></div>
      <header className="site-header">
        <Link className="wordmark" href="/" aria-label="Amala Spot home">AMALA<span>SPOT</span><i>®</i></Link>
        <nav className="desktop-nav" aria-label="Main navigation">
          <Link href="#story">OUR STORY</Link><Link href="#menu">THE MENU</Link><Link href="#experiences">EXPERIENCES</Link><Link href="#contact">CONTACT</Link>
        </nav>
        <Link className="header-cta" href="#menu">EXPLORE MENU <ArrowUpRight size={15} /></Link>
        <MobileNavigation />
      </header>

      <section className="hero">
        <div className="hero-copy">
          <Eyebrow>GOOD FOOD. GOOD PEOPLE. GOOD TIMES.</Eyebrow>
          <h1>ROOTED IN<br /><em>FLAVOUR.</em><br />MADE TO<br />BRING US<br />TOGETHER<span>.</span></h1>
          <div className="hero-bottom">
            <p>From the first scoop of amala to the last grain of jollof. Find the food that feels like home.</p>
            <Link className="round-link" href="#menu" aria-label="Explore the menu"><ArrowDown /></Link>
          </div>
        </div>
        <div className="hero-visual">
          <Image src="https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=1400&q=90" alt="A richly prepared Nigerian-inspired meal" fill priority sizes="(max-width: 800px) 100vw, 55vw" />
          <div className="hero-stamp"><span>REAL FOOD</span><b>REAL<br />FLAVOUR</b><span>ALWAYS.</span></div>
          <div className="hero-image-caption"><span>01 / THE GOOD STUFF</span><span>MADE WITH HEART ↗</span></div>
        </div>
        <div className="hero-index">01 — 04</div>
      </section>

      <section className="ticker" aria-label="Food categories">
        <div className="ticker-track">{[...categories, ...categories].map((item, i) => <span key={i}>{item}<b>✳</b></span>)}</div>
      </section>

      <section className="intro section-pad" id="story">
        <div className="intro-top"><Eyebrow>01 / A LITTLE ABOUT US</Eyebrow><span className="section-number">THE TABLE IS BIG ENOUGH.</span></div>
        <div className="intro-grid">
          <h2>FOOD IS<br />OUR <em>LOVE</em><br />LANGUAGE<span>.</span></h2>
          <div className="intro-copy"><p className="lead">The best meals do more than fill a plate. They bring people closer, tell stories, and make ordinary days feel like something worth celebrating.</p><p>We’re building a home for the dishes we grew up loving and the flavours we keep coming back to. Yoruba roots, Nigerian soul, and a seat for everybody.</p><Link className="text-link" href="#menu">GET TO KNOW THE MENU <ArrowUpRight size={16} /></Link></div>
        </div>
      </section>

      <section className="featured section-pad" id="experiences">
        <div className="section-heading"><div><Eyebrow>02 / SOMETHING FOR EVERY CRAVING</Eyebrow><h2>COME HUNGRY.<br /><em>LEAVE HAPPY.</em></h2></div><p>Big comfort. Bold flavour. A little something for every kind of appetite.</p></div>
        <div className="dish-grid">{dishes.map((dish, i) => <article className="dish-card" key={dish.name}><div className="dish-image"><Image src={`https://images.unsplash.com/${dish.image}?auto=format&fit=crop&w=900&q=85`} alt={dish.name} fill sizes="(max-width: 800px) 90vw, 30vw" /><span className="dish-index">0{i + 1}</span><span className="dish-tag">{dish.tag}</span></div><div className="dish-meta"><div><h3>{dish.name}</h3><p>{dish.note}</p></div><span>{dish.price}</span></div></article>)}</div>
        <p className="sample-note">Menu photography is illustrative. Prices and availability will be populated from verified menu data.</p>
      </section>

      <section className="statement">
        <div className="statement-image"><Image src="https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=1800&q=90" alt="A spread of colourful food" fill sizes="100vw" /></div>
        <div className="statement-overlay"><Eyebrow>MADE FOR EVERY KIND OF GATHERING</Eyebrow><h2>PASS THE PLATE.<br /><em>SHARE THE LOVE.</em></h2><Link className="light-link" href="#menu">FIND YOUR NEXT FAVOURITE <ArrowUpRight size={16} /></Link></div>
      </section>

      <section className="process section-pad">
        <div className="section-heading"><div><Eyebrow>03 / EASY DOES IT</Eyebrow><h2>GOOD FOOD.<br /><em>NO LONG STORY.</em></h2></div><p>A few simple steps between you and the food you’re thinking about.</p></div>
        <div className="steps">{[{n:"01",t:"FIND YOUR CRAVING",d:"Browse the menu and discover something that hits the spot."},{n:"02",t:"MAKE IT YOURS",d:"Choose your favourites and add the extras you love."},{n:"03",t:"CHECK YOUR ORDER",d:"Review your selections and confirm your demo order."},{n:"04",t:"THAT'S THE GOOD STUFF",d:"Get a clear summary of what you put together."}].map(s=><article className="step" key={s.n}><span>{s.n}</span><h3>{s.t}</h3><p>{s.d}</p><ArrowUpRight className="step-arrow" /></article>)}</div>
      </section>

      <section className="menu-section section-pad" id="menu">
        <div className="menu-head"><div><Eyebrow>04 / STRAIGHT FROM THE MENU</Eyebrow><h2>THE GOOD<br /><em>STUFF.</em></h2></div><p>A taste of what’s on the table. The full catalogue will be powered by one live menu source.</p></div>
        <div className="menu-list">{[{cat:"SWALLOWS & SOUPS",items:"Amala · Eba · Iyan · Semo · Ewedu · Gbegiri · Egusi"},{cat:"RICE & STAPLES",items:"Jollof Rice · Fried Rice · Ofada Rice · Beans · Plantain"},{cat:"GRILLS & MORE",items:"Asun · BBQ · Chicken · Moi Moi · Pepper Soup"},{cat:"DRINKS & TREATS",items:"Zobo · Smoothies · Parfait"}].map((group,i)=><article className="menu-row" key={group.cat}><span>0{i+1}</span><h3>{group.cat}</h3><p>{group.items}</p><ArrowUpRight /></article>)}</div>
        <p className="sample-note">Concept catalogue only. No prices, stock status, or restaurant inventory are being represented as verified.</p>
      </section>

      <section className="assistant-promo">
        <div className="assistant-orb">A<span>•</span>I</div>
        <div><Eyebrow>YOUR FOOD-FINDING SIDEKICK</Eyebrow><h2>NOT SURE WHAT<br /><em>YOU’RE CRAVING?</em></h2><p>Tell the Amala Spot assistant what you feel like eating. It’ll help you explore the menu and put together a basket.</p></div>
        <Link className="assistant-link" href="#contact">MEET THE ASSISTANT <ArrowUpRight /></Link>
      </section>

      <section className="closing section-pad" id="contact"><Eyebrow>GOOD FOOD IS BETTER SHARED</Eyebrow><h2>SEE YOU<br /><em>AT THE TABLE.</em></h2><Link className="closing-cta" href="#menu">EXPLORE THE MENU <ArrowUpRight /></Link></section>
      <footer className="footer"><Link className="wordmark footer-logo" href="/">AMALA<span>SPOT</span><i>®</i></Link><p>A Nigerian food experience, built with heart.</p><div><Link href="#story">OUR STORY</Link><Link href="#menu">MENU</Link><Link href="#contact">CONTACT</Link></div><small>INDEPENDENT CONCEPT PROJECT · © {new Date().getFullYear()} AMALA SPOT</small></footer>
    </main>
  );
}
