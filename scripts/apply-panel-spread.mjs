/**
 * G 步骤：把逐项枚举的 <MathPanel ... /> 统一改写为整包透传 {..VAR}，
 * 从结构上消灭「新增字段时漏传导致整个教学分区不渲染」的缺陷。
 *
 * 安全前置校验（任一不满足即跳过该调用点，绝不改写）：
 *   1. 每个非 title 属性的值必须恰好是 {<同一变量>.<同名属性>}
 *   2. 变量名在全库保持一致（mathData / mathPanelData）
 *   3. 已存在 {..mathData} 的调用点不动
 *
 * 用法：
 *   node scripts/apply-panel-spread.mjs          # 干跑，只打印
 *   node scripts/apply-panel-spread.mjs --write  # 实际写入
 */
import fs from "node:fs";
import path from "node:path";

const WRITE = process.argv.includes("--write");
const files = [];
(function walk(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) walk(p);
    else if (/\.tsx$/.test(e.name) && !/\.test\./.test(e.name)) files.push(p);
  }
})("src");

/** 返回开标签（含 `>` 或 `/>`）在 src 中的 [start, end) */
function openTagRange(src, start) {
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
    else if (c === ">" && depth === 0) return [start, i + 1];
  }
  return [start, src.length];
}

/** 解析开标签中的属性及其绝对区间 */
function parseProps(src, tagStart, tagEnd) {
  const props = [];
  let i = tagStart + "<MathPanel".length;
  while (i < tagEnd) {
    while (i < tagEnd && /\s/.test(src[i])) i++;
    if (i >= tagEnd) break;
    if (src[i] === ">") break;
    if (src[i] === "/" && src[i + 1] === ">") break;
    if (src.startsWith("{...", i)) {
      // 展开属性：整体跳过
      let d = 0;
      const s0 = i;
      for (; i < tagEnd; i++) {
        if (src[i] === "{") d++;
        else if (src[i] === "}") { d--; if (d === 0) { i++; break; } }
      }
      props.push({ spread: true, start: s0, end: i });
      continue;
    }
    const nameStart = i;
    while (i < tagEnd && /[A-Za-z0-9_$.-]/.test(src[i])) i++;
    const name = src.slice(nameStart, i);
    if (!name) { i++; continue; }
    let j = i;
    while (j < tagEnd && /\s/.test(src[j])) j++;
    if (src[j] !== "=") { i = j; continue; }
    j++;
    while (j < tagEnd && /\s/.test(src[j])) j++;
    let valStart = j;
    let valEnd;
    if (src[j] === "{") {
      let d = 0;
      let str = null;
      for (let k = j; k < tagEnd; k++) {
        const c = src[k];
        if (str) {
          if (c === "\\") { k++; continue; }
          if (c === str) str = null;
          continue;
        }
        if (c === '"' || c === "'" || c === "`") { str = c; continue; }
        if (c === "{") d++;
        else if (c === "}") { d--; if (d === 0) { valEnd = k + 1; break; } }
      }
    } else if (src[j] === '"' || src[j] === "'") {
      const q = src[j];
      let k = j + 1;
      while (k < tagEnd && src[k] !== q) {
        if (src[k] === "\\") k++;
        k++;
      }
      valEnd = k + 1;
    } else {
      let k = j;
      while (k < tagEnd && !/[\s/>]/.test(src[k])) k++;
      valEnd = k;
    }
    props.push({ name, start: nameStart, end: valEnd, value: src.slice(valStart, valEnd) });
    i = valEnd;
  }
  return props;
}

let changedFiles = 0;
let changedSites = 0;
const skipped = [];

for (const f of files) {
  let src = fs.readFileSync(f, "utf8");
  const edits = [];
  const re = /<MathPanel\b/g;
  let m;
  while ((m = re.exec(src))) {
    const [tagStart, tagEnd] = openTagRange(src, m.index);
    const props = parseProps(src, tagStart, tagEnd);
    if (props.some((p) => p.spread)) continue;

    const others = props.filter((p) => p.name !== "title");
    const titleProps = props.filter((p) => p.name === "title");
    if (others.length === 0) continue;

    // 校验：所有非 title 属性都是 {VAR.propName}
    const vars = new Set();
    let ok = true;
    for (const p of others) {
      const mm = p.value.match(/^\{([A-Za-z_$][\w$]*)\.([A-Za-z_$][\w$]*)\}$/);
      if (!mm || mm[2] !== p.name) { ok = false; break; }
      vars.add(mm[1]);
    }
    if (!ok || vars.size !== 1) {
      skipped.push(f + ":" + (src.slice(0, tagStart).split("\n").length) + " 形态不匹配，跳过");
      continue;
    }
    const VAR = [...vars][0];

    // 按 title 切分为若干连续组，每组替换成 {..VAR}
    others.sort((a, b) => a.start - b.start);
    const groups = [];
    let cur = [others[0]];
    for (let k = 1; k < others.length; k++) {
      const prev = cur[cur.length - 1];
      const titleBetween = titleProps.some(
        (t) => t.start > prev.end && t.start < others[k].start,
      );
      if (titleBetween) { groups.push(cur); cur = [others[k]]; }
      else cur.push(others[k]);
    }
    groups.push(cur);

    for (const g of groups) {
      edits.push({ start: g[0].start, end: g[g.length - 1].end, text: `{...${VAR}}` });
    }
  }

  if (edits.length === 0) continue;

  // 从后往前应用，避免偏移错乱
  edits.sort((a, b) => b.start - a.start);
  let out = src;
  for (const e of edits) {
    out = out.slice(0, e.start) + e.text + out.slice(e.end);
  }

  changedFiles++;
  changedSites += edits.length;

  if (!WRITE) {
    console.log("== " + f + "  (" + edits.length + " 处)");
    // 打印改写前后片段对照
    const before = src;
    const idx = src.indexOf("<MathPanel");
    const t0 = before.slice(idx, idx + 240).split("\n").slice(0, 8).join("\n");
    const idx2 = out.indexOf("<MathPanel");
    const t1 = out.slice(idx2, idx2 + 240).split("\n").slice(0, 8).join("\n");
    console.log("--- BEFORE\n" + t0 + "\n--- AFTER\n" + t1 + "\n");
  } else {
    fs.writeFileSync(f, out, "utf8");
  }
}

console.log(
  (WRITE ? "已写入" : "干跑") +
    "：文件 " + changedFiles + " 个，调用点 " + changedSites + " 处",
);
if (skipped.length) {
  console.log("跳过 " + skipped.length + " 处：");
  skipped.forEach((s) => console.log("  " + s));
}
