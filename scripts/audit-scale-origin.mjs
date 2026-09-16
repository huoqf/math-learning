/**
 * 触底缩放溯源：把右屏内所有「被缩放的 KaTeX」连同其祖先链（标签/类名/clientWidth）打出来，
 * 用于判断残留触底缩放的归属容器（是否与徽标同源）。
 * 用法：node scripts/_probe-floor-hunt.mjs <base> <route...>
 */
import { chromium } from '@playwright/test';

const BASE = process.argv[2] || 'http://localhost:5201';
const ROUTES = process.argv.slice(3);

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1600, height: 900 } });
const page = await context.newPage();

for (const route of ROUTES) {
  await page.goto(`${BASE}/#${route}`, { waitUntil: 'domcontentloaded' });
  await page
    .waitForFunction(() => document.querySelectorAll('.katex').length > 0, { timeout: 25000 })
    .catch(() => {});
  await page.waitForTimeout(800);

  const rows = await page.evaluate(() => {
    const sc = [...document.querySelectorAll('div')].filter((d) => {
      const cs = getComputedStyle(d);
      return cs.overflowY === 'auto' || cs.overflowY === 'scroll';
    });
    const panel = sc[sc.length - 1];
    if (!panel) return [];
    const out = [];
    for (const k of panel.querySelectorAll('.katex')) {
      // 找到最近的带 transform 的祖先
      let node = k.parentElement;
      let scaled = null;
      let scale = 1;
      let hops = 0;
      while (node && node !== panel && hops < 8) {
        const t = getComputedStyle(node).transform;
        const m = t && t !== 'none' ? t.match(/matrix\(([^)]+)\)/) : null;
        if (m) {
          scale = Number(m[1].split(',')[0]);
          if (scale < 0.995) scaled = node;
          break;
        }
        node = node.parentElement;
        hops++;
      }
      if (!scaled) continue;

      // 祖先链
      const chain = [];
      let cur = k;
      let n = 0;
      while (cur && cur !== panel && n < 8) {
        const cls = String(cur.className || '').split(/\s+/).filter(Boolean).join('.');
        chain.push(`${cur.tagName.toLowerCase()}${cls ? '.' + cls.slice(0, 60) : ''}[${cur.clientWidth}]`);
        if (cur === scaled) chain[chain.length - 1] = '>>> ' + chain[chain.length - 1];
        cur = cur.parentElement;
        n++;
      }
      out.push({
        text: (k.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 30),
        scale: +scale.toFixed(3),
        containerW: scaled.clientWidth,
        chain,
      });
    }
    return out;
  });

  console.log(`===== ${route}（被缩放 KaTeX ${rows.length} 个）=====`);
  rows.slice(0, 8).forEach((r) => {
    console.log(`  scale=${r.scale} 容器=${r.containerW} :: ${r.text}`);
    console.log(`     ${r.chain.join('\n     ↑ ')}`);
  });
  if (rows.length > 8) console.log(`  ... 其余 ${rows.length - 8} 个同类`);
}

await browser.close();
