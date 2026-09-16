/**
 * 定点复测：A（examAnchor 越界）/ B（公式裁切）/ C（分区缺失）修复后的关键路由。
 * 用法：node scripts/verify-fixes.mjs http://localhost:5201
 */
import { chromium } from "@playwright/test";

const base = process.argv[2] || "http://localhost:5201";
const routes = [
  "/function-zero",
  "/conic-line",
  "/derivative-monotonicity",
  "/conic-properties",
  "/solid-parametric",
  "/solid-angle",
  "/probability-markov",
  "/inequality-absolute",
  "/function-symmetry",
  "/nike-standard",
  "/nike-amgm",
];

const SECTIONS = [
  ["推演链", "高考破题三步推演链"],
  ["口诀", "记忆口诀"],
  ["要点", "高考"],
  ["定理", "定理"],
  ["警示", "警示"],
  ["不变量", "不变量"],
];

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1600, height: 900 } });
const page = await ctx.newPage();

let badA = 0;
let badB = 0;

for (const route of routes) {
  await page.goto(`${base}/#${route}`, { waitUntil: "domcontentloaded" });
  await page
    .waitForFunction(() => document.querySelectorAll(".katex").length > 0, {
      timeout: 30000,
    })
    .catch(() => {});
  await page.waitForTimeout(1500);

  const r = await page.evaluate((SECTIONS) => {
    const scrollers = [...document.querySelectorAll("div")].filter(
      (d) => getComputedStyle(d).overflowY === "auto",
    );
    const panel = scrollers[scrollers.length - 1];
    if (!panel) return null;
    const pcs = getComputedStyle(panel);
    const pr = panel.getBoundingClientRect();
    const right = pr.right - (parseFloat(pcs.paddingRight) || 0) - (panel.offsetWidth - panel.clientWidth);

    // A：右屏是否出现水平溢出（scrollWidth > clientWidth）
    const panelOverflow = panel.scrollWidth - panel.clientWidth;

    // A：徽标越界
    let badge = null;
    const badgeEl = panel.querySelector("span[title]");
    if (badgeEl && /人教|高考|版|必修/.test(badgeEl.textContent || "")) {
      const br = badgeEl.getBoundingClientRect();
      badge = {
        over: Math.round(br.right - right),
        w: Math.round(br.width),
        text: (badgeEl.textContent || "").trim().slice(0, 30),
      };
    }

    // B：公式被最近 overflow 裁切祖先截断
    const trunc = [];
    const scaled = [];
    for (const k of panel.querySelectorAll(".katex")) {
      if (k.closest(".katex-mathml")) continue;
      const html = k.querySelector(".katex-html") || k;
      if (html.getBoundingClientRect().height === 0) continue;
      const kr = html.getBoundingClientRect();
      let host = k;
      while (host && host !== panel) {
        const cs = getComputedStyle(host);
        if (cs.overflowX === "hidden" || cs.overflowX === "clip") break;
        host = host.parentElement;
      }
      if (host && host !== panel) {
        const hcs = getComputedStyle(host);
        const hr = host.getBoundingClientRect();
        const hostRight =
          hr.right - (parseFloat(hcs.paddingRight) || 0) - (host.offsetWidth - host.clientWidth);
        const over = kr.right - hostRight;
        if (over > 1.5) {
          trunc.push({
            over: Math.round(over),
            text: (k.textContent || "").replace(/\s+/g, " ").trim().slice(0, 55),
          });
        }
      }
      const tf = getComputedStyle(k.parentElement).transform;
      if (tf && tf !== "none") {
        const m = tf.match(/matrix\(([\d.]+)/);
        if (m) scaled.push(Number(m[1]));
      }
    }

    // C：分区缺失
    const txt = panel.textContent || "";
    const sections = SECTIONS.filter(([, label]) => txt.includes(label)).map(
      ([n]) => n,
    );

    return {
      panelOverflow: Math.round(panelOverflow),
      badge,
      trunc: trunc.slice(0, 3),
      minScale: scaled.length ? Math.min(...scaled) : 1,
      sections,
      katexCount: panel.querySelectorAll(".katex").length,
      hasNaN: /NaN|undefined|\[object Object\]/.test(txt),
    };
  }, SECTIONS);

  if (!r) {
    console.log(`${route}  !! 未定位到右屏`);
    continue;
  }
  const flags = [];
  if (r.panelOverflow > 0) { flags.push("右屏水平溢出 " + r.panelOverflow + "px"); badA++; }
  if (r.badge && r.badge.over > 1.5) { flags.push("徽标越界 " + r.badge.over + "px"); badA++; }
  if (r.trunc.length) { flags.push("公式裁切 " + r.trunc.map((t) => t.over + "px").join("/")); badB++; }
  if (r.hasNaN) flags.push("NaN 泄漏");
  console.log(
    `${route.padEnd(24)} 分区=${r.sections.length} 公式=${r.katexCount} 最小缩放=${r.minScale.toFixed(2)} ` +
      (flags.length ? "❌ " + flags.join(" | ") : "✅"),
  );
  if (r.badge && r.badge.over > 1.5)
    console.log(`   徽标(${r.badge.w}px) ${JSON.stringify(r.badge.text)}`);
  for (const t of r.trunc)
    console.log(`   裁切 ${t.over}px ${JSON.stringify(t.text)}`);
}

console.log("");
console.log(`A 类异常路由 ${badA} / B 类 ${badB}`);
await browser.close();
