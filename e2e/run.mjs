// Real-user end-to-end checks for the Studio Dahlia site: real mouse clicks,
// touch taps and keystrokes in Chromium at desktop, laptop, narrow-window and
// phone sizes. Screenshots of key states are saved to e2e/shots/.
//
//   npm run test:e2e            build, serve the production build, run, stop
//   npm run test:e2e -- <url>   run against a server that's already up
//                               (e.g. http://localhost:3000 for `npm run dev`)
//
// First time on a machine: npm run test:e2e:setup (downloads Chromium).
import { chromium } from "playwright";
import { spawn } from "node:child_process";
import fs from "node:fs";
import net from "node:net";

const SHOTS = new URL("./shots/", import.meta.url).pathname;
fs.mkdirSync(SHOTS, { recursive: true });

// Ask the OS for a free port so we never collide with a running dev server
const freePort = () =>
  new Promise((resolve, reject) => {
    const srv = net.createServer();
    srv.once("error", reject);
    srv.listen(0, () => {
      const { port } = srv.address();
      srv.close(() => resolve(port));
    });
  });

async function startProductionServer() {
  const port = await freePort();
  const server = spawn("npx", ["next", "start", "-p", String(port)], {
    cwd: new URL("..", import.meta.url).pathname,
    stdio: "ignore",
    detached: true,
    // Blank the email settings so the form test can never send a real email.
    // Next only applies .env.local values for variables that aren't already set.
    env: { ...process.env, RESEND_API_KEY: "", ENQUIRY_TO_EMAIL: "", ENQUIRY_FROM_EMAIL: "" },
  });
  const url = `http://localhost:${port}`;
  let stopped = false;
  const stop = () => {
    if (stopped) return;
    stopped = true;
    try {
      process.kill(-server.pid);
    } catch {}
  };
  process.on("exit", stop); // never leave the server running, even on a crash
  for (let i = 0; i < 60; i++) {
    try {
      if ((await fetch(url)).ok) return { url, stop };
    } catch {}
    await new Promise((r) => setTimeout(r, 500));
  }
  stop();
  throw new Error("Production server did not start (did `next build` run?)");
}

const server = process.argv[2] ? null : await startProductionServer();
const BASE = process.argv[2] ?? server.url;
// Only the self-served server is guaranteed to have email sending disabled
const SAFE_TO_SUBMIT = !!server;
console.log(`Testing ${BASE}${server ? " (production build, email disabled)" : ""}\n`);

const results = [];
let current = "";
const check = (name, ok, detail = "") => {
  results.push({ vp: current, name, ok: !!ok, detail });
  console.log(`${ok ? "PASS" : "FAIL"}  [${current}] ${name}${detail ? "  — " + detail : ""}`);
};

const VIEWPORTS = [
  { name: "desktop-1440", viewport: { width: 1440, height: 900 } },
  { name: "laptop-1280", viewport: { width: 1280, height: 720 } },
  { name: "narrow-700", viewport: { width: 700, height: 800 } },
  { name: "mobile-390", viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 3 },
];

// ---------- helpers ----------
const wait = (page, ms) => page.waitForTimeout(ms);
const scrollY = (page) => page.evaluate(() => Math.round(window.scrollY));
async function placeAt(page, selector, fraction) {
  // Put the element's centre at `fraction` of the viewport height (instant, no smooth scroll)
  await page.evaluate(
    ([s, f]) => {
      const el = document.querySelector(s);
      const r = el.getBoundingClientRect();
      window.scrollTo({ top: window.scrollY + r.top + r.height / 2 - window.innerHeight * f, behavior: "instant" });
    },
    [selector, fraction],
  );
  await wait(page, 250);
}
const rect = (page, selector) =>
  page.evaluate((s) => {
    const el = document.querySelector(s);
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { top: r.top, bottom: r.bottom, left: r.left, right: r.right, width: r.width, height: r.height };
  }, selector);
