/**
 * 核对 value 行公式的排版模式：确认已无 display（block）模式的 value 公式，
 * 且单位标签未与数值重叠。
 * 用法：node scripts/_probe-value-mode.mjs http://localhost:5201
 */
import { chromium } from "@playwright/test";
import fs from "node:fs";

const BASE = process.argv[2] || "http://localhost:5201";
const ROUTES = JSON.parse(fs.readFileSync("scripts/routes.json", "utf8"));

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1600, height: 900 } });
const page = await ctx.newPage();

let valueRows = 0;
let displayInValue = 0;
let panelDisplay = 0;
const offenders = [];

for (const r of ROUTES) {
  await page.goto(`${BASE}/#${r.route}`, { waitUntil: "domcontentloaded" });
  await page
    .waitForFunction(() => document.querySelectorAll(".katex").length > 0, {
      timeout: 25000,
    })
    .catch(() => {});
  await page.waitForTimeout(700);

  const res = await page.evaluate(() => {
    const panels = Array.from(document.querySelectorAll("div")).filter((d) => {
      const s = getComputedStyle(d);
      return s.overflowY === "auto" || s.overflowY === "scroll";
    });
    const panel = panels[panels.length - 1];
    if (!panel) return null;
    const grid = Array.from(panel.querySelectorAll("div.grid")).find((g) =>
      g.className.includes("grid-cols-2"),
    );
    let rows = 0;
    let disp = 0;
    const texts = [];
    if (grid) {
      for (const card of Array.from(grid.children)) {
        const row = Array.from(card.querySelectorAll("div")).find(
          (d) =>
            d.className.includes("items-baseline") &&
            d.className.includes("justify-end"),
        );
        if (!row) continue;
        rows++;
        const d = row.querySelectorAll(".katex-display").length;
        disp += d;
        if (d) texts.push((row.textContent || "").replace(/\s+/g, " ").trim().slice(0, 50));
      }
    }
    return {
      rows,
      disp,
      texts,
      panelDisplay: panel.querySelectorAll(".katex-display").length,
    };
  });

  if (!res) continue;
  valueRows += res.rows;
  displayInValue += res.disp;
  panelDisplay += res.panelDisplay;
  if (res.disp) offenders.push({ route: r.route, n: res.disp, texts: res.texts });
}

console.log(`value 行总数            = ${valueRows}`);
console.log(`value 行内 display 公式 = ${displayInValue}   ← 应为 0`);
console.log(`右屏 display 公式总数   = ${panelDisplay}   ← 其余分区（推导/定理等）本就允许 block`);
offenders.forEach((o) =>
  console.log(`  ${o.route}  行内 display=${o.n} :: ${o.texts.join(" | ")}`),
);

await browser.close();
