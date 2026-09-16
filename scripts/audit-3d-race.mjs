/**
 * 抓取 3D 路由切换竞态 pageerror 的完整调用栈，判定该错误是否处于
 * React 渲染/提交阶段（ErrorBoundary 可捕获）还是异步/清理阶段（边界不可达）。
 * 用法：node scripts/_probe-3d-stack.mjs http://localhost:5201 [轮数]
 */
import { chromium } from "@playwright/test";
import fs from "node:fs";

const BASE = process.argv[2] || "http://localhost:5201";
const ROUNDS = Number(process.argv[3] || 12);
const ROUTES = JSON.parse(fs.readFileSync("scripts/routes.json", "utf8"));
const D3 = ROUTES.filter(
  (r) => r.route.startsWith("/solid") || r.route.startsWith("/vector3d"),
);

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1600, height: 900 } });
const page = await ctx.newPage();

const seen = new Map();
page.on("pageerror", (e) => {
  const key = e.message;
  const rec = seen.get(key) || { count: 0, stacks: new Set() };
  rec.count++;
  rec.stacks.add((e.stack || "(无 stack)").split("\n").slice(0, 6).join("\n"));
  seen.set(key, rec);
});

for (let round = 1; round <= ROUNDS; round++) {
  for (const r of D3) {
    await page.goto(`${BASE}/#${r.route}`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(260);
  }
}

console.log(`3D 路由 ${D3.length} 条 × ${ROUNDS} 轮 = ${D3.length * ROUNDS} 次切换`);
console.log(`\npageerror 类型数 = ${seen.size}`);
let total = 0;
for (const [msg, rec] of seen) {
  total += rec.count;
  console.log(`\n===== ×${rec.count}  ${msg}`);
  for (const s of rec.stacks) console.log("--- stack ---\n" + s);
}
console.log(`\npageerror 总次数 = ${total}`);

await browser.close();
