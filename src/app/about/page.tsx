import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

export const metadata = { title: "Our Story | Amala Spot" };

export default function AboutPage() {
  return <main className="inner-page about-page"><section className="inner-hero"><span className="app-kicker">OUR STORY · OUR TABLE</span><h1>ROOTED IN<br/><em>FLAVOUR.</em></h1><p>A Nigerian food concept built around the dishes that bring people together.</p></section><section className="about-story"><span className="app-kicker">FOOD IS A WAY OF FINDING EACH OTHER</span><h2>YORUBA ROOTS.<br/>NIGERIAN SOUL.<br/><em>ROOM FOR EVERYBODY.</em></h2><div><p>Amala Spot is an independent portfolio concept celebrating familiar Nigerian food and the warmth of sharing a meal. From a comforting swallow and soup to the jollof that gathers everyone around, the table is part of the story.</p><p>Menu items, prices, and restaurant details in this experience are sample content. This project is not operated by a restaurant and does not fulfil submitted orders.</p><Link className="text-action" href="/menu">EXPLORE THE SAMPLE MENU <ArrowUpRight size={16}/></Link></div></section><section className="about-callout"><span className="app-kicker">GOOD FOOD. GOOD PEOPLE. GOOD TIMES.</span><h2>THERE’S ALWAYS<br/><em>ROOM FOR ONE MORE.</em></h2></section></main>;
}