const inViewport = (page, r, margin = 0) =>
  page.evaluate(
    ([r, m]) => r && r.left >= m - 0.5 && r.top >= m - 0.5 && r.right <= document.documentElement.clientWidth - m + 0.5 && r.bottom <= window.innerHeight - m + 0.5,
    [r, margin],
  );
const surface = ".picker-pop, .picker-sheet__panel";
const isOpen = async (page) => (await page.locator(surface).count()) > 0;
const hidden = (page, name) => page.locator(`input[type=hidden][name="${name}"]`).inputValue();
const activeInfo = (page) =>
  page.evaluate(() => {
    const a = document.activeElement;
    return { id: a?.id, role: a?.getAttribute("role"), date: a?.getAttribute("data-date"), cls: a?.className };
  });
const pad = (n) => String(n).padStart(2, "0");
const iso = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

// Click/tap like a person: at the element's on-screen centre with real input
// events. (Playwright's locator.click() scrolls things itself, which would hide
// or fake page-jump bugs.) Only scrolls first if the element is off screen.
async function tapOrClick(page, locator, touch) {
  await locator.waitFor({ state: "visible", timeout: 5000 });
  let box = await locator.boundingBox();
  const vh = page.viewportSize().height;
  if (!box || box.y < 0 || box.y + box.height > vh) {
    await locator.evaluate((el) => {
      const r = el.getBoundingClientRect();
      window.scrollTo({ top: window.scrollY + r.top + r.height / 2 - window.innerHeight / 2, behavior: "instant" });
    });
    await page.waitForTimeout(250);
    box = await locator.boundingBox();
  }
  // Like a person, wait for anything sliding in (e.g. the bottom sheet) to settle
  for (let i = 0; i < 20; i++) {
    await page.waitForTimeout(50);
    const next = await locator.boundingBox();
    if (next && Math.abs(next.x - box.x) < 0.5 && Math.abs(next.y - box.y) < 0.5) break;
    box = next;
  }
  const x = box.x + box.width / 2;
  const y = box.y + box.height / 2;
  if (touch) await page.touchscreen.tap(x, y);
  else await page.mouse.click(x, y);
}

// ---------- suites ----------
async function pageHealth(page, vp) {
  // Scroll the whole page like a visitor so lazy images load, then verify every image decoded
  const h = await page.evaluate(() => document.body.scrollHeight);
  for (let y = 0; y < h; y += 500) {
    await page.evaluate((y) => window.scrollTo({ top: y, behavior: "instant" }), y);
    await wait(page, 60);
  }
  await page.waitForFunction(() => [...document.images].every((i) => i.complete), null, { timeout: 30000 }).catch(() => {});
  const broken = await page.evaluate(() =>
    [...document.images].filter((i) => !(i.complete && i.naturalWidth > 0)).map((i) => decodeURIComponent(i.currentSrc || i.src).split("/").pop()),
  );
  check("all page images load", broken.length === 0, broken.join(", "));

  const lace = await page.evaluate(
    () => new Promise((res) => {
      const i = new Image();
      i.onload = () => res(true);
      i.onerror = () => res(false);
      i.src = "/img/lace.webp";
    }),
  );
  check("lace background loads", lace);

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  check("no horizontal scroll", overflow <= 0, `overflow ${overflow}px`);

  if (!vp.isMobile) {
    const sizes = await page.evaluate(() =>
      ["studio", "services", "packages", "process"].map((id) => {
        const el = document.getElementById(id);
        return { id, h: Math.round(el.getBoundingClientRect().height) };
      }),
    );
    const vh = vp.viewport.height;
    for (const s of sizes) {
      // Allow a little slack for padding; the content itself should fit on one screen
      check(`section #${s.id} fits one screen`, s.h <= vh * 1.08 || vp.viewport.width < 961, `${s.h}px vs ${vh}px viewport`);
    }
  }
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
}

