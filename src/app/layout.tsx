import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Amala Spot — Nigerian Food, Beautifully Served",
  description: "Discover the richness of Nigerian food. Explore the menu and build your order with Amala Spot.",
  applicationName: "Amala Spot"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
