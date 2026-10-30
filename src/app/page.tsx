import Image from "next/image";
import Link from "next/link";
import { ArrowDown, ArrowUpRight } from "lucide-react";
import { MobileNavigation } from "@/components/mobile-navigation";
import { SiteEntry } from "@/components/site-entry";

const categories = ["AMALA", "RICE", "SWALLOWS", "SOUPS", "GRILLS", "SMALL CHOPS", "DRINKS"];
const dishes = [
  { name: "Amala, Gbegiri & Ewedu", note: "The full Yoruba trio, rich, earthy and deeply comforting.", price: "SAMPLE", image: "https://commons.wikimedia.org/wiki/Special:FilePath/Amala_and_Gbegiri_with_Ewedu_soup.jpg", tag: "YORUBA CLASSIC", credit: "Bukky658 · Wikimedia Commons · CC BY-SA 4.0" },
  { name: "Smoky Jollof Rice", note: "Nigerian party-style rice with a bold, slow-cooked pepper base.", price: "SAMPLE", image: "https://commons.wikimedia.org/wiki/Special:FilePath/Nigerian_jollof_rice.jpg", tag: "RICE & STAPLES", credit: "Halima Waziri · Wikimedia Commons · CC BY-SA 4.0" },
  { name: "Peppered Asun", note: "Fire-kissed, peppered goat meat with a proper kick.", price: "SAMPLE", image: "https://commons.wikimedia.org/wiki/Special:FilePath/Asun.jpg", tag: "FROM THE GRILL", credit: "Wikimedia Commons · CC BY-SA 4.0" }
];
const foodGallery = [
  { title: "AMALA & ABULA", subtitle: "Yam-flour swallow with gbegiri, ewedu and stew", image: "https://commons.wikimedia.org/wiki/Special:FilePath/Amala_and_Gbegiri_with_Ewedu_soup.jpg", alt: "Amala with gbegiri, ewedu, pepper stew and beef", credit: "Photo: Bukky658 · CC BY-SA 4.0", href: "https://commons.wikimedia.org/wiki/File:Amala_and_Gbegiri_with_Ewedu_soup.jpg" },
  { title: "NIGERIAN JOLLOF", subtitle: "The party-table favourite", image: "https://commons.wikimedia.org/wiki/Special:FilePath/Nigerian_jollof_rice.jpg", alt: "Nigerian jollof rice", credit: "Photo: Halima Waziri · CC BY-SA 4.0", href: "https://commons.wikimedia.org/wiki/File:Nigerian_jollof_rice.jpg" },
  { title: "OFADA RICE", subtitle: "Local rice with its signature pepper sauce", image: "https://commons.wikimedia.org/wiki/Special:FilePath/Ofada_Rice.jpg", alt: "Ofada rice with traditional sauce and assorted meat", credit: "Photo: Ijeoma · CC BY-SA 4.0", href: "https://commons.wikimedia.org/wiki/File:Ofada_Rice.jpg" },
  { title: "EGUSI SOUP", subtitle: "A rich Nigerian melon-seed soup", image: "https://commons.wikimedia.org/wiki/Special:FilePath/Assorted_Egusi.jpg", alt: "Nigerian egusi soup with assorted protein", credit: "Wikimedia Commons · see source page", href: "https://commons.wikimedia.org/wiki/File:Assorted_Egusi.jpg" },
  { title: "ASUN", subtitle: "Peppered, smoky goat meat", image: "https://commons.wikimedia.org/wiki/Special:FilePath/Asun.jpg", alt: "Nigerian asun peppered goat meat", credit: "Wikimedia Commons · see source page", href: "https://commons.wikimedia.org/wiki/File:Asun.jpg" },
  { title: "BANGA SOUP", subtitle: "Palm-fruit soup from the Niger Delta", image: "https://commons.wikimedia.org/wiki/Special:FilePath/BangaSoup.jpg", alt: "Nigerian banga soup", credit: "Aderiqueza · CC BY-SA 4.0", href: "https://commons.wikimedia.org/wiki/File:BangaSoup.jpg" },
  { title: "AKARA", subtitle: "Crisp bean cakes, freshly fried", image: "https://commons.wikimedia.org/wiki/Special:FilePath/Akara.jpg", alt: "Nigerian akara bean cakes", credit: "Wikimedia Commons · see source page", href: "https://commons.wikimedia.org/wiki/File:Akara.jpg" },
  { title: "PEPPER SOUP", subtitle: "A warming, peppery Nigerian broth", image: "https://commons.wikimedia.org/wiki/Special:FilePath/Assorted_meat_pepper_soup_at_Lagos_Island.jpg", alt: "Assorted meat pepper soup at Lagos Island", credit: "Bob Walker · CC BY-SA 2.0", href: "https://commons.wikimedia.org/wiki/File:Assorted_meat_pepper_soup_at_Lagos_Island.jpg" }
];

