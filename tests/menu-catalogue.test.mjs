import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import ts from "typescript";

const root = path.resolve(import.meta.dirname, "..");

function loadTypescript(relativePath, imports = {}) {
  const filename = path.join(root, relativePath);
  const source = fs.readFileSync(filename, "utf8");
  const javascript = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  const loadedModule = { exports: {} };
  const localRequire = (specifier) => {
    if (Object.hasOwn(imports, specifier)) return imports[specifier];
    throw new Error(`Unexpected import ${specifier} in ${relativePath}`);
  };
  new Function("require", "module", "exports", javascript)(localRequire, loadedModule, loadedModule.exports);
  return loadedModule.exports;
}

const drinks = loadTypescript("src/lib/drinks-menu.ts");
const catalogue = loadTypescript("src/lib/menu.ts", { "@/lib/drinks-menu": drinks });
const curatedGallery = loadTypescript("src/lib/gallery.ts", { "@/lib/menu": catalogue });
const cartMath = loadTypescript("src/lib/cart.ts");
const items = catalogue.menuItems;

function checkUniqueIdsAndBasePrices() {
  const ids = items.map((item) => item.id);
  assert.equal(new Set(ids).size, ids.length, "menu item IDs must be unique");
  for (const item of items) {
    assert.ok(item.id.trim(), "item ID must not be blank");
    assert.ok(Number.isInteger(item.priceKobo) && item.priceKobo > 0, `${item.id} needs a positive integer price`);
  }
}

function checkOptions() {
  for (const item of items) {
    const optionIds = item.options.map((option) => option.id);
    assert.equal(new Set(optionIds).size, optionIds.length, `${item.id} option IDs must be unique`);
    for (const option of item.options) {
      assert.ok(option.id.trim(), `${item.id} option ID must not be blank`);
      assert.ok(Number.isInteger(option.priceKobo) && option.priceKobo >= 0, `${item.id}/${option.id} needs a valid price`);
    }
  }
}

function checkNairaFormatting() {
  assert.equal(catalogue.formatNaira(100_000), "₦1,000", "100,000 kobo must format as one thousand naira");
  assert.equal(catalogue.formatNaira(100), "₦1", "100 kobo must format as one naira");
}

function checkContrastTokens() {
  const stylesheet = fs.readFileSync(path.join(root, "src/app/globals.css"), "utf8");
  const token = (name) => {
    const match = stylesheet.match(new RegExp(`--${name}:(#[0-9a-fA-F]{3}(?:[0-9a-fA-F]{3})?)`));
    assert.ok(match, `expected ${name} color token`);
    return match[1].length === 4 ? `#${[...match[1].slice(1)].map((channel) => channel + channel).join("")}` : match[1];
  };
  const luminance = (hex) => {
    const channels = hex.slice(1).match(/../g).map((channel) => parseInt(channel, 16) / 255);
    const [red, green, blue] = channels.map((channel) => channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4);
    return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
  };
  const contrast = (first, second) => {
    const values = [luminance(first), luminance(second)].sort((a, b) => b - a);
    return (values[0] + 0.05) / (values[1] + 0.05);
  };
  assert.ok(contrast(token("orange-action"), token("white")) >= 4.5, "action color needs AA contrast with white text");
  assert.ok(contrast(token("orange-action"), token("cream")) >= 4.5, "action color needs AA contrast with cream text");
  assert.ok(contrast(token("brown"), token("cream")) >= 4.5, "body text needs AA contrast on cream");
  assert.ok(contrast(token("orange"), token("cream")) >= 3, "brand orange should meet large-text contrast on cream");
  assert.ok(stylesheet.includes(".home-note h2 em{color:var(--cream)}"), "home note highlight needs contrast against its orange surface");
  assert.ok(stylesheet.includes(".home-marquee,.home-note{background:var(--orange-action)}"), "white text on the marquee and note needs contrast-safe surfaces");
  assert.ok(stylesheet.includes(".home-featured-art.art-2{background:var(--orange-action)}"), "white feature-tile text needs a contrast-safe surface");
  assert.ok(stylesheet.includes(".app-nav a:hover,.app-nav a[aria-current=page],.app-footer nav a:hover{color:var(--orange-action)}"), "small navigation accents need AA contrast on cream");
  assert.ok(stylesheet.includes(".checkout-line-actions .checkout-remove,.shared-basket-lines article>section .shared-remove{color:var(--orange-action)}"), "small basket/removal accents need AA contrast on cream");
  assert.ok(stylesheet.includes(".receipt-key a{background:var(--orange-action);border-color:var(--orange-action)}"), "receipt link needs a contrast-safe background");
}

