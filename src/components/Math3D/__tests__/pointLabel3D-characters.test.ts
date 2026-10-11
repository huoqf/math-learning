import { describe, it, expect } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, resolve, relative, sep } from "node:path";

/**
 * `PointLabel3D` 使用 troika-three-text + KaTeX_Main 字体渲染纯文本。
 * KaTeX_Main 仅覆盖基本拉丁字符和数学符号，**不含 Unicode 下标/上标/CJK**。
 * 缺失字形依赖 unicode-font-resolver CDN fallback（弱网/离线会渲染为方框）。
 *
 * ## 为什么是"自动发现"而不是手工文件清单
 * 本测试原先维护一份 5 个文件的常量清单。清单是手工的 ⇒ 任何**新页面天然在门禁之外**，
 * 于是出现"四道门禁全绿、但新页面仍把 `A₁`、`直线 l`、`P(公共点)` 塞进
 * PointLabel3D"的情况。改为遍历 `src/` 自动发现所有 `<PointLabel3D>` 使用点，
 * 新页面会自动进入检查范围，不需要任何人记得回来改清单。
 *
 * ## 判定口径
 * 允许字符集 = 全部可打印 ASCII（U+0020–U+007E）——与字体实际覆盖范围一致。
 * `text` 属性里出现的**每一段**字符串字面量都要过检，包括
 * `text={cond ? "阳马" : name}` 这类三元表达式内部的分支字面量
 * （只检查 `text="..."` 会漏掉它们）。
 *
 * 需要下标/中文/公式时，改用：
 * - `FormulaLabel3D`（KaTeX，真下标 + `\text{}` 中文，且支持 `colorKey`）
 * - `CompoundLabel3D`（`base` + `subscript` 两个纯 ASCII 片段，troika 原生）
 */

const SRC_ROOT = resolve(__dirname, "../../../");

/** 需要检查的源文件扩展名 */
const EXT = /\.tsx$/;

const ALLOWED = /^[\x20-\x7E]*$/;

/** 递归收集 `src/` 下的所有 .tsx 文件（跳过测试与声明文件） */
function collectSourceFiles(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    if (entry === "node_modules" || entry.startsWith(".")) continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      collectSourceFiles(full, out);
    } else if (EXT.test(entry) && !/\.test\.tsx$/.test(entry)) {
      out.push(full);
    }
  }
  return out;
}

/** 剥掉模板串里的 `${...}`（按花括号配平），只留下会原样上屏的字面部分 */
function stripTemplateExpressions(input: string): string {
  let out = "";
  for (let i = 0; i < input.length; i++) {
    if (input[i] === "$" && input[i + 1] === "{") {
      let depth = 1;
      i += 2;
      while (i < input.length && depth > 0) {
        if (input[i] === "{") depth++;
        else if (input[i] === "}") depth--;
        i++;
      }
      i--;
      continue;
    }
    out += input[i];
  }
  return out;
}

/** 抽取一段表达式里所有会被当作文本上屏的字符串字面量 */
export function extractLiterals(expr: string): string[] {
  const src = stripTemplateExpressions(expr);
  const found: string[] = [];
  const re = /"([^"\\]*)"|'([^'\\]*)'|`([^`\\]*)`/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(src)) !== null) found.push(m[1] ?? m[2] ?? m[3] ?? "");
  return found;
}

/** 从 `text=` 之后取出属性值表达式文本（花括号配平 / 引号配对） */
function readTextAttribute(source: string, afterEquals: number): string {
  let i = afterEquals;
  while (i < source.length && /\s/.test(source[i])) i++;
  if (source[i] === "{") {
    let depth = 1;
    let j = i + 1;
    for (; j < source.length && depth > 0; j++) {
      if (source[j] === "{") depth++;
      else if (source[j] === "}") depth--;
    }
    return source.slice(i + 1, j - 1);
  }
  const quote = source[i];
  if (quote === '"' || quote === "`") {
    let j = i + 1;
    while (j < source.length && source[j] !== quote) j++;
    return source.slice(i, j + 1);
  }
  return "";
}

interface Site {
  line: number;
  text: string;
}

/** 找出一个源文件里所有 `<PointLabel3D>` 的 `text` 字面量及其行号 */
export function findPointLabelTexts(source: string): Site[] {
  const out: Site[] = [];
  let cursor = 0;
  while ((cursor = source.indexOf("<PointLabel3D", cursor)) !== -1) {
    // 扫到该元素的收尾 `/>`（跳过花括号内部，避免被表达式里的 `/>` 骗到）
    let end = -1;
    let depth = 0;
    for (let j = cursor; j < source.length - 1; j++) {
      const c = source[j];
      if (c === "{") depth++;
      else if (c === "}") depth--;
      else if (c === "/" && source[j + 1] === ">" && depth === 0) {
        end = j;
        break;
      }
    }
    if (end === -1) break;
    const block = source.slice(cursor, end);
    const line = source.slice(0, cursor).split("\n").length;
    const attr = /\btext\s*=/.exec(block);
    if (attr) {
      for (const text of extractLiterals(
        readTextAttribute(block, attr.index + attr[0].length),
      )) {
        out.push({ line, text });
      }
    }
    cursor = end + 2;
  }
  return out;
}

function describeOffenders(text: string): string {
  const offenders = [...new Set(text.replace(/[\x20-\x7E]/g, ""))];
  return offenders
    .map(
      (c) =>
        `"${c}" (U+${c.charCodeAt(0).toString(16).toUpperCase().padStart(4, "0")})`,
    )
    .join(", ");
}

describe("PointLabel3D 字符集合规（自动发现）", () => {
  const files = collectSourceFiles(SRC_ROOT).filter((f) =>
    readFileSync(f, "utf-8").includes("<PointLabel3D"),
  );

  it("至少能发现若干使用点（防止自动发现逻辑写坏后静默变成空集）", () => {
    expect(files.length).toBeGreaterThan(10);
    const total = files.reduce(
      (sum, f) => sum + findPointLabelTexts(readFileSync(f, "utf-8")).length,
      0,
    );
    expect(total).toBeGreaterThan(50);
  });

  for (const file of files) {
    const rel = relative(SRC_ROOT, file).split(sep).join("/");
    it(`${rel} 中的 PointLabel3D text 只包含允许字符`, () => {
      const texts = findPointLabelTexts(readFileSync(file, "utf-8"));
      const violations = texts.filter((t) => !ALLOWED.test(t.text));
      if (violations.length > 0) {
        const detail = violations
          .map(
            (v) =>
              `  第 ${v.line} 行 text="${v.text}" → ${describeOffenders(v.text)}`,
          )
          .join("\n");
        throw new Error(
          `PointLabel3D 包含字体不支持的字符:\n${detail}\n\n` +
            `KaTeX_Main 字体不含这些字符，在弱网/离线环境下会渲染为方框。\n` +
            `需要下标请改用 FormulaLabel3D（真下标）或 CompoundLabel3D（base + subscript）；\n` +
            `需要中文请改用 FormulaLabel3D 的 \\text{...}。`,
        );
      }
      expect(violations).toEqual([]);
    });
  }
});
