"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { menuItems as fallbackMenu, type MenuItem } from "@/lib/menu";
import { addCartItem, getCartCount, getCartItemTotal, getCartTotal, updateCartQuantity, type CartLine } from "@/lib/cart";

export type { CartLine } from "@/lib/cart";
type OrderingContextValue = {
  menu: MenuItem[];
  cart: CartLine[];
  cartCount: number;
  totalKobo: number;
  cartOpen: boolean;
  setCartOpen: (open: boolean) => void;
  addItem: (itemId: string, quantity?: number, options?: string[]) => boolean;
  updateQuantity: (key: string, delta: number) => void;
  removeItem: (key: string) => void;
  clearCart: () => void;
  itemTotal: (line: CartLine) => number;
};
const OrderingContext = createContext<OrderingContextValue | null>(null);
const withLocalImages = (items: MenuItem[]) => items.map(item => {
  const fallback = fallbackMenu.find(entry => entry.id === item.id && entry.image);
  return fallback ? { ...item, image: item.image ?? fallback.image, imageAlt: item.imageAlt ?? fallback.imageAlt } : item;
});

export function OrderingProvider({ children }: { children: React.ReactNode }) {
  const [menu, setMenu] = useState<MenuItem[]>(fallbackMenu);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [cartOpen, setCartOpen] = useState(false);

  useEffect(() => {
    let active = true;
    fetch("/api/menu", { cache: "no-store" })
      .then(async response => {
        if (!response.ok) throw new Error("Live menu unavailable");
        return response.json();
      })
      .then(data => { if (active && Array.isArray(data.items) && data.items.length) setMenu(withLocalImages(data.items)); })
      .catch(() => {});
    const onSnapshot = (event: Event) => {
      const next = (event as CustomEvent<MenuItem[]>).detail;
      if (Array.isArray(next) && next.length) setMenu(withLocalImages(next));
    };
    window.addEventListener("amala:menu-snapshot", onSnapshot);
    return () => { active = false; window.removeEventListener("amala:menu-snapshot", onSnapshot); };
  }, []);

  const addItem = useCallback((itemId: string, quantity = 1, options: string[] = []) => {
    const item = menu.find(entry => entry.id === itemId);
    if (!item) return false;
    setCart(current => addCartItem(current, item, quantity, options));
    setCartOpen(true);
    return true;
  }, [menu]);
  const updateQuantity = useCallback((key: string, delta: number) => {
    setCart(current => updateCartQuantity(current, key, delta));
  }, []);
  const removeItem = useCallback((key: string) => setCart(current => current.filter(line => line.key !== key)), []);
  const clearCart = useCallback(() => setCart([]), []);
  const itemTotal = useCallback((line: CartLine) => getCartItemTotal(line, menu), [menu]);
  const cartCount = getCartCount(cart);
  const totalKobo = getCartTotal(cart, menu);
  const value = useMemo(() => ({ menu, cart, cartCount, totalKobo, cartOpen, setCartOpen, addItem, updateQuantity, removeItem, clearCart, itemTotal }), [menu, cart, cartCount, totalKobo, cartOpen, addItem, updateQuantity, removeItem, clearCart, itemTotal]);
  return <OrderingContext.Provider value={value}>{children}</OrderingContext.Provider>;
}

export function useOrdering() {
  const value = useContext(OrderingContext);
  if (!value) throw new Error("useOrdering must be used inside OrderingProvider");
  return value;
}