async function selectSuite(page, vp) {
  const touch = !!vp.hasTouch;
  const trig = page.locator("#f-type");

  // 1. Open with a real click: page must not jump; popover visible and on screen
  await placeAt(page, "#f-type", 0.4);
  const y0 = await scrollY(page);
  await tapOrClick(page, trig, touch);
  await page.locator(surface).waitFor({ state: "visible", timeout: 3000 });
  await wait(page, 250);
  const y1 = await scrollY(page);
  check("select: page does not jump when opened", Math.abs(y1 - y0) <= 2, `scrollY ${y0} → ${y1}`);
  const pr = await rect(page, surface);
  check("select: list fully on screen", await inViewport(page, pr, vp.isMobile ? 0 : 8), JSON.stringify(pr && { t: Math.round(pr.top), b: Math.round(pr.bottom), l: Math.round(pr.left), r: Math.round(pr.right) }));
  if (vp.isMobile) {
    check("select: phone uses bottom sheet", (await page.locator(".picker-sheet").count()) === 1);
    check("select: sheet sits at screen bottom", Math.abs(pr.bottom - vp.viewport.height) <= 1, `bottom ${pr.bottom}`);
    check("select: page scroll locked behind sheet", (await page.evaluate(() => document.documentElement.style.overflow)) === "hidden");
  } else {
    const tr = await rect(page, "#f-type");
    check("select: opens directly below the field", pr.top >= tr.bottom && pr.top - tr.bottom <= 10, `gap ${Math.round(pr.top - tr.bottom)}px`);
    check("select: at least as wide as the field", pr.width >= tr.width - 1);
  }
  const act = await activeInfo(page);
  check("select: keyboard focus moves into the list", act.role === "listbox", JSON.stringify(act));
  await page.screenshot({ path: `${SHOTS}${vp.name}-select-open.png` });

  // 2. Choose an option with the mouse/finger
  await tapOrClick(page, page.locator('[role=option]', { hasText: "Corporate event" }), touch);
  await wait(page, 250);
  check("select: closes after choosing", !(await isOpen(page)));
  check("select: field shows chosen option", (await page.locator("#f-type-value").textContent()) === "Corporate event");
  check("select: form value updated", (await hidden(page, "type")) === "Corporate event");
  check("select: focus returns to field", (await activeInfo(page)).id === "f-type");
  check("select: page still has not jumped", Math.abs((await scrollY(page)) - y0) <= 2, `scrollY ${await scrollY(page)} vs ${y0}`);
  if (vp.isMobile) check("select: page scroll unlocked after close", (await page.evaluate(() => document.documentElement.style.overflow)) === "");

  // 3. Keyboard: open with ArrowDown, End, Enter
  await trig.focus();
  await page.keyboard.press("ArrowDown");
  await page.locator(surface).waitFor({ state: "visible" });
  await page.keyboard.press("End");
  await page.keyboard.press("Enter");
  await wait(page, 200);
  check("select: keyboard End + Enter picks last option", (await hidden(page, "type")) === "Other");

  // 4. Escape cancels without changing the value
  await page.keyboard.press("ArrowDown");
  await page.locator(surface).waitFor({ state: "visible" });
  await page.keyboard.press("Home");
  await page.keyboard.press("Escape");
  await wait(page, 200);
  check("select: Escape closes without changing value", !(await isOpen(page)) && (await hidden(page, "type")) === "Other");

  // 5. Type-ahead on the closed field
  await trig.focus();
  await page.keyboard.type("w");
  await wait(page, 100);
  check("select: typing a letter jumps to matching option", (await hidden(page, "type")) === "Wedding");

  // 6. Click/tap outside closes
  await tapOrClick(page, trig, touch);
  await page.locator(surface).waitFor({ state: "visible" });
  if (vp.isMobile) await page.mouse.click(vp.viewport.width / 2, 40); // backdrop above the sheet
  else await tapOrClick(page, page.locator(".enquire__intro"), false);
  await wait(page, 250);
  check("select: clicking outside closes", !(await isOpen(page)));
  check("select: outside click keeps value", (await hidden(page, "type")) === "Wedding");

  if (!vp.isMobile) {
    // 7. Near the bottom of the screen it must flip above the field
    await placeAt(page, "#f-package", 0.93);
    await tapOrClick(page, page.locator("#f-package"), false);
    await page.locator(surface).waitFor({ state: "visible" });
    await wait(page, 200);
    const p2 = await rect(page, surface);
    const t2 = await rect(page, "#f-package");
    check("select: flips above when no room below", p2.bottom <= t2.top + 1, `pop bottom ${Math.round(p2.bottom)}, field top ${Math.round(t2.top)}`);
    check("select: flipped list fully on screen", await inViewport(page, p2, 8));
    await page.screenshot({ path: `${SHOTS}${vp.name}-select-flipped.png` });

    // 8. Scrolling the page while open keeps it attached to the field
    await page.mouse.move(vp.viewport.width - 30, vp.viewport.height / 2);
    await page.mouse.wheel(0, -120);
    await wait(page, 300);
    if (await isOpen(page)) {
      const p3 = await rect(page, surface);
      const t3 = await rect(page, "#f-package");
      const attached = Math.abs(p3.bottom - (t3.top - 6)) <= 2 || Math.abs(p3.top - (t3.bottom + 6)) <= 2;
      check("select: follows the field while page scrolls", attached, `pop ${Math.round(p3.top)}-${Math.round(p3.bottom)}, field ${Math.round(t3.top)}-${Math.round(t3.bottom)}`);
    } else {
      check("select: follows the field while page scrolls", true, "closed because field left the screen");
    }
    await page.keyboard.press("Escape");
    await wait(page, 150);
  }

  // 9. Package buttons pre-select the enquiry
  const premiumBtn = page.locator(".package--premium a[data-package]");
  await tapOrClick(page, premiumBtn, touch);
  await wait(page, 900);
  check("select: Premium 'Enquire' pre-selects package", (await hidden(page, "package")) === "Premium (7 hours)");
  check("select: package field shows Premium", (await page.locator("#f-package-value").textContent()) === "Premium (7 hours)");
}

