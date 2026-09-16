/** 视觉取证：把 2px 容差导致的亚像素裁切放大到 4x，判断肉眼可见性 */
import { chromium } from '@playwright/test';
import fs from 'node:fs';

const BASE = process.env.BASE || 'http://localhost:5199';
const OUTDIR = 'scripts/shots';
fs.mkdirSync(OUTDIR, { recursive: true });

const TARGETS = [
  { route: '/paired-data-independence', text: '(ad', file: 'clip-1.36px-paired-data-independence' },
  { route: '/derivative', text: 'Δx→0', file: 'clip-0.81px-derivative' },
];

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1600, height: 900 }, deviceScaleFactor: 4 });
const page = await ctx.newPage();

for (const t of TARGETS) {
  await page.goto(`${BASE}/#${t.route}`, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => document.querySelectorAll('.katex').length > 0, { timeout: 25000 }).catch(() => {});
  let prev = -1, stable = 0;
  for (let i = 0; i < 25 && stable < 2; i++) {
    const c = await page.evaluate(() => document.querySelectorAll('.katex').length);
    if (c === prev && c > 0) stable++; else stable = 0;
    prev = c;
    await page.waitForTimeout(200);
  }
  await page.evaluate(() => (document.fonts ? document.fonts.ready : null)).catch(() => {});
  await page.waitForTimeout(400);

  const box = await page.evaluate((needle) => {
    for (const k of document.querySelectorAll('.katex')) {
      const html = k.querySelector('.katex-html');
      if (!html) continue;
      const txt = html.textContent || '';
      if (!txt.includes(needle)) continue;
      const r = html.getBoundingClientRect();
      if (r.width < 150) continue;
      return { x: r.right - 60, y: r.top - 6, width: 70, height: r.height + 12 };
    }
    return null;
  }, t.text);

  if (!box) {
    console.log('MISS', t.route);
    continue;
  }
  await page.screenshot({ path: `${OUTDIR}/${t.file}.png`, clip: box });
  console.log(`拍摄 ${t.file}.png  clip=${JSON.stringify(box)}`);
}
await browser.close();
