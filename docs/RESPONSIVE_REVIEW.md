# Responsive browser review

**Date:** 26 November 2026
**Target:** local production build, served at `127.0.0.1:3187`
**Browser:** Microsoft Edge headless with DevTools viewport emulation

## Visual inspection

- Homepage and menu: 1440 x 1000 desktop, 768 x 1024 tablet (menu), and 390 x 844 mobile.
- About, Gallery, Checkout, and Track: 390 x 844 mobile.
- On the first 390 px inspection, the hero and menu headings, header order action, and menu row action were clipped. The CSS viewport was subsequently set with DevTools device emulation to ensure the 390 px checks used 390 CSS pixels. Responsive heading, header, and catalogue rules were adjusted and the same views were checked again.
- The mobile assistant launcher uses a compact icon and `AI` label to reduce the space it covers. Its accessible button name and expanded state remain available.
- The category filter chips scroll horizontally by design. The homepage marquee is clipped within its own section.

## Viewport width checks

Measured `document.documentElement.scrollWidth` and `document.body.scrollWidth` after setting the CSS viewport. No checked route exceeded its viewport. Desktop measurements are 15 px below the viewport width because the browser reserves a vertical scrollbar.

| Route | CSS widths checked | Result |
|---|---|---|
| Home | 320, 375, 390, 430, 768, 1024, 1280, 1440 px | No page-level horizontal overflow |
| Menu | 320, 375, 390, 430, 768, 1024, 1280, 1440 px | No page-level horizontal overflow; category chips remain in their horizontal scroller |
| About | 320, 390, 768, 1024, 1440 px | No page-level horizontal overflow |
| Gallery | 320, 390, 768, 1024, 1440 px | No page-level horizontal overflow |
| Checkout | 320, 390, 768, 1024, 1440 px | No page-level horizontal overflow |
| Track | 320, 390, 768, 1024, 1440 px | No page-level horizontal overflow |

## Browser interaction checks

- Menu category `Rice & Grains` showed four sample items.
- Search for `ofada` showed one result: `Ofada Rice & Ayamase`.
- Added `Amala, Gbegiri & Ewedu`, increased its quantity to two in the shared basket, and confirmed the total displayed as NGN 9,000.
- Submitted the demo checkout and verified the demo receipt and no-payment/no-fulfilment disclaimer.
- Opened the global food assistant from the shared shell. Chat could not be completed because `GEMINI_API_KEY` is not configured in this workspace.

Keyboard-only navigation, screen-reader checks, voice input/output, and configured database-backed order, tracking, and admin journeys remain unverified.
# Keyboard follow-up — 26 November 2026

The menu item customisation dialog now moves focus to its close control, keeps Tab/Shift+Tab within the modal, closes on Escape, and restores focus to the item’s Add to Basket button when dismissed. Opening the floating assistant focuses its message field; conversation updates use a polite live log. These behaviors are implemented and type-checked/build-checked, but manual keyboard traversal and screen-reader behavior still require review in a browser.

## Food image review — 26 November 2026

Thirty-nine source files have been visually reviewed and mapped to matching fallback entries: Amala with Gbegiri and Ewedu, Amala & Ewedu, Eba & Ogbono, Pounded Yam & Egusi, Jollof, Nigerian Fried Rice, Egusi Soup, Efo Riro, Ewedu, Peppered Asun, Beef Suya, Assorted Meat Pepper Soup, Dodo, Moi Moi, Beans Porridge with fried plantain, Bottled Water, Almond Drink, Drinking Yoghurt, Tiger-Nut Milk, Kunu, Hollandia Yoghurt, Chivita Active, Chivita 100%, Sprite Can, Chilled Zobo, Chapman, Coca-Cola, Coca-Cola Can, Fanta Orange, Sprite, 7UP, Pepsi, Pepsi Can, Maltina, Malta Guinness, Greek Yoghurt, Five Alive Pulpy, Fanta Orange Can, and 7UP Can. The 7UP photo is a sealed lemon-lime soda bottle against a dark neutral background; Pepsi is a sealed 710 ml Canadian-market bottle against white, preserved whole in its menu row; the Pepsi can photo preserves the complete can with its logo facing forward; the Coca-Cola can photo preserves a complete can with Chinese-language packaging against a soft background; Tiger-Nut Milk shows bottled Kunun Aya with tiger nuts, dates, and coconut; the Maltina photo shows two sealed cans with their Nigerian branding visible; the Malta Guinness photo shows a bottle and glass of the dark malt drink; the Pepper Soup photo shows beef and honeycomb tripe in a bowl, with a tighter, lightly brightened crop; the Bottled Water crop centers the unbranded bottle while retaining its cap and base. Rejected candidates include one weaker Amala & Ewedu image, low-resolution Eba & Ogbono, two rejected Pepper Soup candidates, a pot-only Zobo image, a dark bottled Zobo image, Thai-labelled Coca-Cola bottle, Thai-labelled Fanta bottle and empty vintage Fanta bottle, cluttered Beans Porridge, dark wrapped Moi Moi, red-stew Ofada, cluttered Pepsi options, partial Sprite cans, and a Mojito-flavored 7UP can. The newly mapped photo crops have not been rechecked in a rendered browser view: local Edge and Chrome headless screenshot attempts failed to produce image files in this workspace. Do not treat the new asset crops as browser-verified.