async function dateSuite(page, vp) {
  const touch = !!vp.hasTouch;
  const trig = page.locator("#f-date");
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // 1. Open by click: no jump, on screen, focus on today
  await placeAt(page, "#f-date", 0.4);
  const y0 = await scrollY(page);
  await tapOrClick(page, trig, touch);
  await page.locator(".calendar").waitFor({ state: "visible" });
  await wait(page, 250);
  check("date: page does not jump when opened", Math.abs((await scrollY(page)) - y0) <= 2);
  const pr = await rect(page, surface);
  check("date: calendar fully on screen", await inViewport(page, pr, vp.isMobile ? 0 : 8), `l ${Math.round(pr.left)} r ${Math.round(pr.right)} t ${Math.round(pr.top)} b ${Math.round(pr.bottom)}`);
  const act = await activeInfo(page);
  check("date: focus lands on today", act.date === iso(today), JSON.stringify(act));
  await page.screenshot({ path: `${SHOTS}${vp.name}-date-open.png` });

  // 2. Past days are disabled; Previous month is disabled in the current month
  if (today.getDate() > 1) {
    const first = new Date(today.getFullYear(), today.getMonth(), 1);
    check("date: past days are disabled", await page.locator(`[data-date="${iso(first)}"]`).isDisabled());
  }
  check("date: can't go to a past month", await page.locator('[aria-label="Previous month"]').isDisabled());

  // 3. Next month, pick the 15th with a real click
  await tapOrClick(page, page.locator('[aria-label="Next month"]'), touch);
  const next15 = new Date(today.getFullYear(), today.getMonth() + 1, 15);
  await tapOrClick(page, page.locator(`[data-date="${iso(next15)}"]`), touch);
  await wait(page, 250);
  check("date: closes after picking", !(await isOpen(page)));
  check("date: form value is YYYY-MM-DD", (await hidden(page, "date")) === iso(next15), await hidden(page, "date"));
  const shown = await page.locator("#f-date-value").textContent();
  check("date: field shows readable date", shown.includes("15") && !shown.includes("Select"), shown);
  check("date: focus returns to field", (await activeInfo(page)).id === "f-date");

  // 4. Keyboard: reopen (focus on chosen date), → and ↓, Enter = +8 days
  await trig.focus();
  await page.keyboard.press("Enter");
  await page.locator(".calendar").waitFor({ state: "visible" });
  await wait(page, 150);
  check("date: reopening focuses the chosen date", (await activeInfo(page)).date === iso(next15));
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("Enter");
  await wait(page, 200);
  const plus8 = new Date(next15.getFullYear(), next15.getMonth(), next15.getDate() + 8);
  check("date: arrow keys + Enter pick a date", (await hidden(page, "date")) === iso(plus8), await hidden(page, "date"));

  // 5. PageUp twice can't go before today
  await trig.focus();
  await page.keyboard.press("Enter");
  await page.locator(".calendar").waitFor({ state: "visible" });
  await page.keyboard.press("PageUp");
  await page.keyboard.press("PageUp");
  await page.keyboard.press("PageUp");
  await wait(page, 150);
  check("date: PageUp stops at today", (await activeInfo(page)).date === iso(today), (await activeInfo(page)).date);

  // 6. Escape closes and keeps value
  await page.keyboard.press("Escape");
  await wait(page, 150);
  check("date: Escape closes and keeps value", !(await isOpen(page)) && (await hidden(page, "date")) === iso(plus8));

  // 7. Today button and Clear button
  await tapOrClick(page, trig, touch);
  await page.locator(".calendar").waitFor({ state: "visible" });
  await wait(page, 300);
  const clipped = await page.evaluate((s) => { const p = document.querySelector(s); return p.scrollHeight - p.clientHeight; }, surface);
  check("date: whole calendar visible without inner scrolling", clipped <= 1, `${clipped}px hidden`);
  await tapOrClick(page, page.locator(".calendar__action", { hasText: "Today" }), touch);
  await wait(page, 200);
  check("date: Today button picks today", (await hidden(page, "date")) === iso(today));
  await tapOrClick(page, trig, touch);
  await page.locator(".calendar").waitFor({ state: "visible" });
  await tapOrClick(page, page.locator(".calendar__action", { hasText: "Clear" }), touch);
  await wait(page, 200);
  check("date: Clear empties the date", (await hidden(page, "date")) === "" && (await page.locator("#f-date-value").textContent()).includes("Select a date"));

  if (vp.isMobile) {
    // 8. Sheet close button and backdrop
    await tapOrClick(page, trig, true);
    await page.locator(".picker-sheet").waitFor({ state: "visible" });
    await tapOrClick(page, page.locator(".picker-sheet__close"), true);
    await wait(page, 200);
    check("date: sheet close button works", !(await isOpen(page)));
    check("date: page scroll unlocked after close", (await page.evaluate(() => document.documentElement.style.overflow)) === "");
  } else {
    // 8. Tabbing out of the calendar closes it
    await tapOrClick(page, trig, false);
    await page.locator(".calendar").waitFor({ state: "visible" });
    const inside = [];
    for (let i = 0; i < 8; i++) {
      await page.keyboard.press("Tab");
      inside.push(await page.evaluate(() => !!document.activeElement.closest(".picker-pop")));
    }
    check("date: Tab cycles inside the calendar (focus trap)", inside.every(Boolean), inside.join(","));
    for (let i = 0; i < 4; i++) await page.keyboard.press("Shift+Tab");
    check("date: Shift+Tab also stays inside", await page.evaluate(() => !!document.activeElement.closest(".picker-pop")));
    await page.keyboard.press("Escape");
    await wait(page, 150);
    check("date: Escape after tabbing closes and returns focus", !(await isOpen(page)) && (await activeInfo(page)).id === "f-date");
    // 9. Near the bottom it flips above and stays on screen
    await placeAt(page, "#f-date", 0.92);
    await tapOrClick(page, trig, false);
    await page.locator(".calendar").waitFor({ state: "visible" });
    await wait(page, 200);
    const p2 = await rect(page, surface);
    check("date: calendar stays on screen near page bottom", await inViewport(page, p2, 8), `t ${Math.round(p2.top)} b ${Math.round(p2.bottom)}`);
    await page.keyboard.press("Escape");
  }
}

