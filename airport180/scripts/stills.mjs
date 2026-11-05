import fs from "node:fs";
import { bundle } from "@remotion/bundler";
import {
  openBrowser,
  selectComposition,
  renderStill,
} from "@remotion/renderer";
fs.mkdirSync("renders", { recursive: true });
fs.mkdirSync("reports", { recursive: true });
const browserExecutable = process.env.CHROME_PATH || "/usr/bin/chromium";
const serveUrl = await bundle({ entryPoint: "src/index.ts" }),
  composition = await selectComposition({
    serveUrl,
    browserExecutable,
    id: "Airport180",
  });
const browser = await openBrowser("chrome", { browserExecutable });
const audit = [];
let frame = 0;
const newPage = browser.newPage.bind(browser);
browser.newPage = async (options) => {
  const page = await newPage(options),
    client = page._client(),
    send = client.send.bind(client);
  client.send = async (method, ...args) => {
    if (method === "Page.captureScreenshot") {
      const row = await page.evaluate(() => {
        const root = [...document.querySelectorAll("[data-film-frame]")].find(
          (e) => {
            const b = e.getBoundingClientRect();
            return b.width > 1800 && b.x >= 0 && b.y >= 0 && b.y < 1080;
          },
        );
        if (!root) return null;
        const bounds = (e) => {
          const b = e.getBoundingClientRect();
          return { x: b.x, y: b.y, w: b.width, h: b.height };
        };
        return {
          fontLoaded: document.fonts.check("30px AirportSans"),
          text: root.textContent,
          subtitle: root.querySelector("[data-subtitle]")
            ? bounds(root.querySelector("[data-subtitle]"))
            : null,
          bodyText: [...root.querySelectorAll("svg text")].map((e) => ({
            text: e.textContent,
            ...bounds(e),
          })),
          relations: [...root.querySelectorAll("[data-relation]")].map((e) => ({
            kind: e.getAttribute("data-relation"),
            from: e.getAttribute("data-from"),
            to: e.getAttribute("data-to"),
            dash: getComputedStyle(e).strokeDasharray,
          })),
        };
      });
      if (row) audit.push({ frame, ...row });
    }
    return send(method, ...args);
  };
  return page;
};
const shots = JSON.parse(fs.readFileSync("src/config/shots.json"));
try {
  for (const s of [
    ...shots.map((s) => ({
      id: s.shot_id,
      frame: Math.floor((s.start_s + s.end_s) * 15),
    })),
    { id: "opening", frame: 30 },
    { id: "ending", frame: 5399 },
  ]) {
    frame = s.frame;
    await renderStill({
      serveUrl,
      browserExecutable,
      composition,
      puppeteerInstance: browser,
      frame,
      output: `renders/${s.id}.png`,
    });
    console.log("STILL", s.id);
  }
} finally {
  await browser.close({ silent: true });
}
fs.writeFileSync("reports/ui-audit.json", JSON.stringify(audit, null, 2));
for (const a of audit) {
  if (!a.fontLoaded) throw Error("Bundled CJK font not loaded");
  if (a.subtitle && (a.subtitle.x < 129 || a.subtitle.y + a.subtitle.h > 981))
    throw Error("Subtitle outside safe area");
  if (a.frame >= 210 && /虚构|新岚|澜屿/.test(a.text))
    throw Error("Repeated fictional label or airport name");
  if (/无配音测试|\/ 03:00/.test(a.text)) throw Error("Footer text detected");
  for (const t of a.bodyText) {
    if (t.x < 0 || t.x + t.w > 1920 || t.y < 180 || t.y + t.h > 885)
      throw Error(`Body text overflow: ${JSON.stringify(t)}`);
  }
}
console.log("UI_AUDIT_PASS", audit.length, "actual screenshot DOM captures");
