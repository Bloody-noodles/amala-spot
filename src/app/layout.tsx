import type { Metadata } from "next";
import { OrderingProvider } from "@/components/ordering-context";
import { SiteShell } from "@/components/site-shell";
import "./globals.css";

export const metadata: Metadata = {
  title: "Amala Spot | Rooted in Flavour",
  description: "Discover Nigerian food, find your next favourite, and build a demonstration basket with Amala Spot.",
  applicationName: "Amala Spot"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body><OrderingProvider><SiteShell>{children}</SiteShell></OrderingProvider></body></html>;
}
