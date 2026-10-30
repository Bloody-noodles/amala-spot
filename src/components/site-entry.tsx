"use client";

import { useState } from "react";

export function SiteEntry({ children }: { children: React.ReactNode }) {
  const [visible, setVisible] = useState(true);
  return (
    <div className={visible ? "site-shell is-entering" : "site-shell"}>
      {children}
      {visible && (
        <div className="entry-screen" onAnimationEnd={() => setVisible(false)} aria-label="Welcome to Amala Spot">
          <div className="entry-mark">AMALA<span>SPOT</span><i>®</i></div>
          <p>GOOD FOOD. GOOD PEOPLE. GOOD TIMES.</p>
          <div className="entry-rule"><span /></div>
        </div>
      )}
    </div>
  );
}
