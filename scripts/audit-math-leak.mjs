/**
 * 全量扫描：右屏中「以纯文本渲染、却含 $...$ 或裸 LaTeX 命令」的可见文本节点。
 * 这类节点的共同特征是：自身没有 .katex 子节点，但文本里残留数学标记 → 学生看到字面 $ 与反斜杠命令。
 */
import { chromium } from "@playwright/test";
import fs from "node:fs";

const BASE = process.argv[2] || "http://localhost:5201";
const ROUTES = JSON.parse(fs.readFileSync(process.argv[3], "utf8"));
const OUT = process.argv[4];

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1600, height: 900 } });
const page = await ctx.newPage();
const out = [];

const LATEX_CMD =
  /\\(frac|dfrac|tfrac|sqrt|sum|prod|int|infty|cdot|times|div|pm|mp|le|ge|ne|approx|triangle|angle|vec|bar|hat|Delta|lambda|alpha|beta|gamma|theta|mu|sigma|pi|omega|arg|min|max|lim|ln|log|sin|cos|tan|color|text|begin|left|right|quad|displaystyle)/;

for (const r of ROUTES) {
  await page.goto(`${BASE}/#${r.route}`, { waitUntil: "domcontentloaded" });
  await page
    .waitForFunction(() => document.querySelectorAll(".katex").length > 0, { timeout: 25000 })
    .catch(() => {});
  await page.waitForTimeout(700);

  const res = await page.evaluate(
    ({ LATEX_SRC }) => {
      const cmd = new RegExp(LATEX_SRC);
      const sc = [...document.querySelectorAll("div")].filter((d) => {
        const c = getComputedStyle(d);
        return c.overflowY === "auto" || c.overflowY === "scroll";
      });
      const panel = sc[sc.length - 1];
      if (!panel) return { noPanel: true };

      const hits = [];
      for (const el of panel.querySelectorAll("*")) {
        // 排除 KaTeX 无障碍层：其 <annotation> 内就是原始 LaTeX 源码，属正常结构而非泄漏
        if (el.closest(".katex-mathml") || el.querySelector(".katex-mathml")) continue;
        const own = [...el.childNodes]
          .filter((n) => n.nodeType === 3)
          .map((n) => n.nodeValue || "")
          .join("")
          .replace(/\s+/g, " ")
          .trim();
        if (!own) continue;
        const hasDollar = /\$/.test(own);
        const hasCmd = cmd.test(own);
        if (!hasDollar && !hasCmd) continue;
        hits.push({
          tag: el.tagName,
          cls: String(el.className).slice(0, 70),
          reason: hasDollar && hasCmd ? "both" : hasDollar ? "dollar" : "cmd",
          text: own.slice(0, 120),
        });
      }
      return { hits };
    },
    { LATEX_SRC: LATEX_CMD.source },
  );

  out.push({ route: r.route, name: r.name, hits: res.hits || [], noPanel: !!res.noPanel });
  process.stderr.write(`done ${r.route} hits=${(res.hits || []).length}\n`);
}

await browser.close();
fs.writeFileSync(OUT, JSON.stringify(out, null, 1), "utf8");
