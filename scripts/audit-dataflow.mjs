/**
 * 右屏数据链路审计（静态）
 * 1) animId -> builder 函数 -> builder 模块 的映射
 * 2) builder 模块 return 的字段集合
 * 3) 页面 MathPanel 实际透传的字段集合
 * 输出：每个页面的「丢失字段」清单
 */
import fs from "node:fs";
import path from "node:path";

const read = (p) => fs.readFileSync(p, "utf8");
const rel = (p) => p.replace(/\\/g, "/").replace(/^src\//, "");

// ---------- 1. mathQuantities.ts: animId -> builderFn ----------
const mq = read("src/data/mathQuantities.ts");
const builderImports = {}; // fnName -> module spec
for (const m of mq.matchAll(
  /import\s*\{([\s\S]*?)\}\s*from\s*"(\.[^"]+)"/g,
)) {
  const names = m[1]
    .split(",")
    .map((s) => s.trim().split(/\s+as\s+/)[0].trim())
    .filter(Boolean);
  for (const n of names) builderImports[n] = m[2];
}
const animToFn = {}; // animId -> builder fn name
{
  const body = mq.slice(mq.indexOf("switch (animId)"));
  const cases = [...body.matchAll(/case\s+"([^"]+)":|return\s+([A-Za-z_$][\w$]*)\(/g)];
  let pending = [];
  for (const c of cases) {
    if (c[1]) pending.push(c[1]);
    else {
      const fn = c[2];
      if (fn && fn.startsWith("build")) {
        for (const a of pending) animToFn[a] = fn;
      }
      pending = [];
    }
  }
}
// 别名（同函数多 animId 已在上面处理）

// ---------- 2. builder 模块 return 字段 ----------
function modulePath(spec) {
  const base = path.join("src/data", spec.replace(/^\.\//, ""));
  for (const cand of [`${base}.ts`, `${base}/index.ts`, path.join(base, "index.ts")]) {
    if (fs.existsSync(cand)) return cand;
  }
  return null;
}

function extractReturnBlocks(src) {
  const blocks = [];
  const re = /\breturn\s*\{/g;
  let m;
  while ((m = re.exec(src))) {
    let depth = 1; // 起始 '{' 已被正则消耗
    const start = m.index + m[0].length;
    for (let i = start; i < src.length; i++) {
      if (src[i] === "{") depth++;
      else if (src[i] === "}") {
        depth--;
        if (depth === 0) {
          blocks.push(src.slice(start, i));
          break;
        }
      }
    }
  }
  return blocks;
}

/** 取 return 块的顶层 key（含 `x,` 与 `x: v` 两种写法） */
function topLevelKeys(block) {
  const keys = new Set();
  let depth = 0;
  let cur = "";
  const flush = () => {
    const t = cur.trim();
    cur = "";
    if (!t) return;
    const km = t.match(/^([A-Za-z_$][\w$]*)\s*(,|:|$)/);
    if (km) keys.add(km[1]);
  };
  for (let i = 0; i < block.length; i++) {
    const c = block[i];
    if ("{[(".includes(c)) depth++;
    else if ("}])".includes(c)) depth--;
    if (c === "," && depth === 0) flush();
    else cur += c;
  }
  flush();
  return keys;
}

/** 只取该文件里为目标函数体服务的 return 块；退化为全文件并集 */
function returnKeysOfFile(file) {
  const src = read(file);
  const keys = new Set();
  for (const b of extractReturnBlocks(src)) {
    // 只保留包含 MathPanelData 典型字段的块，排除内部小对象 return
    if (!/\bquantities\b|\btheorems\b|\breasoningSteps\b/.test(b)) continue;
    for (const k of topLevelKeys(b)) keys.add(k);
  }
  return keys;
}

const builderKeys = {}; // fnName -> Set
for (const [fn, spec] of Object.entries(builderImports)) {
  let mp = modulePath(spec);
  if (!mp) continue;
  // 解析 barrel 再导出
  const barrelSrc = read(mp);
  if (!new RegExp(`function\\s+${fn}\\b`).test(barrelSrc)) {
    const re = new RegExp(`export\\s*\\{\\s*${fn}\\s*\\}\\s*from\\s*"([^"]+)"`);
    const bm = barrelSrc.match(re);
    if (bm) {
      const dir = path.dirname(mp);
      const target = path.join(dir, `${bm[1].replace(/^\.\//, "")}.ts`);
      if (fs.existsSync(target)) mp = target;
    }
  }
  try {
    builderKeys[fn] = returnKeysOfFile(mp);
  } catch {
    builderKeys[fn] = new Set();
  }
}

// ---------- 3. 页面 MathPanel 透传字段 ----------
const FEATURE_FILES = [];
(function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p);
    else if (e.name.endsWith(".tsx")) FEATURE_FILES.push(p);
  }
})("src/features");
FEATURE_FILES.push("src/components/Scaffold/InteractiveTopicScaffold.tsx");

const PANEL_PROPS = [
  "quantities",
  "theorems",
  "gaokaoPoints",
  "warnings",
  "reasoningSteps",
  "examAnchor",
  "mnemonic",
  "title",
];

function readBraced(s, openIdx) {
  let depth = 0;
  for (let i = openIdx; i < s.length; i++) {
    if (s[i] === "{") depth++;
    else if (s[i] === "}") {
      depth--;
      if (depth === 0) return s.slice(openIdx + 1, i);
    }
  }
  return "";
}

const report = [];
for (const f of FEATURE_FILES) {
  const src = read(f);
  if (!/<MathPanel/.test(src)) continue;
  const animIds = [...src.matchAll(/buildMathQuantities\(\s*"([^"]+)"/g)].map((m) => m[1]);
  const re = /\bright=\{/g;
  let m;
  const items = [];
  while ((m = re.exec(src))) {
    const inner = readBraced(src, m.index + m[0].length - 1).trim();
    if (!/<MathPanel/.test(inner)) continue;
    const isSpread = /\{\.\.\.[A-Za-z_$][\w$]*/.test(inner);
    const passed = isSpread
      ? PANEL_PROPS.slice()
      : PANEL_PROPS.filter((p) => new RegExp(`(^|\\s)${p}\\s*=`).test(inner));
    // 数据变量名
    const dataVar = (inner.match(/\{\.\.\.([A-Za-z_$][\w$]*)/) || [])[1] || null;
    items.push({ isSpread, passed, dataVar, raw: inner.replace(/\s+/g, " ") });
  }
  if (!items.length) continue;

  const builderFields = new Set();
  for (const a of animIds) {
    const fn = animToFn[a];
    if (fn && builderKeys[fn]) for (const k of builderKeys[fn]) builderFields.add(k);
  }

  const lost = [];
  for (const it of items) {
    if (it.isSpread) continue;
    for (const k of builderFields) {
      if (!PANEL_PROPS.includes(k)) continue;
      if (!it.passed.includes(k)) lost.push(k);
    }
  }
  report.push({
    file: rel(f),
    animIds,
    builders: animIds.map((a) => animToFn[a]).filter(Boolean),
    wiring: items.map((i) => (i.isSpread ? "SPREAD" : "EXPLICIT")),
    passed: items.map((i) => i.passed),
    builderFields: [...builderFields].sort(),
    lostFields: [...new Set(lost)].sort(),
  });
}

report.sort((a, b) => b.lostFields.length - a.lostFields.length);
fs.writeFileSync(
  "scripts/dataflow-report.json",
  JSON.stringify({ animToFn, report }, null, 1),
  "utf8",
);
console.log(JSON.stringify({ animToFn, report }, null, 1));
