/**
 * 亚像素级公式裁切 + 触底缩放探针（本次核对专用）
 *
 * 与 audit-truncation.mjs 的差异（关键）：
 *  - 裁切阈值从 1.5px 降到 0.2px，并保留两位小数。
 *    原因：2px 整数舍入容差引入的残留溢出量级恰好在 0~2px，
 *    1.5px 阈值会把这个代价整体漏掉，无法判定「是否引入新缺陷」。
 *  - 按宿主上下文分类：badge（span.font-mono 内）/ value（span.font-bold 内）/ other，
 *    这样一次扫描即可同时验证「徽标免缩放」与「极短 value 免缩放」两条改动。
 *
 * 用法：node scripts/audit-clip-strict.mjs scripts/routes.json scripts/clip-A.json
 */
import { chromium } from '@playwright/test';
import fs from 'node:fs';

const BASE = process.env.BASE || 'http://localhost:5199';
const ROUTES = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const OUT = process.argv[3];

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1600, height: 900 } });
const page = await context.newPage();
const out = [];

for (const r of ROUTES) {
  await page.goto(`${BASE}/#${r.route}`, { waitUntil: 'domcontentloaded' });
  await page
    .waitForFunction(() => document.querySelectorAll('.katex').length > 0, { timeout: 25000 })
    .catch(() => {});

  // —— 确定性等待：.katex 数量连续两次一致 + 字体就绪 + 稳定 400ms，才允许测量。
  //    否则面板仍在挂载中时会量到未缩放的中间态，产生 24~80px 的假溢出（已实测复现过）。
  let prev = -1;
  let stable = 0;
  for (let i = 0; i < 25 && stable < 2; i++) {
    const c = await page.evaluate(() => document.querySelectorAll('.katex').length);
    if (c === prev && c > 0) stable += 1;
    else stable = 0;
    prev = c;
    await page.waitForTimeout(200);
  }
  await page.evaluate(() => (document.fonts ? document.fonts.ready : null)).catch(() => {});
  await page.waitForTimeout(400);

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

    const box = {
      badge: { n: 0, scaled: 0, floor: 0, minScale: 1, clipped: 0, maxOver: 0 },
      value: { n: 0, scaled: 0, floor: 0, minScale: 1, clipped: 0, maxOver: 0 },
      other: { n: 0, scaled: 0, floor: 0, minScale: 1, clipped: 0, maxOver: 0 },
    };
    const overList = [];
    const floorList = [];

    for (const k of panel.querySelectorAll('.katex')) {
      const kr = k.getBoundingClientRect();
      if (kr.width === 0) continue;
      const isBlock = getComputedStyle(k).display === 'block';
      const html = k.querySelector('.katex-html');
      const hr = html ? html.getBoundingClientRect() : kr;

      // —— 分类：向上 6 层找 font-mono（徽标）/ font-bold（value 行）
      let kind = 'other';
      let p = k.parentElement;
      for (let i = 0; i < 6 && p && p !== panel; i++, p = p.parentElement) {
        const c = String(p.className || '');
        if (/font-mono/.test(c)) {
          kind = 'badge';
          break;
        }
        if (/font-bold/.test(c)) {
          kind = 'value';
          break;
        }
      }

      // —— 缩放比：向上 4 层找带 transform 的宿主
      let scale = 1;
      let cand = null;
      let q = k.parentElement;
      for (let i = 0; i < 4 && q && q !== panel; i++, q = q.parentElement) {
        const t = getComputedStyle(q).transform;
        if (t && t !== 'none') {
          const m = t.match(/matrix\(([^)]+)\)/);
          if (m) {
            scale = Number(m[1].split(',')[0]);
            cand = q;
          }
          break;
        }
      }

      const floor = isBlock ? 0.55 : 0.65;
      const b = box[kind];
      b.n += 1;
      if (scale < 1) {
        b.scaled += 1;
        b.minScale = Math.min(b.minScale, +scale.toFixed(3));
      }
      if (scale <= floor + 0.006) {
        b.floor += 1;
        floorList.push({
          kind,
          scale: +scale.toFixed(3),
          mode: isBlock ? 'block' : 'inline',
          hostW: cand ? cand.clientWidth : null,
          hostScrollW: cand ? cand.scrollWidth : null,
          text: (html ? html.textContent : '').replace(/\s+/g, ' ').trim().slice(0, 60),
        });
      }

      // —— 亚像素裁切：最近裁切祖先的内容右边界 vs 可见内容右边界
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
      const ar = A ? A.getBoundingClientRect() : null;
      const acs2 = A ? getComputedStyle(A) : null;
      const aRight = ar
        ? ar.right - (parseFloat(acs2.paddingRight) || 0) - (A.offsetWidth - A.clientWidth)
        : panelRight;
      const over = +(hr.right - aRight).toFixed(2);
      b.maxOver = Math.max(b.maxOver, over);
      if (over > 0.2) {
        b.clipped += 1;
        overList.push({
          kind,
          over,
          mode: isBlock ? 'block' : 'inline',
          scale: +scale.toFixed(3),
          ancW: A ? A.clientWidth : panel.clientWidth,
          contentW: +hr.width.toFixed(2),
          anc: A ? String(A.className).slice(0, 44) : 'panel',
          text: (html ? html.textContent : '').replace(/\s+/g, ' ').trim().slice(0, 50),
        });
      }
    }

    overList.sort((x, y) => y.over - x.over);
    return {
      katexCount: panel.querySelectorAll('.katex').length,
      panelScroll: panel.scrollWidth - panel.clientWidth,
      box,
      overList: overList.slice(0, 25),
      overCount: overList.length,
      floorList: floorList.slice(0, 25),
      floorCount: floorList.length,
    };
  });

  out.push({ route: r.route, name: r.name, ...res });
  process.stderr.write(`done ${r.route}\n`);
}

await browser.close();
fs.writeFileSync(OUT, JSON.stringify(out, null, 1), 'utf8');
