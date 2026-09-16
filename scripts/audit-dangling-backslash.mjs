/**
 * 精确复检：findOptimalSplit 的标点兜底分支是否会把 `\;` 的分号当作断点，
 * 从而在左行留下孤立反斜杠（非法 LaTeX）。
 */
import fs from "node:fs";
import {
  findOptimalSplit,
  extractLatexLines,
  splitAtTopLevelSpacing,
  getEffectiveLatexLength,
} from "../src/components/UI/latexUtils.ts";

const files = [];
(function w(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = d + "/" + e.name;
    if (e.isDirectory()) w(p);
    else if (/\.tsx?$/.test(e.name) && !/\.test\./.test(e.name)) files.push(p);
  }
})("src");

/** 抓取 key: '...' / "..." / `...`（模板串内插值保留占位） */
function grab(src) {
  const out = [];
  const re = /\b(latex|latexBlocks|symbol|labelFormula)\s*:\s*/g;
  let m;
  while ((m = re.exec(src))) {
    let i = m.index + m[0].length;
    while (/\s/.test(src[i])) i++;
    const q = src[i];
    if (q !== '"' && q !== "'" && q !== "`") continue;
    let j = i + 1;
    let s = "";
    while (j < src.length) {
      const c = src[j];
      if (q === "`" && c === "$" && src[j + 1] === "{") {
        // 模板插值：跳过，用常量占位
        let d2 = 1;
        j += 2;
        while (j < src.length && d2 > 0) {
          if (src[j] === "{") d2++;
          else if (src[j] === "}") d2--;
          j++;
        }
        s += "K";
        continue;
      }
      if (c === "\\") {
        // 必须真正反转义：源码中的 `\\` 表示 1 个反斜杠，
        // 先前直接原样拷贝会让语料变成「双反斜杠」，产生大量假阳性。
        const nx = src[j + 1];
        if (nx === "\\") { s += "\\"; j += 2; continue; }
        if (nx === "n") { s += "\n"; j += 2; continue; }
        if (nx === "t") { s += "\t"; j += 2; continue; }
        if (nx === "`") { s += "`"; j += 2; continue; }
        if (nx === "$") { s += "$"; j += 2; continue; }
        s += nx ?? "";
        j += 2;
        continue;
      }
      if (c === q) break;
      s += c;
      j++;
    }
    re.lastIndex = j + 1;
    out.push(s);
  }
  return out;
}

const corpus = [];
for (const f of files) for (const s of grab(fs.readFileSync(f, "utf8"))) {
  if (s.length > 10) corpus.push({ file: f, latex: s });
}

const danglingSplits = [];
const iterated = [];

for (const c of corpus) {
  // 逐层模拟 KatexFormula 的拆行（与组件一致）
  let lines = extractLatexLines(c.latex) ?? [c.latex];
  let guard = 0;
  while (guard++ < 12) {
    const ws = lines.map(getEffectiveLatexLength);
    const mx = Math.max(...ws);
    if (mx <= 30) break;
    const idx = ws.indexOf(mx);
    const target = lines[idx];
    const sp = splitAtTopLevelSpacing(target);
    const f = findOptimalSplit(target);
    if (f && f[0].endsWith("\\") && !f[0].endsWith("\\\\")) {
      danglingSplits.push({ file: c.file, leftTail: f[0].slice(-40), rightHead: f[1].slice(0, 20), spacingAvailable: Boolean(sp) });
    }
    if (!f) break;
    if (lines.length >= 6) break;
    const n = [...lines];
    n.splice(idx, 1, f[0], f[1]);
    lines = n;
  }
  iterated.push(c.file);
}

console.log("语料条数:", corpus.length);
console.log(
  "拆行后左行残留孤立反斜杠（KaTeX 会报错/渲染异常）的公式数:",
  danglingSplits.length,
);
danglingSplits.slice(0, 15).forEach((d) =>
  console.log(
    `   [${d.file}] 左行尾 ...${JSON.stringify(d.leftTail)}  右行首 ${JSON.stringify(d.rightHead)}  (spacing可用=${d.spacingAvailable})`,
  ),
);
