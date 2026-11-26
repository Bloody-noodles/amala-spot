import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";

const previewUrl = process.env.PREVIEW_URL;
assert.ok(previewUrl, "PREVIEW_URL is required");
const base = new URL(previewUrl);
assert.equal(base.protocol, "https:", "Preview must use HTTPS");
assert.ok(base.hostname.endsWith(".vercel.app"), "Only Vercel Preview URLs are allowed");
assert.notEqual(base.hostname, "amala-spot-site.vercel.app", "Production host is forbidden");

const outputDirectory = path.resolve("preview-review");
await fs.mkdir(outputDirectory, { recursive: true });
const browser = await chromium.launch({ headless: true });
const pageErrors = [];

async function openPage(route, width, height = 900, prepare) {
  const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 });
  page.on("pageerror", error => pageErrors.push(`${route} (${width}px): ${error.message}`));
  if (prepare) await prepare(page);
  const response = await page.goto(new URL(route, base).toString(), { waitUntil: "domcontentloaded", timeout: 45_000 });
  assert.equal(response?.status(), 200, `${route} should return HTTP 200 at ${width}px`);
  await page.locator("main").waitFor({ state: "visible", timeout: 15_000 });
  return page;
}

async function assertNoHorizontalOverflow(page, route, width) {
  const dimensions = await page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    document: Math.max(document.documentElement.scrollWidth, document.body.scrollWidth)
  }));
  assert.ok(dimensions.document <= dimensions.viewport + 1, `${route} overflows at ${width}px: ${JSON.stringify(dimensions)}`);
}

async function capture(route, width, height, filename) {
  const page = await openPage(route, width, height, page => page.route("**/api/menu", request => request.fulfill({
    status: 503,
    contentType: "application/json",
    body: JSON.stringify({ error: "Use the sample menu for this preview check." })
  })));
  await assertNoHorizontalOverflow(page, route, width);
  if (route === "/") await page.waitForTimeout(1_700);
  if (route === "/menu") {
    await page.locator(".catalogue-row").first().waitFor({ state: "visible" });
    assert.equal(await page.locator(".catalogue-row").count(), 41, "Fallback menu should show all 41 catalogue items");
    assert.equal(await page.locator(".catalogue-art img").count(), 41, "Every fallback menu row should render its mapped image");
  }
  if (route === "/") {
    assert.equal(await page.locator(".home-featured-art.has-photo img").count(), 3, "Homepage features should render three mapped photos");
    assert.equal(await page.locator(".gallery-teaser-photo img").count(), 3, "Homepage gallery preview should render three mapped photos");
  }
  if (route === "/gallery") {
    assert.equal(await page.locator(".gallery-photo").count(), 27, "Gallery should render all 27 curated photos");
  }
  await page.evaluate(() => {
    for (const image of document.images) image.loading = "eager";
  });
  await page.evaluate(() => Promise.all(Array.from(document.images, image => image.decode().catch(() => undefined))));
  const brokenImages = await page.locator("img").evaluateAll(images => images.filter(image => image.naturalWidth === 0).map(image => image.currentSrc || image.src));
  assert.deepEqual(brokenImages, [], `${route} contains images that failed to load: ${brokenImages.join(", ")}`);
  await page.screenshot({ path: path.join(outputDirectory, filename), fullPage: true, animations: "disabled" });
  await page.close();
}