function checkEntrySequence() {
  const stylesheet = fs.readFileSync(path.join(root, "src/app/globals.css"), "utf8");
  const component = fs.readFileSync(path.join(root, "src/components/site-entry.tsx"), "utf8");
  assert.ok(stylesheet.includes(".site-shell.is-entering main{animation:site-content-arrive 1.55s"), "page reveal must retain 1.55-second timing");
  assert.ok(stylesheet.includes(".entry-screen{position:fixed;inset:0;") && stylesheet.includes("animation:entry-curtain 1.55s"), "welcome curtain must remain full-screen and retain 1.55-second timing");
  assert.ok(stylesheet.includes("animation:entry-progress 1.05s .12s"), "progress line sequence must remain intact");
  assert.ok(stylesheet.includes("@media(prefers-reduced-motion:reduce){.entry-screen{display:none}.site-shell.is-entering main{animation:none}}"), "reduced-motion preference must skip the curtain and reveal animation");
  assert.ok(component.includes("onAnimationEnd={() => setVisible(false)}"), "curtain must still reveal the page when its animation ends");
  assert.ok(component.includes("GOOD FOOD. GOOD PEOPLE. GOOD TIMES.") && component.includes("entry-rule"), "original slogan and progress line must remain");
}

function checkAssistantVoiceFlow() {
  const component = fs.readFileSync(path.join(root, "src/components/food-assistant.tsx"), "utf8");
  const tokenRoute = fs.readFileSync(path.join(root, "src/app/api/assistant/token/route.ts"), "utf8");
  assert.ok(component.includes("responseModalities: [\"AUDIO\"]") && component.includes("mimeType: \"audio/pcm;rate=16000\""), "voice calls should stream microphone audio and receive live audio replies");
  assert.ok(component.includes("name: \"add_menu_items_to_basket\"") && component.includes("args.visitorConfirmed !== true"), "live basket actions should require explicit visitor confirmation");
  assert.ok(component.includes("onAddItem(item.id, quantity)") && component.includes("entry.id === candidate.itemId"), "live basket actions should use exact current menu IDs and the shared basket");
  assert.ok(component.includes("setMode(\"text\")") && component.includes("Prefer typing? Open text chat"), "typed chat should remain available as a voice fallback");
  assert.ok(component.includes("streamRef.current?.getTracks().forEach(track => track.stop())"), "ending the call should release the microphone");
  assert.ok(tokenRoute.includes("origin !== new URL(request.url).origin") && tokenRoute.includes("MAX_CALLS = 5"), "voice token creation should verify same-origin requests and limit attempts");
  assert.ok(tokenRoute.includes("uses: 1") && tokenRoute.includes("process.env.GEMINI_API_KEY"), "the API key should stay server-side and issue one-use session tokens");
}

function checkAssistantUsesSharedBasket() {
  const assistant = fs.readFileSync(path.join(root, "src/components/food-assistant.tsx"), "utf8");
  const shell = fs.readFileSync(path.join(root, "src/components/site-shell.tsx"), "utf8");
  const ordering = fs.readFileSync(path.join(root, "src/components/ordering-context.tsx"), "utf8");
  assert.ok(assistant.includes("onAddItem(item.id, quantity)"), "assistant suggestions should add through the supplied ordering action");
  assert.ok(assistant.includes("if (!response.ok) return;") && assistant.includes("try { await setMenuSnapshot();"), "a failed optional menu refresh should not hide a valid assistant reply");
  assert.ok(assistant.includes("if (!onAddItem(item.id, quantity))") && assistant.includes("That menu item is no longer available"), "assistant should report when the shared basket rejects an unavailable item");
  assert.ok(assistant.includes("Added ${quantity} \u00d7 ${item.name} to your basket"), "assistant should confirm which item it added");
  assert.ok(shell.includes("addItem(itemId, quantity, [], openBasket)") && shell.includes("menu={menu}"), "global assistant should receive the shared menu and ordering-provider action");
  assert.ok(ordering.includes("if (!item) return false;") && ordering.includes("setCart(current => addCartItem(current, item, quantity, options))") && ordering.includes("setCartOpen(true)") && ordering.includes("return true;"), "adding any item should update and reveal the same basket, with success reported to the caller");
  assert.ok(shell.includes("{cartCount > 0 && pathname !== \"/checkout\" && <Link className=\"mobile-basket-bar\" href=\"/checkout\""), "shared basket count and total should route mobile customers to checkout");
}