## Catalogue filter accessibility update

Category controls are grouped with an accessible label, and each button exposes its selected state through `aria-pressed`. Typecheck, lint, and production build pass after this change. This is source-level verification only; keyboard-only and screen-reader behavior still need manual browser review.

## Latest local runtime check

The production build served `/menu` with HTTP 200. The rendered HTML included the category filter group and an initially pressed category button; the newly mapped Ewedu, Moi Moi, Pepper Soup, Eba & Ogbono, and Bottled Water image URLs all returned HTTP 200. The rendered menu HTML includes the Eba & Ogbono and Bottled Water image sources. `/api/menu` returned 503 because this workspace has no Supabase server configuration; the fallback menu items and their local photos were present in the rendered route. A new Edge headless screenshot attempt exited with Windows code `-2147483645` and produced no file, including with an isolated temporary profile. This confirms route and asset delivery, not visual crop quality in the browser or interactive keyboard behavior.

After mapping the Coca-Cola photo, the local production build returned HTTP 200 for `/menu` and `/images/menu/coca-cola.jpg`. The menu items are client-rendered, so the Coca-Cola image path was not present in the initial HTML response. This confirms route and asset delivery, not visual crop quality.

After mapping Fanta Orange, the local production build returned HTTP 200 for `/menu` and `/images/menu/fanta-orange.jpg`. Visual browser review of the card crop remains outstanding.

After mapping Sprite, `/menu` and `/images/menu/sprite.jpg` both returned HTTP 200 on the local production build. This confirms route and asset delivery only; the rendered crop still needs visual browser review.

After mapping 7UP, `/menu` and `/images/menu/7up.jpg` returned HTTP 200 on the local production build; the image response used `image/jpeg`. This verifies route and asset delivery, not the responsive card crop.

After mapping Pepsi, `/menu` and `/images/menu/pepsi.jpg` returned HTTP 200 on the local production build; the image response used `image/jpeg`. Its menu-row style uses `object-fit: contain` so the complete bottle remains visible. The rendered browser crop still needs visual review.

After mapping Maltina, `/menu` and `/images/menu/maltina.jpg` returned HTTP 200 on the local production build; the image response used `image/jpeg`. The source thumbnail was cropped to frame both cans. The responsive rendered crop remains unverified.

After mapping Malta Guinness, `/menu` and `/images/menu/malta-guinness.jpg` returned HTTP 200 on the local production build; the image response used `image/jpeg`. The source image shows the bottle and drink beside a glass; the responsive rendered crop remains unverified.

After mapping Almond Drink and Drinking Yoghurt, the source and optimized local files were visually reviewed. `npm run typecheck` and `npm run build` passed; `npm run lint` passed with the three existing `react-hooks/set-state-in-effect` warnings listed above. A local production server returned HTTP 200 for `/menu`, `/images/menu/almond-drink.jpg`, and `/images/menu/drinking-yoghurt.jpg`; both assets returned `image/jpeg`. A rendered browser crop review remains outstanding.

After mapping Pepsi Can, its complete portrait image was visually reviewed and its catalogue style now uses `object-fit: contain`, as with the Pepsi bottle. The photo source is CC BY 2.0 and uses the Pepsi logo used until 2023. `npm run typecheck` and `npm run build` passed; `npm run lint` passed with the same three existing effect warnings. Local production checks returned HTTP 200 for `/menu` and `/images/menu/pepsi-can.jpg` (image/jpeg). The rendered browser crop review remains outstanding.

After mapping Tiger-Nut Milk, the 810 × 1,080 CC0 source image was visually reviewed and retained locally at source dimensions. `npm run typecheck` and `npm run build` passed; `npm run lint` passed with the same three existing effect warnings. Local production checks returned HTTP 200 for `/menu` and `/images/menu/tiger-nut-milk.jpg` (image/jpeg). The rendered browser crop remains unreviewed.

