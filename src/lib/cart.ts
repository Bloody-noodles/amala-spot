import type { MenuItem } from "@/lib/menu";

export type CartLine = { key: string; itemId: string; quantity: number; options: string[] };

export function addCartItem(current: CartLine[], item: MenuItem, quantity = 1, options: string[] = []): CartLine[] {
  const selectedOptions = [...new Set(options)]
    .filter((id) => item.options.some((option) => option.id === id))
    .sort();
  const key = `${item.id}:${selectedOptions.join(",")}`;
  const amount = Math.min(20, Math.max(1, Math.trunc(Number.isFinite(quantity) ? quantity : 1)));
  const existing = current.find((line) => line.key === key);

  if (existing) {
    return current.map((line) => line.key === key
      ? { ...line, quantity: Math.min(20, line.quantity + amount) }
      : line);
  }

  return [...current, { key, itemId: item.id, quantity: amount, options: selectedOptions }];
}

export function updateCartQuantity(current: CartLine[], key: string, delta: number): CartLine[] {
  const amount = Math.trunc(Number.isFinite(delta) ? delta : 0);
  if (amount === 0) return current;
  return current
    .map((line) => line.key === key ? { ...line, quantity: Math.min(20, line.quantity + amount) } : line)
    .filter((line) => line.quantity > 0);
}

export function getCartItemTotal(line: CartLine, menu: MenuItem[]): number {
  const item = menu.find((entry) => entry.id === line.itemId);
  if (!item) return 0;
  const extras = item.options
    .filter((option) => line.options.includes(option.id))
    .reduce((sum, option) => sum + option.priceKobo, 0);
  return (item.priceKobo + extras) * line.quantity;
}

export function getCartCount(cart: CartLine[]): number {
  return cart.reduce((sum, line) => sum + line.quantity, 0);
}

export function getCartTotal(cart: CartLine[], menu: MenuItem[]): number {
  return cart.reduce((sum, line) => sum + getCartItemTotal(line, menu), 0);
}