function checkMappedImages() {
  const mapped = items.filter((item) => item.image);
  const credits = fs.readFileSync(path.join(root, "public/images/menu/ATTRIBUTION.md"), "utf8");
  assert.ok(mapped.length > 0, "expected mapped fallback images");
  for (const item of mapped) {
    assert.ok(item.image.startsWith("/images/"), `${item.id} image must use a local public path`);
    const imagePath = path.join(root, "public", item.image.slice(1));
    assert.ok(fs.existsSync(imagePath), `${item.id} image file is missing`);
    assert.ok(item.imageAlt?.trim(), `${item.id} needs image alt text`);
    const filename = path.basename(item.image);
    assert.ok(credits.includes(`| \`${filename}\` |`), `${item.id} image needs an attribution row`);
    if (item.id === "ofada" || item.id === "five-alive-berry") {
      assert.ok(fs.statSync(imagePath).size < 300_000, `${item.id} derivative should stay under 300 KB`);
    }
  }
}

function checkUnmappedImageDisclosure() {
  const missingImages = items.filter((item) => !item.image).map((item) => item.id).sort();
  assert.deepEqual(missingImages, [], "every fallback menu item must have its approved photo");
}

function checkSharedCartMath() {
  const amala = items.find((item) => item.id === "amala-abula");
  assert.ok(amala, "expected fallback Amala menu item");
  let cart = cartMath.addCartItem([], amala, 2, ["ponmo", "unknown", "ponmo"]);
  assert.deepEqual(cart, [{ key: "amala-abula:ponmo", itemId: "amala-abula", quantity: 2, options: ["ponmo"] }]);
  cart = cartMath.addCartItem(cart, amala, 3, ["ponmo"]);
  cart = cartMath.addCartItem(cart, amala, 1, ["beef"]);
  assert.equal(cartMath.getCartCount(cart), 6);
  assert.equal(cartMath.getCartItemTotal(cart[0], items), 2_650_000);
  assert.equal(cartMath.getCartTotal(cart, items), 3_220_000);

  let capped = cartMath.addCartItem([], amala, 25);
  assert.equal(capped[0].quantity, 20);
  capped = cartMath.addCartItem(capped, amala, 4);
  assert.equal(capped[0].quantity, 20);

  cart = cartMath.updateCartQuantity(cart, "amala-abula:ponmo", -4);
  assert.equal(cart[0].quantity, 1);
  cart = cartMath.updateCartQuantity(cart, "amala-abula:ponmo", -1);
  assert.equal(cart.some((line) => line.key === "amala-abula:ponmo"), false);
}

function checkPreviewIsolationAndCoverage() {
  const workflow = fs.readFileSync(path.join(root, ".github/workflows/vercel-preview.yml"), "utf8");
  const review = fs.readFileSync(path.join(root, "scripts/preview-review.mjs"), "utf8");
  assert.ok(workflow.includes("vercel pull --yes --environment=preview"), "preview workflow must use Preview environment settings");
  assert.ok(workflow.includes("vercel deploy --prebuilt --yes --token"), "preview workflow must deploy prebuilt artifacts");
  assert.doesNotMatch(workflow, /vercel deploy[^\n]*--prod/i, "preview workflow must never deploy to production");
  assert.ok(workflow.includes("refs/heads/codex/amala-spot-upgrade"), "manual Preview deployment must be limited to the current upgrade branch");
  assert.ok(review.includes('assert.equal(base.protocol, "https:", "Preview must use HTTPS")'), "browser review must reject non-HTTPS targets");
  assert.ok(review.includes('base.hostname.endsWith(".vercel.app")'), "browser review must limit targets to Vercel hosts");
  assert.ok(review.includes('assert.notEqual(base.hostname, "amala-spot-site.vercel.app"'), "browser review must reject the known production host");
  assert.ok(review.includes("[320, 390, 768, 1024, 1280, 1440]"), "browser review must cover representative phone, tablet, and desktop widths");
  assert.ok(review.includes('"**/api/orders"') && review.includes('"**/api/assistant/chat"'), "browser review must mock external assistant and order APIs");
  assert.ok(review.includes('"**/api/menu"') && review.includes('".catalogue-art img").count(), 41'), "screenshots should use the sample catalogue and verify all item images");
  assert.ok(review.includes('name: "Talk to Amala AI"') && review.includes('name: "START A VOICE CALL"') && review.includes('name: "Prefer typing? Open text chat"'), "Preview should verify the live-call entry and typed fallback without requesting microphone access");
  assert.ok(review.includes('".gallery-photo").count(), 27') && review.includes("image.naturalWidth === 0"), "screenshots should verify curated gallery coverage and reject broken images");
  for (const route of ["/", "/menu", "/about", "/gallery", "/checkout", "/track"]) {
    assert.ok(review.includes(`"${route}"`), `browser review must include ${route}`);
  }
}