After mapping Coca-Cola Can, the complete 1,200 × 1,958 CC BY-SA 4.0 source image was visually reviewed. `npm run typecheck` and `npm run build` passed; `npm run lint` passed with the same three `react-hooks/set-state-in-effect` warnings. The local production build returned HTTP 200 for `/`, `/menu`, `/about`, `/gallery`, `/checkout`, `/track`, `/admin`, and `/images/menu/coca-cola-can.jpg` (image/jpeg). The new card crop has not been reviewed in a rendered browser; these checks verify compilation and delivery only.

## Catalogue result announcements

The visible result count now has `role="status"` and `aria-live="polite"` so search and category result changes can be announced. Typecheck, lint, and production build pass. A local production route check confirmed `/menu` returns HTTP 200 and server-rendered markup contains the live status, polite announcement, and selected filter state. Interactive announcement timing still needs screen-reader review.

## Item quantity bounds

The item customisation modal now caps quantity at the shared basket limit of 20. Decrease/increase controls disable at their respective bounds, and the current quantity is announced through a polite live output. Typecheck, lint, and production build pass after this change; lint retains the same three warnings listed above. Runtime interaction still needs browser verification.

## Latest rendered-crop attempt

After the latest production build, Chrome headless screenshot attempts at 390 × 844 (menu and home) and 1,440 × 1,000 (menu) failed before rendering. Chrome reported Windows access-denied errors from Crashpad and the Mojo platform channel, and no screenshot files were produced. The routes and image assets were separately confirmed to return HTTP 200. Browser-rendered review of the newly mapped crop and a fresh visual comparison at these widths remain outstanding.


## Latest accessibility and quality maintenance

Initial admin order and menu requests now avoid synchronous state changes in effect bodies, ignore late results after unmount, and retain their refresh loading states. Assistant speech capability detection now uses useSyncExternalStore with a stable server snapshot. Typecheck and production build pass; lint now passes with zero warnings. The latest local production runtime returned HTTP 200 for all public routes, /admin, and the Coca-Cola Can photo; unauthenticated admin API reads returned 401 as expected. These HTTP checks do not replace a rendered keyboard or screen-reader review.

## Palette contrast review