async function formSuite(page, vp) {
  const touch = !!vp.hasTouch;
  await placeAt(page, ".form__actions", 0.6);
  await tapOrClick(page, page.locator(".form button[type=submit]"), touch);
  await page.locator(".field__error").first().waitFor({ timeout: 8000 }).catch(() => {});
  const errs = await page.locator(".field__error").allTextContents();
  check("form: empty submit shows name + email errors", errs.some((e) => /name/i.test(e)) && errs.some((e) => /email/i.test(e)), errs.join(" | "));

  await page.locator("#f-name").fill("Test Visitor");
  await page.locator("#f-email").fill("visitor@example.com");
  await page.locator("#f-phone").fill("call me maybe");
  await tapOrClick(page, page.locator(".form button[type=submit]"), touch);
  await wait(page, 2500);
  const errs2 = await page.locator(".field__error").allTextContents();
  check("form: bad phone shows phone error only", errs2.length === 1 && /phone/i.test(errs2[0]), errs2.join(" | "));

  if (!SAFE_TO_SUBMIT) {
    check("form: valid submit skipped (external server could send a real email)", true);
    return;
  }
  await page.locator("#f-phone").fill("+65 9123 4567");
  await tapOrClick(page, page.locator(".form button[type=submit]"), touch);
  await wait(page, 3000);
  const errs3 = await page.locator(".field__error").count();
  const alert = (await page.locator(".form__alert").textContent().catch(() => "")) ?? "";
  const done = await page.locator(".form__done").count();
  check("form: valid input passes validation", errs3 === 0, alert || (done ? "sent" : ""));
  check("form: kept typed values after server reply", done > 0 || (await page.locator("#f-name").inputValue()) === "Test Visitor");
}

