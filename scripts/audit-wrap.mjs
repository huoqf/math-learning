/**
 * 拆行算法语料压力测试（静态）
 * 从全库构建器中抽取 LaTeX 语料，模拟 KatexFormula 的拆行决策，
 * 找出：无法拆分的超宽公式 / 拆到上限仍过宽的行 / 拆行后行的语义形态。
 */
import fs from "node:fs";
import path from "node:path";
import {
  extractLatexLines,
  findOptimalSplit,
  getEffectiveLatexLength,
  normalizeFractionRowSpacing,
} from "../src/components/UI/latexUtils.ts";

const files = [];
(function walk(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) walk(p);
    else if (/\.tsx?$/.test(e.name) && !/\.test\./.test(e.name)) files.push(p);
  }
})("src");

/** 抽取形如 latex: "..."/latex: `...`/symbol: ... 的字符串常量 */
function extractLatex(src) {
  const out = [];
  const keyRe =
    /\b(latex|latexBlocks|symbol|labelFormula|descriptionFormula|value)\s*:\s*/g;
  let m;
  while ((m = keyRe.exec(src))) {
    let i = m.index + m[0].length;
    // 跳过空白
    while (/\s/.test(src[i])) i++;
    const q = src[i];
    if (q === '"' || q === "'") {
      let j = i + 1;
      let s = "";
      while (j < src.length && src[j] !== q) {
        if (src[j] === "\\") {
          s += src[j] + src[j + 1];
          j += 2;
          continue;
        }
        s += src[j++];
      }
      out.push({ raw: s, quote: q, line: src.slice(0, i).split("\n").length });
      keyRe.lastIndex = j + 1;
    } else if (q === "`") {
      let j = i + 1;
      let s = "";
      let depth = 0;
      while (j < src.length) {
        if (src[j] === "$" && src[j + 1] === "{") {
          depth++;
          j += 2;
          continue;
        }
        if (src[j] === "}" && depth > 0) {
          depth--;
          j++;
          continue;
        }
        if (src[j] === "`" && depth === 0) break;
        s += src[j++];
      }
      out.push({ raw: s, quote: q, line: src.slice(0, i).split("\n").length });
      keyRe.lastIndex = j + 1;
    }
  }
  return out;
}

const corpus = [];
for (const f of files) {
  const src = fs.readFileSync(f, "utf8");
  for (const item of extractLatex(src)) {
    // 反引号内可能含 ${} 插值，先粗筛是否像 LaTeX
    const s = item.raw;
    if (!/\\[a-zA-Z]|[_^]\{|=|\\frac/.test(s)) continue;
    if (s.length < 6) continue;
    corpus.push({ file: f.replace(/\\/g, "/"), line: item.line, latex: s });
  }
}

const results = [];
for (const c of corpus) {
  // 排除含未解析插值的
  if (/\$\{/.test(c.latex)) continue;
  const formatted = normalizeFractionRowSpacing(c.latex);
  let lines = extractLatexLines(formatted) ?? [formatted];
  const trace = [];
  let guard = 0;
  let unsplittableWide = null;
  while (guard++ < 12) {
    const widths = lines.map((l) => getEffectiveLatexLength(l));
    const maxW = Math.max(...widths);
    if (maxW <= 30) break;
    const idx = widths.indexOf(maxW);
    const further = findOptimalSplit(lines[idx]);
    if (!further) {
      if (maxW > 34) unsplittableWide = { width: maxW, line: lines[idx] };
      break;
    }
    if (lines.length >= 6) {
      trace.push("hit-line-cap");
      break;
    }
    const next = [...lines];
    next.splice(idx, 1, further[0], further[1]);
    lines = next;
  }
  const finalWidths = lines.map((l) => getEffectiveLatexLength(l));
  results.push({
    file: c.file,
    line: c.line,
    len: getEffectiveLatexLength(formatted),
    lineCount: lines.length,
    maxLineWidth: Math.max(...finalWidths),
    unsplittableWide,
    trace,
    preview: c.latex.replace(/\s+/g, " ").slice(0, 130),
    finalLines: lines.map((l) => l.replace(/\s+/g, " ").slice(0, 110)),
  });
}

results.sort((a, b) => b.maxLineWidth - a.maxLineWidth);
fs.writeFileSync(
  "scripts/wrap-report.json",
  JSON.stringify({ total: results.length, results }, null, 1),
  "utf8",
);

const wide = results.filter((r) => r.maxLineWidth > 34);
const unsplittable = results.filter((r) => r.unsplittableWide);
console.log("语料条数:", results.length);
console.log("拆行后单行有效宽度 > 34 的条数:", wide.length);
console.log("无法拆分的超宽公式条数:", unsplittable.length);
console.log("\n—— 无法拆分的超宽公式 ——");
for (const r of unsplittable.slice(0, 25))
  console.log(
    `[w=${r.maxLineWidth}] ${r.file}:${r.line}\n     ${r.preview}`,
  );
console.log("\n—— 拆行后仍最宽的前 20 条 ——");
for (const r of wide.slice(0, 20))
  console.log(
    `[w=${r.maxLineWidth} lines=${r.lineCount} cap=${r.trace.join("|")}] ${r.file}:${r.line}\n     ${r.preview}`,
  );
