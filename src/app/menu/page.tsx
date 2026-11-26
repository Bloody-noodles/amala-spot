import { OrderingExperience } from "@/components/ordering-experience";

export const metadata = { title: "Menu | Amala Spot", description: "Browse the Amala Spot sample menu." };

export default function MenuPage() {
  return <main className="inner-page menu-page"><section className="inner-hero"><span className="app-kicker">THE FULL CATALOGUE · SAMPLE DATA</span><h1>FIND YOUR<br/><em>FAVOURITE.</em></h1><p>Explore the dishes and drinks in the current sample catalogue. Menu availability and prices are illustrative.</p></section><OrderingExperience/><p className="sample-disclosure">All prices are illustrative sample values. Live menu availability is used when the connected catalogue is available. Photography is representative and for portfolio demonstration.</p></main>;
}