async function siteSuite(page, vp) {
  const touch = !!vp.hasTouch;
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
  await wait(page, 300);

  // Navigation
  if (vp.viewport.width > 820) {
    await tapOrClick(page, page.locator(".site-nav a", { hasText: "Packages" }), touch);
    await wait(page, 1200);
    const top = (await rect(page, "#packages")).top;
    const header = (await rect(page, ".site-header")).bottom;
    check("nav: Packages link scrolls to section", top >= -2 && top <= header + 40, `section top ${Math.round(top)}, header ${Math.round(header)}`);
  } else {
    await tapOrClick(page, page.locator(".nav-toggle"), touch);
    await wait(page, 400);
    check("nav: mobile menu opens", await page.locator(".site-nav.is-open").isVisible());
    await tapOrClick(page, page.locator(".site-nav a", { hasText: "Portfolio" }), touch);
    await wait(page, 1200);
    check("nav: mobile menu closes after link", (await page.locator(".site-nav.is-open").count()) === 0);
    const top = (await rect(page, "#portfolio")).top;
    check("nav: Portfolio link scrolls to section", Math.abs(top) <= 90, `section top ${Math.round(top)}`);
  }

  // Portfolio filter + lightbox
  await placeAt(page, ".filters", 0.2);
  await tapOrClick(page, page.locator(".filter", { hasText: "Brand" }), touch);
  await wait(page, 300);
  const visible = await page.locator(".gallery__item:not(.is-hidden)").count();
  check("portfolio: Brand filter shows 2 pieces", visible === 2, `${visible}`);
  await tapOrClick(page, page.locator(".filter", { hasText: "All" }), touch);
  await wait(page, 300);
  check("portfolio: All shows 8 pieces", (await page.locator(".gallery__item:not(.is-hidden)").count()) === 8);

  await tapOrClick(page, page.locator(".gallery__btn").first(), touch);
  await page.locator("dialog.lightbox[open] .lightbox__figure img").waitFor({ timeout: 5000 });
  await page.waitForFunction(() => { const i = document.querySelector(".lightbox__figure img"); return i && i.complete && i.naturalWidth > 0; }, null, { timeout: 15000 }).catch(() => {});
  const cap1 = await page.locator(".lightbox__figure figcaption").textContent();
  check("lightbox: opens with the clicked piece loaded", cap1.includes("Isaac") && (await page.evaluate(() => document.querySelector(".lightbox__figure img").naturalWidth > 0)), cap1);
  const lr = await rect(page, ".lightbox__figure img");
  check("lightbox: image fits on screen", await inViewport(page, lr, 0), `t ${Math.round(lr.top)} b ${Math.round(lr.bottom)}`);
  if (touch) await tapOrClick(page, page.locator(".lightbox__next"), true);
  else await page.keyboard.press("ArrowRight");
  await wait(page, 400);
  const cap2 = await page.locator(".lightbox__figure figcaption").textContent();
  check("lightbox: next shows a different piece", cap2 !== cap1, cap2);
  await page.keyboard.press("Escape");
  await wait(page, 300);
  check("lightbox: closes", (await page.locator("dialog.lightbox[open]").count()) === 0);
}

