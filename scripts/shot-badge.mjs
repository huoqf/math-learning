/**
 * 徽标视觉取证：截取含 q.symbol 徽标的卡片，用于 A/B 对照观察字形大小。
 * 用法：node scripts/_shot-badge.mjs <base> <label> [route...]
 * 输出：scripts/shots/badge-<label>-<route>.png（deviceScaleFactor=2，便于观察小字号）
 */
import { chromium } from '@playwright/test';
import fs from 'node:fs';

const BASE = process.argv[2] || 'http://localhost:5201';
const LABEL = process.argv[3] || 'x';
const ROUTES = process.argv.slice(4);
const ROUTES_FALLBACK = ['/vector-linear', '/triangle-extrema', '/solid-position', '/function-zero', '/complex-geometric'];
const list = ROUTES.length ? ROUTES : ROUTES_FALLBACK;

fs.mkdirSync('scripts/shots', { recursive: true });

const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: 1600, height: 900 },
  deviceScaleFactor: 2,
});
const page = await context.newPage();

for (const route of list) {
  await page.goto(`${BASE}/#${route}`, { waitUntil: 'domcontentloaded' });
  await page
    .waitForFunction(() => document.querySelectorAll('.katex').length > 0, { timeout: 25000 })
    .catch(() => {});
  await page.waitForTimeout(900);

  const box = await page.evaluate(() => {
    const sc = [...document.querySelectorAll('div')].filter((d) => {
      const cs = getComputedStyle(d);
      return cs.overflowY === 'auto' || cs.overflowY === 'scroll';
    });
    const panel = sc[sc.length - 1];
    if (!panel) return null;
    const span = [...panel.querySelectorAll('span')].find(
      (s) => s.classList.contains('font-mono') && s.querySelector('.katex'),
    );
    if (!span) return null;
    let card = span.parentElement;
    while (card && card !== panel && !/rounded-lg/.test(String(card.className))) {
      card = card.parentElement;
    }
    const el = card || span;
    // 卡片可能位于右屏可滚动区域之外，先滚到视口中央，否则截图 clip 会越界
    el.scrollIntoView({ block: 'center', inline: 'nearest' });
    const r = el.getBoundingClientRect();
    return { x: r.x, y: r.y, w: r.width, h: r.height };
  });

  if (!box) {
    console.log(`  ${route}: 未找到徽标卡片`);
    continue;
  }
  // clip 必须完整落在 1600×900 视口内
  const x = Math.max(0, Math.min(box.x - 8, 1600 - 40));
  const y = Math.max(0, Math.min(box.y - 8, 900 - 40));
  const width = Math.max(20, Math.min(box.w + 16, 1600 - x));
  const height = Math.max(20, Math.min(box.h + 16, 900 - y));
  const path = `scripts/shots/badge-${LABEL}-${route.replace(/\//g, '')}.png`;
  await page.screenshot({ path, clip: { x, y, width, height } });
  console.log(`  ${route}: ${path} (${Math.round(width)}×${Math.round(height)})`);
}

await browser.close();
