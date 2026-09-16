/**
 * 侦测全库 <MathPanel ... /> 调用点形态（只读，不改代码）。
 * 输出：每个调用点的文件、行号、逐项属性名、是否已是整包透传。
 */
import fs from "node:fs";
import path from "node:path";

const files = [];
(function walk(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) walk(p);
    else if (/\.tsx$/.test(e.name) && !/\.test\./.test(e.name)) files.push(p);
  }
})("src");

/** 返回开标签（含 `>` 或 `/>`）文本 */
function openTag(src, start) {
  let depth = 0;
  let str = null;
  for (let i = start; i < src.length; i++) {
    const c = src[i];
    if (str) {
      if (c === "\\") { i++; continue; }
      if (c === str) str = null;
      continue;
    }
    if (c === '"' || c === "'" || c === "`") { str = c; continue; }
    if (c === "{") depth++;
    else if (c === "}") depth--;
    else if (c === ">" && depth === 0) return src.slice(start, i + 1);
  }
  return src.slice(start);
}

/** 取顶层属性名（忽略嵌套花括号内的 `x=`） */
function topProps(open) {
  const names = [];
  let depth = 0;
  let str = null;
  let buf = "";
  for (let i = 0; i < open.length; i++) {
    const c = open[i];
    if (str) {
      if (c === "\\") { i++; continue; }
      if (c === str) str = null;
      continue;
    }
    if (c === '"' || c === "'" || c === "`") { str = c; continue; }
    if (c === "{") { if (depth === 0) { names.push(...extractNames(buf)); buf = ""; } depth++; continue; }
    if (c === "}") { depth--; continue; }
    if (depth === 0) buf += c;
  }
  names.push(...extractNames(buf));
  return names;
}

function extractNames(s) {
  const out = [];
  const re = /(?:^|[\s(<{])([A-Za-z_$][\w$]*)\s*=/g;
  let m;
  while ((m = re.exec(s))) out.push(m[1]);
  return out;
}

const rows = [];
for (const f of files) {
  const src = fs.readFileSync(f, "utf8");
  const re = /<MathPanel\b/g;
  let m;
  while ((m = re.exec(src))) {
    const open = openTag(src, m.index);
    const line = src.slice(0, m.index).split("\n").length;
    const spread = /\.\.\.\s*[A-Za-z_$][\w$]*/.test(open);
    rows.push({ file: f, line, spread, names: [...new Set(topProps(open))] });
  }
}

fs.writeFileSync("scripts/panel-usage.json", JSON.stringify(rows, null, 1), "utf8");

const enumPages = rows.filter((r) => !r.spread);
console.log("MathPanel 调用点总数:", rows.length);
console.log("已整包透传:", rows.length - enumPages.length);
console.log("逐项枚举:", enumPages.length);
console.log("");

const known = new Set([
  "quantities", "theorems", "gaokaoPoints", "warnings",
  "reasoningSteps", "examAnchor", "mnemonic", "title",
]);
const freq = {};
const odd = [];
for (const r of enumPages) {
  for (const n of r.names) {
    freq[n] = (freq[n] || 0) + 1;
    if (!known.has(n)) odd.push(r.file + ":" + r.line + "  " + n);
  }
}
console.log("枚举页属性名频次:");
Object.entries(freq).sort((a, b) => b[1] - a[1]).forEach(([k, v]) => console.log("   " + k + ": " + v));
console.log("");
console.log("非白名单属性（需人工确认，共 " + odd.length + "）:");
odd.forEach((o) => console.log("   " + o));
