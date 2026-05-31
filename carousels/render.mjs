// Render every generated slide HTML to a 1080x1350 @2x PNG.
// Requires Puppeteer:  npm i puppeteer   (downloads Chromium)
// Run:  node carousels/render.mjs
import puppeteer from "puppeteer";
import { readFileSync } from "node:fs";
import { pathToFileURL, fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ROOT = dirname(fileURLToPath(import.meta.url));
const manifest = JSON.parse(readFileSync(join(ROOT, "manifest.json"), "utf8"));

const browser = await puppeteer.launch({
  headless: "new",
  args: ["--no-sandbox", "--disable-setuid-sandbox", "--force-color-profile=srgb"],
});

for (const deck of manifest) {
  for (const f of deck.files) {
    const page = await browser.newPage();
    await page.setViewport({ width: 1080, height: 1350, deviceScaleFactor: 2 });
    await page.goto(pathToFileURL(join(ROOT, deck.slug, f)).href, {
      waitUntil: "networkidle0", timeout: 30000,
    });
    try { await page.evaluate(() => document.fonts.ready); } catch {}
    await new Promise((r) => setTimeout(r, 250));
    await page.screenshot({
      path: join(ROOT, deck.slug, f.replace(".html", ".png")),
      type: "png", clip: { x: 0, y: 0, width: 1080, height: 1350 },
    });
    await page.close();
    console.log("rendered", deck.slug, f);
  }
}
await browser.close();
console.log("done");
