/**
 * 符号徽标体检：卡片头部 q.symbol 徽标的实际渲染几何与缩放比。
 *
 * 判据（只用可见几何，排除 .katex-mathml）：
 *  - 徽标定位：右屏内 span.font-mono（含 .katex 子节点）—— 即 MathInvariantsSection 的 q.symbol 徽标。
 *  - 缩放比：取徽标内 KaTeX 祖链上带 transform 的容器 matrix 的 sx。
 *  - 溢出：徽标右边界超出其所属卡片内容右边界（卡片为最近 .rounded-lg 祖先）。
 *  - 可读性：报告最小/最大徽标字号与最小缩放比。
 *
 * 用法：node scripts/audit-symbol-badge.mjs <base> [out.json]
 */
import { chromium } from '@playwright/test';
import fs from 'node:fs';

const BASE = process.argv[2] || process.env.BASE || 'http://localhost:5201';
const OUT = process.argv[3];
const ROUTES = JSON.parse(fs.readFileSync('scripts/routes.json', 'utf8'));

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1600, height: 900 } });
const page = await context.newPage();
const out = [];

for (const r of ROUTES) {
  await page.goto(`${BASE}/#${r.route}`, { waitUntil: 'domcontentloaded' });
  await page
    .waitForFunction(() => document.querySelectorAll('.katex').length > 0, { timeout: 25000 })
    .catch(() => {});
  await page.waitForTimeout(800);

  const res = await page.evaluate(() => {
    const sc = [...document.querySelectorAll('div')].filter((d) => {
      const cs = getComputedStyle(d);
      return cs.overflowY === 'auto' || cs.overflowY === 'scroll';
    });
    const panel = sc[sc.length - 1];
    if (!panel) return { noPanel: true, badges: [], total: 0 };

    const badges = [];
    const spans = [...panel.querySelectorAll('span')].filter(
      (s) => s.classList.contains('font-mono') && s.querySelector('.katex'),
    );

    for (const s of spans) {
      const k = s.querySelector('.katex');
      const sr = s.getBoundingClientRect();
      if (sr.width === 0) continue;

      // 所属卡片
      let card = s.parentElement;
      while (card && card !== panel && !/rounded-lg/.test(String(card.className))) {
        card = card.parentElement;
      }
      const cr = card ? card.getBoundingClientRect() : null;
      const cardClientW = card ? card.clientWidth : null;
      const cardPadR = card ? parseFloat(getComputedStyle(card).paddingRight) || 0 : 0;
      const cardInnerRight = cr ? cr.right - cardPadR : sr.right;

      // 缩放比
      let scale = 1;
      let node = k.parentElement;
      let hops = 0;
      while (node && node !== panel && hops < 5) {
        const t = getComputedStyle(node).transform;
        const m = t && t !== 'none' ? t.match(/matrix\(([^)]+)\)/) : null;
        if (m) {
          scale = Number(m[1].split(',')[0]);
          break;
        }
        node = node.parentElement;
        hops++;
      }

      const html = k.querySelector('.katex-html');
      const hr = html ? html.getBoundingClientRect() : null;
      const cs = getComputedStyle(k);

      badges.push({
        text: (k.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 24),
        badgeW: Math.round(sr.width),
        badgeOver: Math.round(sr.right - cardInnerRight),
        exceedsCard: cardClientW !== null ? Math.round(sr.width - cardClientW) : null,
        contentW: hr ? Math.round(hr.width) : null,
        contentH: hr ? +hr.height.toFixed(1) : null,
        fontSize: parseFloat(cs.fontSize),
        scale: +scale.toFixed(3),
        cardW: cardClientW,
      });
    }

    const scales = badges.map((b) => b.scale);
    const fonts = badges.map((b) => b.fontSize);
    return {
      noPanel: false,
      total: badges.length,
      minScale: scales.length ? Math.min(...scales) : null,
      floored: badges.filter((b) => b.scale <= 0.656).length,
      scaled: badges.filter((b) => b.scale < 0.995).length,
      minFont: fonts.length ? Math.min(...fonts) : null,
      maxBadgeW: badges.length ? Math.max(...badges.map((b) => b.badgeW)) : null,
      overflow: badges.filter((b) => (b.badgeOver ?? 0) > 1.5).length,
      exceedCard: badges.filter((b) => (b.exceedsCard ?? -999) > 0).length,
      worstScale: badges.filter((b) => b.scale < 0.995).slice(0, 6),
      worstOver: badges.filter((b) => (b.badgeOver ?? 0) > 1.5).slice(0, 6),
      maxBadge: badges.slice().sort((a, b) => b.badgeW - a.badgeW).slice(0, 3),
    };
  });

  out.push({ route: r.route, ...res });
  process.stderr.write(`done ${r.route}\n`);
}

await browser.close();

const nums = (key) =>
  out.map((r) => r[key]).filter((v) => typeof v === 'number' && Number.isFinite(v));

const agg = {
  routes: out.length,
  noPanelRoutes: out.filter((r) => r.noPanel).map((r) => r.route),
  routesWithBadge: out.filter((r) => r.total > 0).length,
  badges: out.reduce((a, r) => a + (r.total || 0), 0),
  floored: out.reduce((a, r) => a + (r.floored || 0), 0),
  scaled: out.reduce((a, r) => a + (r.scaled || 0), 0),
  overflow: out.reduce((a, r) => a + (r.overflow || 0), 0),
  exceedCard: out.reduce((a, r) => a + (r.exceedCard || 0), 0),
  minScale: nums('minScale').length ? Math.min(...nums('minScale')) : null,
  minFont: nums('minFont').length ? Math.min(...nums('minFont')) : null,
  maxBadgeW: nums('maxBadgeW').length ? Math.max(...nums('maxBadgeW')) : null,
};
console.log(JSON.stringify(agg, null, 1));
console.log('--- 缩放过的徽标（按缩放比升序，前 12 条） ---');
const worst = [];
for (const r of out) for (const b of r.worstScale || []) worst.push({ route: r.route, ...b });
worst.sort((a, b) => a.scale - b.scale).slice(0, 12).forEach((x) =>
  console.log(`  scale=${x.scale} 徽标${x.badgeW}px 内容${x.contentW}px 卡片${x.cardW}px 字号${x.fontSize} ${x.route} :: ${x.text}`),
);
console.log('--- 徽标溢出卡片 ---');
const ov = [];
for (const r of out) for (const b of r.worstOver || []) ov.push({ route: r.route, ...b });
if (!ov.length) console.log('  (无)');
ov.slice(0, 12).forEach((x) => console.log(`  溢出${x.badgeOver}px 徽标${x.badgeW}px 卡片${x.cardW}px ${x.route} :: ${x.text}`));
console.log('--- 最宽徽标 ---');
out.filter((r) => r.maxBadge).forEach((r) => r.maxBadge.forEach((b) => b.badgeW >= 40 && console.log(`  ${b.badgeW}px (${b.text}) ${r.route}`)));

if (OUT) fs.writeFileSync(OUT, JSON.stringify(out, null, 1), 'utf8');
