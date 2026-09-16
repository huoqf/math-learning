/**
 * 最终判定扫描：公式是否真的被裁切，以及触底缩放统计
 * 判据（只用可见几何，排除 .katex-mathml）：
 *  - 对每个 .katex：取最近 overflow-x ∈ {hidden, clip} 的祖先 A；
 *    若 .katex-html 的右边界 > A 的内容右边界，则该公式被 A 裁切（截断）。
 *  - 记录是否存在 transform scale 且等于硬底线（block 0.55 / inline 0.65）。
 */
import { chromium } from '@playwright/test';
import fs from 'node:fs';

const BASE = process.env.BASE || "http://localhost:5199";
const ROUTES = JSON.parse(fs.readFileSync(process.argv[2], "utf8"));
const OUT = process.argv[3];

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1600, height: 900 } });
const page = await context.newPage();
const out = [];

for (const r of ROUTES) {
  await page.goto(`${BASE}/#${r.route}`, { waitUntil: 'domcontentloaded' });
  await page
    .waitForFunction(() => document.querySelectorAll('.katex').length > 0, {
      timeout: 25000,
    })
    .catch(() => {});
  await page.waitForTimeout(800);

  const res = await page.evaluate(() => {
    const sc = [...document.querySelectorAll('div')].filter((d) => {
      const cs = getComputedStyle(d);
      return cs.overflowY === 'auto' || cs.overflowY === 'scroll';
    });
    const panel = sc[sc.length - 1];
    if (!panel) return { noPanel: true };
    const pcs = getComputedStyle(panel);
    const pr = panel.getBoundingClientRect();
    const panelRight =
      pr.right - (parseFloat(pcs.paddingRight) || 0) - (panel.offsetWidth - panel.clientWidth);

    const truncated = [];
    const floorHit = [];
    let maxOver = 0;

    for (const k of panel.querySelectorAll('.katex')) {
      const kr = k.getBoundingClientRect();
      if (kr.width === 0) continue;
      const isBlock = getComputedStyle(k).display === 'block';
      // 最近裁切祖先
      let a = k.parentElement;
      let A = null;
      while (a && a !== panel) {
        const acs = getComputedStyle(a);
        if (acs.overflowX === 'hidden' || acs.overflowX === 'clip') {
          A = a;
          break;
        }
        a = a.parentElement;
      }
      const acs = A ? getComputedStyle(A) : null;
      const ar = A ? A.getBoundingClientRect() : null;
      const aRight = ar
        ? ar.right - (parseFloat(acs.paddingRight) || 0) - (A.offsetWidth - A.clientWidth)
        : panelRight;
      // 该公式可见内容的真实右边界（用 .katex-html，它是渲染后的可见层）
      const html = k.querySelector('.katex-html');
      const contentRight = html ? html.getBoundingClientRect().right : kr.right;
      const over = Math.round(contentRight - aRight);
      if (over > 1.5) {
        maxOver = Math.max(maxOver, over);
        truncated.push({
          over,
          mode: isBlock ? 'block' : 'inline',
          containerW: A ? A.clientWidth : panel.clientWidth,
          contentW: Math.round(html ? html.getBoundingClientRect().width : kr.width),
          ancestor: A ? String(A.className).slice(0, 50) : 'panel',
          text: (k.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 120),
        });
      }
      // 触底缩放
      const inner = k.closest('[style*="transform"]');
      const hostInner = k.parentElement ? k.parentElement.parentElement : null;
      const cand = hostInner || inner;
      if (cand) {
        const t = getComputedStyle(cand).transform;
        const m = t && t !== 'none' ? t.match(/matrix\(([^)]+)\)/) : null;
        if (m) {
          const sx = Number(m[1].split(',')[0]);
          const floor = isBlock ? 0.55 : 0.65;
          if (sx <= floor + 0.006) {
            floorHit.push({
              scale: +sx.toFixed(3),
              mode: isBlock ? 'block' : 'inline',
              containerW: cand.clientWidth,
              contentW: cand.scrollWidth,
              need: +(cand.clientWidth / cand.scrollWidth).toFixed(3),
              text: (k.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 100),
            });
          }
        }
      }
    }

    // 头部徽标
    let badge = null;
    const badgeEl = [...panel.querySelectorAll('span')].find((s) => {
      const rr = s.getBoundingClientRect();
      return (
        rr.top < pr.top + 60 &&
        /高考|人教|新高考|拓展|核心|压轴|必修|选必|选择性/.test(s.textContent || '')
      );
    });
    if (badgeEl) {
      const br = badgeEl.getBoundingClientRect();
      badge = {
        w: Math.round(br.width),
        over: Math.round(br.right - panelRight),
        text: (badgeEl.textContent || '').trim().slice(0, 60),
      };
    }

    return {
      panelScroll: panel.scrollWidth - panel.clientWidth,
      truncatedCount: truncated.length,
      maxOver,
      truncated: truncated.slice(0, 8),
      floorCount: floorHit.length,
      floorHit: floorHit.slice(0, 8),
      badge,
    };
  });
  out.push({ route: r.route, name: r.name, ...res });
  process.stderr.write(`done ${r.route}\n`);
}

await browser.close();
fs.writeFileSync(OUT, JSON.stringify(out, null, 1), 'utf8');