const menuGroups = [
 {cat:"SWALLOWS",items:["Amala","Eba","Iyan (Pounded Yam)","Semo","Wheat","Fufu","Starch"]},
 {cat:"SOUPS & STEWS",items:["Ewedu","Gbegiri","Egusi","Efo Riro","Ogbono","Okra Soup","Afang Soup","Edikang Ikong","Oha Soup","Banga Soup","Bitterleaf Soup","Nsala (White Soup)","Groundnut Soup","Vegetable Soup","Ofada Stew","Ata Din Din"]},
 {cat:"RICE & GRAINS",items:["Smoky Jollof Rice","Nigerian Fried Rice","Ofada Rice","White Rice","Coconut Rice","Native Rice","Basmati Rice","Rice & Beans","Beans Porridge","Yam Porridge"]},
 {cat:"SIDES & SMALL CHOPS",items:["Dodo (Fried Plantain)","Moi Moi","Akara","Puff Puff","Samosa","Spring Rolls","Peppered Gizzard","Peppered Ponmo","Coleslaw","Boiled Yam","Fried Yam","Boiled Plantain"]},
 {cat:"GRILLS & PROTEIN",items:["Asun","Suya","Grilled Chicken","Peppered Turkey","BBQ Chicken","Peppered Beef","Grilled Fish","Pepper Soup","Chicken Pepper Soup","Goat Meat Pepper Soup","Turkey Wings"]},
 {cat:"QUICK BITES & MORE",items:["Shawarma","Chicken & Chips","Spaghetti","Stir-fry Noodles","Beef Burger","Club Sandwich"]},
 {cat:"DRINKS & TREATS",items:["Zobo","Chapman","Fresh Orange Juice","Smoothies","Tiger Nut Drink","Kunu","Parfait","Fruit Salad","Yoghurt"]}
];

function Eyebrow({ children }: { children: React.ReactNode }) {
  return <span className="eyebrow">{children}</span>;
}