try {
  for (const width of [320, 390, 768, 1024, 1280, 1440]) {
    for (const route of ["/", "/menu"]) {
      const label = route === "/" ? "home" : "menu";
      if (width === 320) {
        const page = await openPage(route, width);
        await assertNoHorizontalOverflow(page, route, width);
        await page.close();
      } else {
        await capture(route, width, width < 500 ? 844 : width === 768 ? 1024 : 1000, `${label}-${width}.png`);
      }
    }
  }

  for (const route of ["/about", "/gallery", "/checkout", "/track"]) {
    for (const width of [320, 390, 768, 1024, 1280, 1440]) {
      const page = await openPage(route, width, width < 500 ? 844 : width === 768 ? 1024 : 1000);
      await assertNoHorizontalOverflow(page, route, width);
      await page.close();
      if (width === 390 || width === 1440) {
        await capture(route, width, width < 500 ? 844 : 1000, `${route.slice(1)}-${width}.png`);
      }
    }
  }

  let submittedOrder;
  const prepareDemoPage = async page => {
    await page.route("**/api/menu", route => route.fulfill({ status: 503, contentType: "application/json", body: JSON.stringify({ error: "Use the sample menu for this preview check." }) }));
    await page.route("**/api/assistant/chat", async route => {
      const request = route.request().postDataJSON();
      const message = request.messages?.at(-1)?.content ?? "";
      const response = /add.*amala/i.test(message)
        ? { reply: "I can suggest Amala, Gbegiri & Ewedu. Tap Add to basket to include it.", suggestions: [{ itemId: "amala-abula", quantity: 1 }] }
        : /recommend|suggest/i.test(message)
          ? { reply: "For a hearty classic, try Amala, Gbegiri & Ewedu.", suggestions: [] }
          : { reply: "Hey! Welcome to Amala Spot. What Nigerian dish are you in the mood for?", suggestions: [] };
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(response) });
    });
    await page.route("**/api/orders", async route => {
      submittedOrder = route.request().postDataJSON();
      await route.fulfill({ status: 201, contentType: "application/json", body: JSON.stringify({
        reference: "AS-DEMO-PREVIEW",
        totalKobo: 450_000,
        customerName: submittedOrder.customer.name,
        mode: "demo",
        message: "This is a demonstration summary only. It has not been saved, sent to a restaurant, or paid for."
      }) });
    });
  };

  const menu = await openPage("/menu", 390, 844, prepareDemoPage);
  const search = menu.getByRole("textbox", { name: "Search menu" });
  await search.fill("ofada");
  await menu.waitForFunction(() => document.querySelectorAll(".catalogue-row").length === 1);
  assert.equal(await menu.locator(".catalogue-row").count(), 1, "Ofada search should return one result");
  assert.match(await menu.locator(".catalogue-row").innerText(), /Ofada Rice & Ayamase/);
  await search.fill("");
  await menu.getByRole("button", { name: "Rice & Grains" }).click();
  await menu.waitForFunction(() => document.querySelectorAll(".catalogue-row").length === 4);
  assert.equal(await menu.locator(".catalogue-row").count(), 4, "Rice & Grains filter should show four fallback items");
  await menu.getByRole("button", { name: "All" }).click();
  await menu.getByRole("button", { name: "Add Amala, Gbegiri & Ewedu to basket" }).click();
  const itemDialog = menu.getByRole("dialog", { name: "Amala, Gbegiri & Ewedu" });
  const itemClose = itemDialog.getByRole("button", { name: "Close item customisation" });
  await itemClose.waitFor({ state: "visible" });
  assert.equal(await itemClose.evaluate(element => document.activeElement === element), true, "Item dialog should focus its close control");
  await menu.keyboard.press("Shift+Tab");
  const addItemButton = itemDialog.locator(".checkout-button");
  assert.equal(await addItemButton.evaluate(element => document.activeElement === element), true, "Shift+Tab from the first item-dialog control should wrap to the last");
  await menu.keyboard.press("Tab");
  assert.equal(await itemClose.evaluate(element => document.activeElement === element), true, "Tab from the last item-dialog control should wrap to the first");
  await menu.keyboard.press("Escape");
  await itemDialog.waitFor({ state: "hidden" });
  assert.equal(await menu.getByRole("button", { name: "Add Amala, Gbegiri & Ewedu to basket" }).evaluate(element => document.activeElement === element), true, "Closing the item dialog should restore focus to its opener");
  await menu.getByRole("button", { name: "Add Amala, Gbegiri & Ewedu to basket" }).click();
  await itemDialog.getByRole("button", { name: /^ADD/ }).click();
  const basket = menu.getByRole("dialog", { name: /BASKET/ });
  await basket.waitFor({ state: "visible" });
  assert.match(await basket.innerText(), /Amala, Gbegiri & Ewedu/);
  assert.match(await basket.innerText(), /₦4,500/);
  await basket.getByRole("button", { name: "Close basket" }).click();
  const mobileBasket = menu.getByRole("link", { name: /1 ITEMS/ });
  assert.ok(await mobileBasket.isVisible(), "Mobile basket bar should appear when the basket has an item");
  await mobileBasket.click();
  assert.match(new URL(menu.url()).pathname, /\/checkout$/);
  await menu.getByLabel("FULL NAME").fill("Preview Tester");
  await menu.getByLabel("PHONE NUMBER").fill("08012345678");
  await menu.getByRole("button", { name: "CONFIRM DEMO ORDER" }).click();
  await menu.getByText("DEMO ORDER SUMMARY").waitFor({ state: "visible" });
  assert.match(await menu.locator("main").innerText(), /has not been saved, sent to a restaurant, or paid for/i);
  assert.equal(submittedOrder?.items?.[0]?.itemId, "amala-abula", "Preview checkout should submit the selected sample item");
  await menu.close();

  const assistant = await openPage("/menu", 390, 844, prepareDemoPage);
  await assistant.getByRole("button", { name: "Add Amala, Gbegiri & Ewedu to basket" }).click();
  await assistant.getByRole("dialog", { name: "Amala, Gbegiri & Ewedu" }).getByRole("button", { name: /^ADD/ }).click();
  await assistant.getByRole("button", { name: "Close basket" }).click();
  await assistant.getByRole("button", { name: "Open food assistant" }).click();
  const assistantDialog = assistant.getByRole("dialog", { name: "AMALA AI" });
  await assistantDialog.waitFor({ state: "visible" });
  const assistantInput = assistantDialog.getByRole("textbox", { name: "Message Amala AI" });
  assert.equal(await assistantInput.evaluate(element => document.activeElement === element), true, "Opening the assistant should focus its message field");
  await assistantInput.fill("Hi there");
  await assistantInput.press("Enter");
  await assistant.getByText("Hey! Welcome to Amala Spot. What Nigerian dish are you in the mood for?").waitFor({ state: "visible" });
  await assistantInput.fill("What do you recommend?");
  await assistantInput.press("Enter");
  await assistant.getByText("For a hearty classic, try Amala, Gbegiri & Ewedu.").waitFor({ state: "visible" });
  await assistantInput.fill("Please add Amala to my basket");
  await assistantInput.press("Enter");
  const assistantSuggestion = assistantDialog.getByRole("button", { name: "Add Amala, Gbegiri & Ewedu to basket" });
  await assistantSuggestion.waitFor({ state: "visible" });
  await assistantSuggestion.click();
  const assistantBasket = assistant.getByRole("dialog", { name: /BASKET/ });
  await assistantBasket.waitFor({ state: "visible" });
  assert.match(await assistantBasket.innerText(), /Amala, Gbegiri & Ewedu/);
  assert.match(await assistantBasket.innerText(), /â‚¦9,000/);
  await assistant.getByText("Added 1 Ã— Amala, Gbegiri & Ewedu to your basket. Open the basket to review your total and continue to checkout.").waitFor({ state: "visible" });
  const basketClose = assistantBasket.getByRole("button", { name: "Close basket" });
  assert.equal(await basketClose.evaluate(element => document.activeElement === element), true, "Basket dialog should focus its close control");
  await assistant.keyboard.press("Shift+Tab");
  const basketCheckout = assistantBasket.getByRole("link", { name: /REVIEW BASKET & CHECKOUT/ });
  assert.equal(await basketCheckout.evaluate(element => document.activeElement === element), true, "Shift+Tab from the first basket control should wrap to the last");
  await assistant.keyboard.press("Tab");
  assert.equal(await basketClose.evaluate(element => document.activeElement === element), true, "Tab from the last basket control should wrap to the first");
  await basketClose.click();
  const launcher = await assistant.locator(".food-assistant-launch").boundingBox();
  const mobileBar = await assistant.locator(".mobile-basket-bar").boundingBox();
  assert.ok(launcher && mobileBar && launcher.y + launcher.height <= mobileBar.y, "Mobile assistant launcher should sit above the basket bar");
  await assistant.getByRole("button", { name: "Basket, 2 items" }).click();
  await assistantBasket.getByRole("button", { name: "Remove one Amala, Gbegiri & Ewedu" }).click();
  assert.equal(await assistantBasket.getByLabel("Amala, Gbegiri & Ewedu quantity").innerText(), "1", "Basket decrement should update the shared item quantity");
  assert.match(await assistantBasket.innerText(), /â‚¦4,500/);
  await assistantBasket.getByRole("button", { name: "Remove Amala, Gbegiri & Ewedu from basket" }).click();
  await assistantBasket.getByText("Your basket is waiting. Add something good from the menu.").waitFor({ state: "visible" });
  await assistant.close();

  assert.deepEqual(pageErrors, [], `Preview pages should not raise uncaught errors: ${pageErrors.join("; ")}`);
  console.log("Preview review passed: responsive overflow, catalogue search/filter, shared basket, demo checkout, assistant launcher, and screenshots.");
} finally {
  await browser.close();
}
