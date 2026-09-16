/**
 * 右屏公式渲染体检（运行时实测，开发服务器版）
 * 测量右屏容器与所有 KaTeX 公式的实际几何：
 *  - 公式横向溢出右屏可视区（被裁切）
 *  - 右屏水平滚动条
 *  - 触发兜底缩放的公式（transform scale < 1）及系数
 *  - 宿主 overflow 裁切子内容
 *  - LaTeX 渲染失败（源码直出）
 *  - 右屏分区是否挂载（用于判断数据是否被丢弃）
 */
import { chromium } from '@playwright/test';
import fs from 'node:fs';

const BASE = process.argv[2] || 'http://localhost:5199';
const ROUTES = JSON.parse(fs.readFileSync(process.argv[3], 'utf8'));
const OUT = process.argv[4];

const SECTIONS = [
  '数学临界与易错警示',
  '高考破题三步推演链',
  '核心定理与公式模型',
  '高考要点与通法总结',
  '记忆口诀与秒杀心法',
  '几何特征量与代数解',
];

const out = [];
const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1600, height: 900 } });
const page = await context.newPage();
const consoleErrors = [];
page.on('pageerror', (e) => consoleErrors.push(String(e.message).slice(0, 160)));

for (const r of ROUTES) {
  const rec = {
    route: r.route,
    name: r.name,
    ok: false,
    noPanel: false,
    panelWidth: null,
    contentWidth: null,
    horizontalScrollbar: false,
    katexCount: 0,
    sections: [],
    missingSections: [],
    overflows: [],
    clipped: [],
    scaled: [],
    rawLatex: [],
    minFontSize: null,
    worst: null,
    pageErrors: [],
  };
  try {
    consoleErrors.length = 0;
    await page.goto(`${BASE}/#${r.route}`, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(
      () => document.querySelectorAll('.katex').length > 0,
      { timeout: 25000 },
    );
    await page.waitForTimeout(900);

    const res = await page.evaluate((SECTIONS) => {
      const scrollables = [...document.querySelectorAll('div')].filter((d) => {
        const cs = getComputedStyle(d);
        return cs.overflowY === 'auto' || cs.overflowY === 'scroll';
      });
      // 右屏 = DOM 中最后一个可纵向滚动的侧栏
      const panel = scrollables[scrollables.length - 1];
      if (!panel) return { noPanel: true };

      const pr = panel.getBoundingClientRect();
      const cs = getComputedStyle(panel);
      const padL = parseFloat(cs.paddingLeft) || 0;
      const padR = parseFloat(cs.paddingRight) || 0;
      const sbw = panel.offsetWidth - panel.clientWidth;
      const contentLeft = pr.left + padL;
      const rightLimit = pr.right - padR - sbw;
      const contentWidth = rightLimit - contentLeft;

      const overflows = [];
      const clipped = [];
      const scaled = [];
      const fontSizes = [];
      let worst = null;

      const all = [...panel.querySelectorAll('*')];

      // A. transform 缩放
      for (const el of all) {
        const t = getComputedStyle(el).transform;
        if (!t || t === 'none') continue;
        const m = t.match(/matrix\(([^)]+)\)/);
        if (!m) continue;
        const sx = Number(m[1].split(',')[0]);
        if (sx < 0.995) {
          const r0 = el.getBoundingClientRect();
          const tx = /katex|Math/.test(el.className) || el.querySelector('.katex');
          if (tx) {
            scaled.push({
              scale: +sx.toFixed(3),
              visW: Math.round(r0.width),
              layoutW: el.scrollWidth,
              text: (el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 100),
            });
          }
        }
      }

      // B. KaTeX 右边界超限
      for (const k of panel.querySelectorAll('.katex')) {
        const kr = k.getBoundingClientRect();
        if (kr.width === 0) continue;
        fontSizes.push(parseFloat(getComputedStyle(k).fontSize) || 0);
        const over = Math.round(kr.right - rightLimit);
        if (over > 1.5) {
          overflows.push({
            over,
            width: Math.round(kr.width),
            text: (k.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 110),
          });
        }
      }

      // C. 宿主 overflow 裁切
      for (const el of all) {
        const c2 = getComputedStyle(el);
        if (c2.overflowX !== 'hidden' && c2.overflowX !== 'clip') continue;
        const ew = el.clientWidth;
        if (ew <= 0) continue;
        const delta = el.scrollWidth - ew;
        if (delta > 2) {
          clipped.push({
            delta,
            w: ew,
            text: (el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 80),
          });
        }
      }

      // D. LaTeX 源码直出
      const text = panel.textContent || '';
      /*
       * 可见文本：必须剔除 KaTeX 的隐藏可访问层 .katex-mathml。
       * 该层内的 <annotation> 保存着公式的原始 LaTeX 源码（供读屏/复制用），
       * 但它对用户不可见（clip: rect(1px,1px,1px,1px)）。
       * 若直接扫描 panel.textContent，每一条公式都会被误判为「源码直出」，
       * 从而产生全量假阳性——这是本脚本早先版本的既有缺陷，已修正。
       */
      const clone = panel.cloneNode(true);
      clone.querySelectorAll('.katex-mathml').forEach((n) => n.remove());
      const visibleText = clone.textContent || '';
      const raw = [];
      for (const p of ['\\frac', '\\dfrac', '\\sqrt', '\\begin{', '\\text{', '\\vec', '\\cdot', '\\Rightarrow', '\\perp', '\\parallel']) {
        if (visibleText.includes(p)) raw.push(p);
      }

      // E. 分区挂载情况
      const sections = SECTIONS.filter((s) => text.includes(s));

      // F. 最危险的一条：溢出量与缩放系数组合
      const worstOver = overflows.length
        ? overflows.reduce((a, b) => (a.over > b.over ? a : b))
        : null;
      const worstScale = scaled.length
        ? scaled.reduce((a, b) => (a.scale < b.scale ? a : b))
        : null;
      if (worstOver || worstScale) {
        worst = { over: worstOver, scale: worstScale };
      }

      return {
        panelWidth: Math.round(pr.width),
        contentWidth: Math.round(contentWidth),
        scrollWidth: panel.scrollWidth,
        clientWidth: panel.clientWidth,
        horizontalScrollbar: panel.scrollWidth - panel.clientWidth > 2,
        katexCount: panel.querySelectorAll('.katex').length,
        minFontSize: fontSizes.length ? +Math.min(...fontSizes).toFixed(2) : null,
        overflows: overflows.slice(0, 30),
        clipped: clipped.slice(0, 30),
        scaled: scaled.slice(0, 30),
        rawLatex: raw,
        sections,
        missingSections: SECTIONS.filter((s) => !text.includes(s)),
        worst,
      };
    }, SECTIONS);

    Object.assign(rec, res);
    rec.ok = !res.noPanel;
    rec.pageErrors = [...consoleErrors];
  } catch (e) {
    rec.errors = [String(e && e.message ? e.message : e).slice(0, 200)];
  }
  out.push(rec);
  process.stderr.write(`done ${r.route}\n`);
}

await browser.close();
fs.writeFileSync(OUT, JSON.stringify(out, null, 1), 'utf8');