export default function Home() {
  return (
    <SiteEntry><main>
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
          <Image src="https://commons.wikimedia.org/wiki/Special:FilePath/Amala_and_Gbegiri_with_Ewedu_soup.jpg" alt="Yoruba amala served with gbegiri, ewedu, pepper stew and assorted meat" fill priority unoptimized sizes="(max-width: 800px) 100vw, 55vw" />
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
        <div className="dish-grid">{dishes.map((dish, i) => <article className="dish-card" key={dish.name}><div className="dish-image"><Image src={dish.image} alt={dish.name} fill unoptimized sizes="(max-width: 800px) 90vw, 30vw" /><span className="dish-index">0{i + 1}</span><span className="dish-tag">{dish.tag}</span></div><div className="dish-meta"><div><h3>{dish.name}</h3><p>{dish.note}</p></div><span>{dish.price}</span></div><p className="image-credit">{dish.credit}</p></article>)}</div>
        <p className="sample-note">Menu photography is illustrative. Prices and availability will be populated from verified menu data.</p>
      </section>

      <section className="statement">
        <div className="statement-image"><Image src="https://commons.wikimedia.org/wiki/Special:FilePath/Nigerian_jollof_rice.jpg" alt="A plate of Nigerian jollof rice" fill unoptimized sizes="100vw" /></div>
        <div className="statement-overlay"><Eyebrow>MADE FOR EVERY KIND OF GATHERING</Eyebrow><h2>PASS THE PLATE.<br /><em>SHARE THE LOVE.</em></h2><Link className="light-link" href="#menu">FIND YOUR NEXT FAVOURITE <ArrowUpRight size={16} /></Link></div>
      </section>

      <section className="food-gallery section-pad" id="food-gallery">
        <div className="section-heading"><div><Eyebrow>03 / A FEW FAMILIAR FAVOURITES</Eyebrow><h2>NAIJA ON<br /><em>THE TABLE.</em></h2></div><p>Real dishes, recognisable flavours. Explore a little of the food culture behind the menu.</p></div>
        <div className="food-gallery-grid">{foodGallery.map((food,i)=><article className="food-tile" key={food.title}><a className="food-tile-image" href={food.href} target="_blank" rel="noreferrer"><Image src={food.image} alt={food.alt} fill unoptimized sizes="(max-width: 640px) 90vw, (max-width: 1000px) 45vw, 25vw" /><span className="food-tile-number">0{i+1}</span><span className="food-tile-open">VIEW SOURCE ↗</span></a><div className="food-tile-copy"><div><h3>{food.title}</h3><p>{food.subtitle}</p></div><small>{food.credit}</small></div></article>)}</div>
      </section>

      <section className="process section-pad">
        <div className="section-heading"><div><Eyebrow>04 / EASY DOES IT</Eyebrow><h2>GOOD FOOD.<br /><em>NO LONG STORY.</em></h2></div><p>A few simple steps between you and the food you’re thinking about.</p></div>
        <div className="steps">{[{n:"01",t:"FIND YOUR CRAVING",d:"Browse the menu and discover something that hits the spot."},{n:"02",t:"MAKE IT YOURS",d:"Choose your favourites and add the extras you love."},{n:"03",t:"CHECK YOUR ORDER",d:"Review your selections and confirm your demo order."},{n:"04",t:"THAT'S THE GOOD STUFF",d:"Get a clear summary of what you put together."}].map(s=><article className="step" key={s.n}><span>{s.n}</span><h3>{s.t}</h3><p>{s.d}</p><ArrowUpRight className="step-arrow" /></article>)}</div>
      </section>

      <section className="menu-section section-pad" id="menu">
        <div className="menu-head"><div><Eyebrow>05 / STRAIGHT FROM THE MENU</Eyebrow><h2>THE GOOD<br /><em>STUFF.</em></h2></div><p>A taste of what’s on the table. The full catalogue will be powered by one live menu source.</p></div>
        <div className="menu-list">{menuGroups.map((group,i)=><article className="menu-row" key={group.cat}><span>{String(i+1).padStart(2,"0")}</span><h3>{group.cat}</h3><p>{group.items.map((item,j)=><span className="menu-item" key={item}>{item}{j < group.items.length-1 ? <i> · </i> : null}</span>)}</p><ArrowUpRight /></article>)}</div>
        <p className="sample-note">Concept catalogue only. No prices, stock status, or restaurant inventory are being represented as verified.</p>
      </section>

      <section className="assistant-promo">
        <div className="assistant-orb">A<span>•</span>I</div>
        <div><Eyebrow>YOUR FOOD-FINDING SIDEKICK</Eyebrow><h2>NOT SURE WHAT<br /><em>YOU’RE CRAVING?</em></h2><p>Tell the Amala Spot assistant what you feel like eating. It’ll help you explore the menu and put together a basket.</p></div>
        <Link className="assistant-link" href="#contact">MEET THE ASSISTANT <ArrowUpRight /></Link>
      </section>

      <section className="closing section-pad" id="contact"><Eyebrow>GOOD FOOD IS BETTER SHARED</Eyebrow><h2>SEE YOU<br /><em>AT THE TABLE.</em></h2><Link className="closing-cta" href="#menu">EXPLORE THE MENU <ArrowUpRight /></Link></section>
      <footer className="footer"><Link className="wordmark footer-logo" href="/">AMALA<span>SPOT</span><i>®</i></Link><p>A Nigerian food experience, built with heart.</p><div><Link href="#story">OUR STORY</Link><Link href="#menu">MENU</Link><Link href="#contact">CONTACT</Link></div><small>INDEPENDENT CONCEPT PROJECT · © {new Date().getFullYear()} AMALA SPOT</small></footer>
    </main></SiteEntry>
  );
}