Calculated WCAG contrast ratios for the primary token pairs: brown on cream 12.26:1; action orange (#b6371c) on cream 5.27:1; white on action orange 5.91:1; yellow on brown 8.94:1. The brighter orange (#e94f2b) on cream is 3.33:1 and is reserved for large/bold brand lettering; yellow on cream is 1.37:1 and is not used for text. This token-level check does not replace a full rendered-page contrast audit.

A further Chrome headless attempt with single-process mode and crash reporting disabled also failed at the Windows Mojo platform channel with access denied. It produced no screenshot; rendered image-crop inspection and manual keyboard traversal remain outstanding.

## Shared basket keyboard behavior

The basket trigger now exposes an accessible name, dialog relation, and expanded state. Opening the modal drawer focuses its close button; Tab and Shift+Tab wrap within the drawer; Escape and backdrop dismissal close it and return focus to the opener. Following the checkout link closes the drawer without restoring focus to the page being left. Typecheck, lint (zero warnings), and production build pass. The latest local production runtime returned HTTP 200 for all public routes, /admin, and the mapped Coca-Cola Can image; the unauthenticated admin orders endpoint returned 401. These are source and route checks; manual keyboard traversal and screen-reader verification remain outstanding.


## Recent asset and typography updates

The owner confirmed the site licence for `BaticaSans-Regular.otf`; the display face is loaded from the local fonts directory. Three carton photos from Open Food Facts products 6151100052186 (Hollandia, image 4), 6151100052766 (Chivita Active, front image), and 6151100050014 (Chivita 100%, front image) were reviewed and mapped under the source image licence. They use `object-fit: contain`. A complete Sprite can photo from Wikimedia Commons was also mapped to `sprite-can`; it is cropped from a CC BY-SA 4.0 photo that includes a glass. `/images/menu/hollandia-yoghurt.jpg`, `/images/menu/chivita-active.jpg`, `/images/menu/chivita-100.jpg`, `/images/menu/sprite-can.jpg`, and `/fonts/BaticaSans-Regular.otf` all returned HTTP 200 from the local production build. These new crops still need inspection in a rendered browser.

## Accessible controls, modal isolation, and quality gate

Homepage and menu add buttons, assistant menu-pick buttons, and basket removal buttons identify the affected menu item. Modal and basket quantity values have item-specific accessible labels; item-modal quantity controls are named. Decorative menu row numbers are hidden from assistive technology, and the assistant launcher exposes its dialog relationship and the spoken-replies toggle exposes its pressed state.

The shared basket and item-customization modal make sibling content outside the active dialog inert. Previous inert states are restored when the dialog closes, before focus returns to its opener. Typecheck, lint (zero warnings), and production build pass. The production build returned HTTP 200 for `/`, `/menu`, `/gallery`, and `/checkout`. Initial HTML confirms the homepage/menu add names and assistant toggle state. Drawer/modal interaction, manual keyboard traversal, and screen-reader behavior still need direct browser review; the available browser automation attempts fail with Windows access-denied errors.


## Local Phase 8 API checks

On the local production build, a two-item Amala demo request with one ponmo extra per item returned HTTP 201 and 1,060,000 kobo. Its response explicitly says it was not saved. Unknown extras, duplicate extras, and quantity 21 each returned HTTP 400; malformed tracking input returned 400, a syntactically valid 64-character key returned 503 without Supabase configuration, unauthenticated admin orders returned 401, and assistant chat returned 503 without `GEMINI_API_KEY`. No persistent order was created.


### Item dialog focus containment

Code review found that the item-customization dialog trapped Tab at its first and last controls but did not recover focus if it was moved outside the dialog programmatically. The key handler now sends Tab or Shift+Tab back to the first dialog control in that case, prevents default when no controls are available, and prevents Escape default while closing. TypeScript, lint, and production build pass after this change. Direct keyboard and assistive-technology checks still require a browser session.


## Touch target sizing: 26 November 2026

Item customisation quantity buttons, shared basket quantity/removal controls, and checkout quantity/removal controls now have 44 px square targets. Item dialog and basket close controls, assistant close/send/suggestion buttons, and the mobile menu button use the same target size. Admin login, order, and menu management actions and form controls now meet the same minimum. Public brand/navigation/footer links, tracking and checkout fields, and receipt copy/tracking actions also have 44 px minimum targets. At the mobile breakpoint, checkout line actions stack below the item details to keep the larger controls from crowding the row. Typecheck, lint, and the production build pass after the CSS change. The rebuilt app returned HTTP 200 for `/`, `/menu`, `/about`, `/gallery`, `/checkout`, `/track`, `/admin`, and its compiled stylesheet; the stylesheet contains the 44 px target rules. Rendered spacing still needs a browser review; the local headless browsers in this workspace fail before producing screenshots.


## Mobile checkout basket bar: 26 November 2026

The persistent mobile basket bar is hidden on `/checkout`. The checkout page already shows the basket summary and submit action; hiding the fixed bar prevents it from covering the form and removes a duplicate checkout link. Typecheck, lint, and the production build pass after the change. The rebuilt app returned HTTP 200 for `/`, `/menu`, `/about`, `/gallery`, `/checkout`, `/track`, and `/admin`. Direct mobile browser layout review remains outstanding.


## Admin menu icon control names: 26 November 2026

The admin visibility toggle now announces whether it will show or hide the named dish from the customer menu. The remove-extra icon button announces the extra label, or its row number when the label is blank. Admin login/menu/order errors use alert semantics, and success notices use a polite status announcement. Typecheck, lint, and production build pass; the rebuilt `/admin` route and its stylesheet returned HTTP 200.


## Assistant basket confirmation: 26 November 2026

Adding an assistant menu suggestion now appends a confirmation to the polite live conversation log, names the added item and quantity, and points the customer to the shared basket to review the total and continue to checkout. The assistant API is not configured in this workspace, so the full suggested-item journey remains unverified in a browser.


## Owner-provided menu photos and browser capture: 26 November 2026

The owner-approved Ofada and Five Alive Berry Blast photos are mapped locally with descriptive alt text; the Berry Blast bottles use `object-fit: contain`. Their progressive JPEG source files are 91 KB and 205 KB. The built `/menu` HTML includes both image descriptions, both source files and both Next optimized image routes return HTTP 200, and there is no remaining photo-required placeholder in the fallback catalogue. Requests with a browser image `Accept` header received WebP responses of 42 KB and 74 KB. A fresh headless browser capture was attempted using installed Chrome and Edge, including elevated attempts. Chrome stopped at a Windows access-denied crash-handler/platform-channel error in the restricted run; the elevated Chrome run exited without producing a screenshot. Edge failed to load its enclave image (Windows error 577). No screenshot was produced, so visual crop and responsive layout review remain outstanding.


## Contrast token review: 26 November 2026

Calculated contrast from the actual CSS tokens: brown on cream is 12.26:1; the darker action color on white is 5.91:1 and on cream is 5.27:1; brand orange on cream is 3.33:1 and is kept for large display text/decorative elements. Small navigation/removal accents and receipt links now use the darker action color, and the emphasized text on the orange homepage panel uses cream. Automated assertions cover token thresholds and the high-risk component selectors. `npm test`, typecheck, lint, and production build pass after the CSS update.
