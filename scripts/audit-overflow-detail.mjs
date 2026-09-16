/**
 * 右屏"可见越界"精确定位
 * 只用 getBoundingClientRect（含 transform 后的视觉几何），
 * 找出真正越过右屏可视右边界的元素，并区分：
 *  - katex：公式被截断
 *  - text：非公式文本（如 examAnchor 徽标、标题）被截断
 */
import { chromium } from '@playwright/test';
import fs from 'node:fs';

const BASE = 'http://localhost:5199';
const ROUTES = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
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
  await page.waitForTimeout(700);

  const res = await page.evaluate(() => {
    const scrollables = [...document.querySelectorAll('div')].filter((d) => {
      const cs = getComputedStyle(d);
      return cs.overflowY === 'auto' || cs.overflowY === 'scroll';
    });
    const panel = scrollables[scrollables.length - 1];
    if (!panel) return { noPanel: true };
    const cs = getComputedStyle(panel);
    const pr = panel.getBoundingClientRect();
    const rightLimit =
      pr.right -
      (parseFloat(cs.paddingRight) || 0) -
      (panel.offsetWidth - panel.clientWidth);
    const leftLimit = pr.left + (parseFloat(cs.paddingLeft) || 0);

    const bad = [];
    for (const el of panel.querySelectorAll('*')) {
      // 排除 KaTeX 视觉隐藏的 MathML 子树（clip 到 1px，不参与可见排版）
      if (el.closest('.katex-mathml')) continue;
      const rect = el.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) continue;
      const over = rect.right - rightLimit;
      if (over <= 1.5) continue;
      const isKatex = el.classList.contains('katex');
      const txt = (el.textContent || '').replace(/\s+/g, ' ').trim();
      // 最近的裁切祖先（overflow-x hidden/clip）
      let clippedBy = null;
      let a = el.parentElement;
      while (a && a !== panel) {
        const acs = getComputedStyle(a);
        if (acs.overflowX === 'hidden' || acs.overflowX === 'clip') {
          clippedBy = {
            cls: String(a.className).slice(0, 46),
            right: Math.round(a.getBoundingClientRect().right),
            scrollW: a.scrollWidth,
            clientW: a.clientWidth,
          };
          break;
        }
        a = a.parentElement;
      }
      const rect2 = el.getBoundingClientRect();
      bad.push({
        tag: el.tagName,
        isKatex,
        over: Math.round(over),
        w: Math.round(rect2.width),
        left: Math.round(rect2.left - leftLimit),
        cls: String(el.className).slice(0, 70),
        clippedBy,
        text: txt.slice(0, 80),
      });
    }
    // 去重：同文本同 over 的只留一条
    const seen = new Set();
    const uniq = [];
    for (const b of bad.sort((a, b) => b.over - a.over)) {
      const k = b.text + "|" + b.over;
      if (seen.has(k)) continue;
      seen.add(k);
      uniq.push(b);
    }

    // 头部徽标（examAnchor）单独测量
    let badge = null;
    const badgeEl = [...panel.querySelectorAll('span')].find((s) => {
      const rect = s.getBoundingClientRect();
      return (
        rect.top < pr.top + 60 &&
        /高考|人教|新高考|拓展|核心|压轴|必修|选必|选择性/.test(s.textContent || '')
      );
    });
    if (badgeEl) {
      const br = badgeEl.getBoundingClientRect();
      badge = {
        w: Math.round(br.width),
        right: Math.round(br.right),
        over: Math.round(br.right - rightLimit),
        text: (badgeEl.textContent || '').trim().slice(0, 60),
      };
    }

    return {
      rightLimit: Math.round(rightLimit),
      contentWidth: Math.round(rightLimit - leftLimit),
      scrollOverflow: panel.scrollWidth - panel.clientWidth,
      count: uniq.length,
      items: uniq.slice(0, 12),
      badge,
    };
  });

  out.push({ route: r.route, name: r.name, ...res });
  process.stderr.write(`done ${r.route}\n`);
}

await browser.close();
fs.writeFileSync(OUT, JSON.stringify(out, null, 1), 'utf8');