async function tierSuite(page, vp) {
  await placeAt(page, ".packages__grid", 0.55);
  await wait(page, 900); // let the cards finish revealing
  await page.screenshot({ path: `${SHOTS}${vp.name}-packages.png` });
  const shadows = await page.evaluate(() => [...document.querySelectorAll(".package")].map((el) => getComputedStyle(el).boxShadow));
  check("tiers: all three cards have a floating shadow", shadows.length === 3 && shadows.every((s) => s && s !== "none" && s.split("rgba").length > 3), `${shadows.length} cards`);
  if (!vp.hasTouch) {
    const card = page.locator(".package--tier-2");
    await page.mouse.move(5, 5);
    await placeAt(page, ".package--tier-2", 0.5); // instant scroll; the page uses smooth scrolling
    const lift = () => card.evaluate((el) => new DOMMatrixReadOnly(getComputedStyle(el).transform).m42);
    const before = await lift();
    const box = await card.boundingBox();
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await wait(page, 600); // let the 0.4s transition finish
    const after = await lift();
    check("tiers: card lifts on hover", before === 0 && after <= -6, `translateY ${before} → ${after}px`);
    await page.mouse.move(5, 5);
  }
}

async function notFoundSuite(context, vp) {
  const page = await context.newPage();
  const errors = [];
  page.on("console", (m) => m.type() === "error" && !/404 \(Not Found\)/.test(m.text()) && errors.push(m.text()));
  page.on("pageerror", (e) => errors.push(String(e)));
  const res = await page.goto(`${BASE}/this-page-does-not-exist`, { waitUntil: "networkidle" });
  await page.addStyleTag({ content: "nextjs-portal { display: none !important; }" });
  await wait(page, 3500); // let the watercolour bloom and the ink line draw
  check("404: unknown URL returns status 404", res.status() === 404, `${res.status()}`);
  check("404: page title set", (await page.title()).includes("Page not found"), await page.title());
  check("404: noindex for search engines", (await page.locator('meta[name="robots"][content*="noindex"]').count()) > 0);
  check("404: heading visible", await page.getByRole("heading", { name: /blank sheet/i }).isVisible());
  const broken = await page.evaluate(() => [...document.images].filter((i) => !(i.complete && i.naturalWidth > 0)).length);
  check("404: all images load", broken === 0, `${broken} broken`);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  check("404: no horizontal scroll", overflow <= 0, `${overflow}px`);
  const cta = await page.getByRole("link", { name: "Back to the studio" }).boundingBox();
  if (!vp.isMobile) check("404: call to action visible without scrolling", cta.y + cta.height <= vp.viewport.height, `bottom ${Math.round(cta.y + cta.height)}`);
  const scene = await page.locator(".nf__scene").boundingBox();
  check("404: illustration fully on screen horizontally", scene.x >= 0 && scene.x + scene.width <= vp.viewport.width);
  await page.screenshot({ path: `${SHOTS}${vp.name}-404.png` });

  await tapOrClick(page, page.getByRole("link", { name: "View the portfolio" }), !!vp.hasTouch);
  await page.waitForURL((u) => u.pathname === "/" && u.hash === "#portfolio", { timeout: 10000 }).catch(() => {});
  await wait(page, 1200);
  const url = new URL(page.url());
  check("404: 'View the portfolio' goes to the portfolio", url.pathname === "/" && url.hash === "#portfolio", page.url());
  const top = await page.evaluate(() => Math.round(document.getElementById("portfolio").getBoundingClientRect().top));
  check("404: lands on the portfolio section", Math.abs(top) <= 140, `section top ${top}px`);

  await page.goto(`${BASE}/another/missing/page`, { waitUntil: "networkidle" });
  await page.addStyleTag({ content: "nextjs-portal { display: none !important; }" });
  await tapOrClick(page, page.getByRole("link", { name: "Back to the studio" }), !!vp.hasTouch);
  await page.waitForURL((u) => u.pathname === "/", { timeout: 10000 }).catch(() => {});
  check("404: 'Back to the studio' goes home", new URL(page.url()).pathname === "/", page.url());
  check("404: no console errors", errors.length === 0, errors.slice(0, 2).join(" | "));
  await page.close();
}

