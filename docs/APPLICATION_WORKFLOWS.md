# Application Workflows

## Browse and menu
1. Load categories and visible menu items from the canonical data source.
2. Filter/search without inventing unavailable items.
3. Display sample prices only as clearly labelled concept data until verified.

## Cart
1. Add an item with quantity and valid modifier selections.
2. Keep the initial cart client-side.
3. Revalidate current item, price, availability, and modifiers on the server before checkout.

## Demonstration checkout
1. Collect name and phone; email and note are optional.
2. Recalculate totals from canonical data.
3. Ask for explicit customer confirmation.
4. Create order, item snapshots, modifier snapshots, and initial event atomically.
5. Return a secure lookup token/reference and disclose that this is a demo only.

## AI
The assistant calls the same menu/cart/order services as the UI. It can prepare but not silently submit an order. Explicit confirmation is mandatory.
