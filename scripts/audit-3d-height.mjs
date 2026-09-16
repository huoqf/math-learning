/**
 * 3D 画布容器高度链核对：确认 Canvas3DErrorBoundary 改用 display:contents 后
 * 3D 容器（div.rounded-xl）尺寸与 canvas 尺寸是否仍与父级一致、有无塌陷。
 * 用法：node scripts/_probe-3d-height.mjs http://localhost:5201
 */
import { chromium } from "@playwright/test";
import fs from "node:fs";

const BASE = process.argv[2] || "http://localhost:5201";
const ROUTES = JSON.parse(fs.readFileSync("scripts/routes.json", "utf8"));

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1600, height: 900 } });
const page = await ctx.newPage();

let n = 0;
let bad = 0;

for (const r of ROUTES) {
  await page.goto(`${BASE}/#${r.route}`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1100);
  const info = await page.evaluate(() => {
    const cv = document.querySelector("canvas");
    if (!cv) return null;
    const box = cv.closest("div.rounded-xl");
    if (!box) return { noBox: true };
    const b = box.getBoundingClientRect();
    const p = box.parentElement;
    const g = p ? p.parentElement : null;
    return {
      box: [Math.round(b.width), Math.round(b.height)],
      pTag: p ? p.tagName : null,
      pDisp: p ? getComputedStyle(p).display : null,
      pH: p ? Math.round(p.getBoundingClientRect().height) : null,
      gTag: g ? g.tagName : null,
      gDisp: g ? getComputedStyle(g).display : null,
      gH: g ? Math.round(g.getBoundingClientRect().height) : null,
      cv: [
        Math.round(cv.getBoundingClientRect().width),
        Math.round(cv.getBoundingClientRect().height),
      ],
    };
  });
  if (!info) continue;
  n++;
  const ok =
    info.box &&
    info.cv &&
    info.box[0] === info.cv[0] &&
    info.box[1] === info.cv[1] &&
    info.box[1] > 200;
  if (!ok) bad++;
  console.log(
    `${ok ? "OK " : "!! "}${r.route.padEnd(32)} 容器=${info.box ? info.box.join("x") : "-"} canvas=${
      info.cv ? info.cv.join("x") : "-"
    } | 父=${info.pTag}.${info.pDisp}(${info.pH}) 祖父=${info.gTag}.${info.gDisp}(${info.gH})`,
  );
}
console.log(`\n含 canvas 路由数 = ${n}；尺寸异常 = ${bad}`);

await browser.close();