// ---------- run ----------
const browser = await chromium.launch();
for (const vp of VIEWPORTS) {
  current = vp.name;
  const context = await browser.newContext({ viewport: vp.viewport, isMobile: vp.isMobile, hasTouch: vp.hasTouch, deviceScaleFactor: vp.deviceScaleFactor ?? 1 });
  const page = await context.newPage();
  const consoleErrors = [];
  const failed = [];
  page.on("console", (m) => m.type() === "error" && consoleErrors.push(m.text()));
  page.on("pageerror", (e) => consoleErrors.push(String(e)));
  page.on("response", (r) => r.status() >= 400 && failed.push(`${r.status()} ${r.url().replace(BASE, "")}`));

  await page.goto(BASE, { waitUntil: "networkidle" });
  // `next dev` shows a dev-tools badge in the corner that visitors never see;
  // hide it so it can't sit on top of controls the tests tap
  await page.addStyleTag({ content: "nextjs-portal { display: none !important; }" });
  await wait(page, 1500);
  await page.screenshot({ path: `${SHOTS}${vp.name}-hero.png` });

  for (const [name, suite] of [["health", pageHealth], ["tiers", tierSuite], ["select", selectSuite], ["date", dateSuite], ["form", formSuite], ["site", siteSuite]]) {
    try {
      await suite(page, vp);
    } catch (e) {
      check(`${name} suite ran without crashing`, false, String(e).split("\n")[0]);
    }
  }
  check("no console errors", consoleErrors.length === 0, consoleErrors.slice(0, 3).join(" | "));
  check("no failed requests", failed.length === 0, failed.slice(0, 5).join(" | "));
  try {
    await notFoundSuite(context, vp);
  } catch (e) {
    check("404 suite ran without crashing", false, String(e).split("\n")[0]);
  }
  await context.close();
}
await browser.close();
server?.stop();

const fails = results.filter((r) => !r.ok);
console.log(`\n${results.length - fails.length}/${results.length} checks passed`);
if (fails.length) {
  console.log("FAILURES:");
  for (const f of fails) console.log(`  [${f.vp}] ${f.name}  — ${f.detail}`);
  process.exit(1);
}
