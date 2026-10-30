"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";

const links = [
  { href: "#story", label: "OUR STORY" },
  { href: "#menu", label: "THE MENU" },
  { href: "#experiences", label: "EXPERIENCES" },
  { href: "#contact", label: "CONTACT" }
];

export function MobileNavigation() {
  const [open, setOpen] = useState(false);

  return (
    <div className="mobile-navigation">
      <button
        className="mobile-menu"
        type="button"
        aria-label={open ? "Close navigation" : "Open navigation"}
        aria-expanded={open}
        aria-controls="mobile-navigation-panel"
        onClick={() => setOpen((value) => !value)}
      >
        {open ? <X /> : <Menu />}
      </button>
      {open && (
        <nav id="mobile-navigation-panel" className="mobile-navigation-panel" aria-label="Mobile navigation">
          {links.map((link) => (
            <Link key={link.href} href={link.href} onClick={() => setOpen(false)}>
              {link.label}
            </Link>
          ))}
        </nav>
      )}
    </div>
  );
}
