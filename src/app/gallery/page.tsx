import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { galleryCatalogueCount, galleryItems, verifiedPhotoCount } from "@/lib/gallery";

export const metadata = { title: "Gallery | Amala Spot" };

export default function GalleryPage() {
  return <main className="inner-page gallery-page">
    <section className="inner-hero">
      <span className="app-kicker">A FEW FAMILIAR FAVOURITES</span>
      <h1>NAIJA ON<br/><em>THE TABLE.</em></h1>
      <p>A curated selection of food and drinks photographed and matched to the menu. The gallery gives you a closer look; the complete catalogue lives on the menu page.</p>
    </section>
    <section className="gallery-collection" aria-label="Selected menu photography">
      {galleryItems.map((item, index) => <figure className={`gallery-photo gallery-photo-${index + 1}`} key={item.id}>
        <div className="gallery-photo-frame"><Image src={item.image!} alt={item.imageAlt ?? item.name} fill sizes="(max-width: 640px) 100vw, 60vw"/></div>
        <figcaption><span className="app-kicker">{item.category}</span><strong>{item.name}</strong></figcaption>
      </figure>)}
    </section>
    <section className="gallery-footnote">
      <p>{verifiedPhotoCount} of {galleryCatalogueCount} fallback catalogue items currently have verified photos. More images will be added as suitable sources are confirmed.</p>
      <Link className="text-action" href="/images/menu/ATTRIBUTION.md">VIEW PHOTO CREDITS <ArrowUpRight size={16}/></Link>
      <Link className="text-action" href="/menu">BROWSE THE COMPLETE MENU <ArrowUpRight size={16}/></Link>
    </section>
  </main>;
}
