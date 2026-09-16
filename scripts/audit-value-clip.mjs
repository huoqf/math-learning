/**
 * 全量裁切检测（针对右屏「几何特征量与代数解」分区的 value 公式）。
 *
 * 与 audit-truncation.mjs 的区别：本脚本以 **value 行自身**（
 * `flex items-baseline justify-end overflow-hidden`）作为裁切参照，
 * 而不是 KaTeX 组件自己的 overflow-x-clip 容器。
 *
 * 原因：value 公式在 block 模式下 `w-full`，其组件外框会随内容变宽；
 * 若公式自然宽度超过 value 行可用宽，外框会被撑到超出 value 行，
 * 由 value 行的 overflow-hidden 裁掉——此时以组件外框为参照会漏报。
 *
 * 判据：
 *  - leftOver  = valueRow.left - katex.left   > 1  → 左侧被裁（公式开头丢失）
 *  - rightOver = katex.right - valueRow.right > 1  → 右侧被裁（公式结尾丢失）
 * 用法：node scripts/audit-value-clip.mjs http://localhost:5201
 */
import { chromium } from "@playwright/test";
import fs from "node:fs";

const BASE = process.argv[2] || "http://localhost:5201";
const ROUTES = JSON.parse(fs.readFileSync("scripts/routes.json", "utf8"));

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1600, height: 900 } });
const page = await ctx.newPage();

let total = 0;
let clipped = 0;
const bad = [];

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
    if (!panel) return [];
    const grid = Array.from(panel.querySelectorAll("div.grid")).find((g) =>
      g.className.includes("grid-cols-2"),
    );
    if (!grid) return [];
    const rows = [];
    for (const card of Array.from(grid.children)) {
      const valueRow = Array.from(card.querySelectorAll("div")).find(
        (d) =>
          d.className.includes("items-baseline") &&
          d.className.includes("justify-end"),
      );
      if (!valueRow) continue;
      const vr = valueRow.getBoundingClientRect();
      for (const k of Array.from(valueRow.querySelectorAll(".katex"))) {
        if (k.closest(".katex-mathml")) continue;
        const kr = k.getBoundingClientRect();
        if (kr.width === 0) continue;
        const leftOver = Math.round(vr.left - kr.left);
        const rightOver = Math.round(kr.right - vr.right);
        rows.push({
          leftOver,
          rightOver,
          rowW: Math.round(vr.width),
          katexW: Math.round(kr.width),
          disp: Boolean(k.closest(".katex-display")),
          txt: (k.textContent || "").replace(/\s+/g, " ").trim().slice(0, 60),
        });
      }
    }
    return rows;
  });

  total += res.length;
  const hit = res.filter((x) => x.leftOver > 1 || x.rightOver > 1);
  clipped += hit.length;
  if (hit.length) {
    bad.push({ route: r.route, hit });
    console.log(`\n### ${r.route}`);
    hit.forEach((x) =>
      console.log(
        `   *** 裁切 *** display=${x.disp} value行宽=${x.rowW} 公式宽=${x.katexW} 左裁=${x.leftOver} 右裁=${x.rightOver} :: ${x.txt}`,
      ),
    );
  }
}

console.log(`\n===== 汇总 =====`);
console.log(`扫描 value 公式共 ${total} 个；被 value 行裁切的 = ${clipped}`);
bad.forEach((b) => console.log(`  ${b.route}  裁切 ${b.hit.length} 处`));

await browser.close();
