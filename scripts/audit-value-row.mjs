/**
 * value 行综合体检：以「value 行」为裁切参照，同时检查
 *   1) 行内容是否被 overflow-hidden 裁掉（scrollWidth > clientWidth）
 *   2) value 文本盒与单位标签是否发生重叠
 *   3) 行内 KaTeX 是否触发了自适应缩放 / 缩到硬底线
 * 用法：node scripts/_probe-value-row.mjs http://localhost:5201
 */
import { chromium } from "@playwright/test";
import fs from "node:fs";

const BASE = process.argv[2] || "http://localhost:5201";
const ROUTES = JSON.parse(fs.readFileSync("scripts/routes.json", "utf8"));

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1600, height: 900 } });
const page = await ctx.newPage();

let rowsTotal = 0;
let clippedRows = 0;
let overlapRows = 0;
let scaledRows = 0;
let floorRows = 0;
const worst = [];

for (const r of ROUTES) {
  await page.goto(`${BASE}/#${r.route}`, { waitUntil: "domcontentloaded" });
  await page
    .waitForFunction(() => document.querySelectorAll(".katex").length > 0, {
      timeout: 25000,
    })
    .catch(() => {});
  await page.waitForTimeout(900);

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
    if (!grid) return [];
    const out = [];
    for (const card of Array.from(grid.children)) {
      const row = Array.from(card.querySelectorAll("div")).find(
        (d) =>
          d.className.includes("items-baseline") &&
          d.className.includes("justify-end"),
      );
      if (!row) continue;
      const kids = Array.from(row.children);
      const vSpan = kids[0];
      if (!vSpan) continue;
      const uSpan = kids[1] || null;
      const vk = vSpan.getBoundingClientRect();
      const uk = uSpan ? uSpan.getBoundingClientRect() : null;
      const scales = Array.from(row.querySelectorAll("div"))
        .map((d) => (d.style.transform || "").match(/scale\(([-\d.]+)\)/))
        .filter(Boolean)
        .map((m) => parseFloat(m[1]));
      out.push({
        rowW: Math.round(row.getBoundingClientRect().width),
        rowScroll: row.scrollWidth,
        rowClient: row.clientWidth,
        clip: row.scrollWidth - row.clientWidth,
        vSpanW: Math.round(vk.width),
        vText: (vSpan.textContent || "").replace(/\s+/g, " ").trim().slice(0, 56),
        overlap: uk ? Math.round(vk.right - uk.left) : 0,
        minScale: scales.length ? Math.min(...scales) : 1,
      });
    }
    return out;
  });

  if (!res) continue;
  const hitClip = res.filter((x) => x.clip > 1);
  const hitOverlap = res.filter((x) => x.overlap > 1);
  const hitScale = res.filter((x) => x.minScale < 0.98);
  const hitFloor = res.filter((x) => x.minScale <= 0.56);
  rowsTotal += res.length;
  clippedRows += hitClip.length;
  overlapRows += hitOverlap.length;
  scaledRows += hitScale.length;
  floorRows += hitFloor.length;
  if (hitClip.length || hitOverlap.length) {
    console.log(`\n### ${r.route}  (value 行 ${res.length})`);
    hitClip.forEach((x) =>
      console.log(
        `   *** 行裁切 ${x.clip}px *** 行宽=${x.rowW} 滚动宽=${x.rowScroll} 盒宽=${x.vSpanW} :: ${x.vText}`,
      ),
    );
    hitOverlap.forEach((x) =>
      console.log(`   *** 与单位重叠 ${x.overlap}px *** :: ${x.vText}`),
    );
    worst.push({ route: r.route, clip: hitClip.length, overlap: hitOverlap.length });
  }
}

console.log(`\n===== 汇总 =====`);
console.log(`value 行总数            = ${rowsTotal}`);
console.log(`内容被行裁切的行        = ${clippedRows}`);
console.log(`与单位标签重叠的行      = ${overlapRows}`);
console.log(`KaTeX 触发缩放的行      = ${scaledRows}`);
console.log(`KaTeX 缩到硬底线的行    = ${floorRows}`);
worst.forEach((b) => console.log(`  ${b.route}  裁切 ${b.clip} / 重叠 ${b.overlap}`));

await browser.close();