function checkHomepageGalleryPreview() {
  const homepage = fs.readFileSync(path.join(root, "src/app/page.tsx"), "utf8");
  const gallery = fs.readFileSync(path.join(root, "src/app/gallery/page.tsx"), "utf8");
  const galleryData = fs.readFileSync(path.join(root, "src/lib/gallery.ts"), "utf8");
  assert.ok(homepage.includes('import { galleryItems } from "@/lib/gallery"'), "homepage teaser should reuse curated gallery data");
  assert.ok(homepage.includes("galleryItems.slice(0, 3).map") && homepage.includes("<Image src={item.image!}"), "homepage should show real menu photography");
  assert.ok(homepage.includes("item.imageAlt ?? item.name"), "homepage photos should keep their descriptive alt text");
  assert.doesNotMatch(homepage, /IMAGE SOURCING|PROJECT-OWNED FOOD PHOTOGRAPHY REQUIRED/, "homepage should not show stale photo-sourcing placeholders");
  assert.ok(gallery.includes('import { galleryCatalogueCount, galleryItems, verifiedPhotoCount } from "@/lib/gallery"'), "gallery and homepage should share one curated photo list");
  assert.ok(galleryData.includes("menuItems.filter(item => galleryItemIds.has(item.id) && item.image)"), "curated gallery data should include only mapped photos");
  assert.equal(curatedGallery.galleryCatalogueCount, items.length, "gallery count should reflect the full fallback catalogue");
  assert.equal(curatedGallery.verifiedPhotoCount, items.length, "every current fallback catalogue item should have a mapped photo");
  assert.equal(curatedGallery.galleryItems.length, 27, "curated gallery should expose its 27 selected photos");
  assert.ok(curatedGallery.galleryItems.slice(0, 3).every(item => item.image && item.imageAlt?.trim()), "homepage preview items should have images and descriptive alt text");
}

function checkEnvironmentExample() {
  const template = fs.readFileSync(path.join(root, ".env.example"), "utf8");
  for (const name of ["NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_SECRET_KEY", "SUPABASE_SERVICE_ROLE_KEY", "GEMINI_API_KEY", "ADMIN_PASSWORD", "ADMIN_SESSION_SECRET"]) {
    assert.match(template, new RegExp(`^${name}=$`, "m"), `${name} should be listed as a blank setup value`);
  }
  assert.doesNotMatch(template, /^GEMINI_MODEL=/m, "the example should not advertise an assistant setting the route ignores");
  const assignments = template.split(/\r?\n/).filter(line => /^[A-Z][A-Z0-9_]*=/.test(line));
  assert.ok(assignments.every(line => line.endsWith("=")), "sample environment values must remain blank; never commit secrets");
}

for (const [name, check] of Object.entries({
  "unique item IDs and valid base prices": checkUniqueIdsAndBasePrices,
  "unique option IDs and valid prices": checkOptions,
  "kobo values format to whole naira correctly": checkNairaFormatting,
  "brand and action colors meet their contrast targets": checkContrastTokens,
  "entrance sequence and reduced-motion behavior remain intact": checkEntrySequence,
  "live assistant voice calls, basket confirmation, and typed fallback": checkAssistantVoiceFlow,
  "assistant suggestions use the shared basket and checkout": checkAssistantUsesSharedBasket,
  "existing local images and alt text": checkMappedImages,
  "every fallback menu item has an approved photo": checkUnmappedImageDisclosure,
  "shared cart merging, modifiers, caps, quantities, and totals": checkSharedCartMath,
  "Preview deploy isolation and browser coverage": checkPreviewIsolationAndCoverage,
  "homepage uses real curated gallery photography": checkHomepageGalleryPreview,
  "environment example documents runtime settings without secrets": checkEnvironmentExample,
})) {
  check();
  process.stdout.write(`PASS ${name}\n`);
}
