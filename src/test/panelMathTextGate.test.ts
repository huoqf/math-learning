import { describe, it, expect } from "vitest";
import katex from "katex";
import { buildMathQuantities } from "@/data/mathQuantities";
import type { MathPanelData } from "@/data/types";
import { routeEntries } from "@/data/routeEntries";
import {
  advanceLatexDepth,
  createDepthState,
  extractLatexLines,
  isTopLevel,
} from "@/components/UI/latexUtils";

/**
 * 右屏数学文本渲染契约门禁。
 *
 * 守的是同一类缺陷：**数据层已经用 $...$ / LaTeX 表达数学，渲染层却把它当纯文本输出**，
 * 于是学生看到的不是公式，而是 `$x_0$`、`\color{#EF4444}{3}`、`f_{\min} &= ...` 这类源码；
 * 或者更糟——片段被切成非法 LaTeX 后 KaTeX 编译失败，界面出现红色的错误源码。
 *
 * 三条不变量：
 *  A. 多行公式解构出的每个片段都必须能被 KaTeX 独立无错编译，
 *     且不得残留顶层 & / \\（对 KaTeX 而言都是非法语法）。
 *  B. aligned / gathered 等原生对齐环境不得被拍平或割裂——
 *     拍平会剥离对齐符并割裂环境闭合性，直接退化为错误源码。
 *  C. registry 全量数据中，承载数学的文本字段里 $ 必须成对，$...$ 内表达式必须合法，
 *     且 label / unit / rubric 中不得残留未被 $ 包裹的裸 LaTeX 命令。
 */

function expectKatexCompilable(expr: string, context: string) {
  const clean = expr?.trim();
  if (!clean) return;
  try {
    katex.renderToString(clean, {
      throwOnError: true,
      displayMode: true,
      strict: false,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    expect.fail(`[KaTeX 编译失败] ${context} -> "${clean}": ${msg}`);
  }
}

/** 判断片段中是否存在**顶层**（未被任何环境/括号包裹）的指定词元 */
function hasTopLevelToken(text: string, token: string): boolean {
  const state = createDepthState();
  let i = 0;
  while (i < text.length) {
    if (isTopLevel(state) && text.startsWith(token, i)) return true;
    i += advanceLatexDepth(text, i, state);
  }
  return false;
}

/** 统计子串出现次数 */
function countOf(text: string, token: string): number {
  return text.split(token).length - 1;
}

/** 提取文本中的行内 $...$ 与行间 $$...$$ 公式 */
function extractDollarFormulas(text: string): string[] {
  const formulas: string[] = [];
  const regex = /\$\$([\s\S]*?)\$\$|\$([^$\n]+)\$/g;
  let m: RegExpExecArray | null;
  while ((m = regex.exec(text)) !== null) {
    const expr = (m[1] || m[2])?.trim();
    if (expr) formulas.push(expr);
  }
  return formulas;
}

/** 统计未配对的 $ 个数（0 表示定界符平衡） */
function countUnpairedDollar(text: string): number {
  const dollars = (text.match(/\$/g) || []).length;
  // 每个 $$...$$ 消耗 4 个 $，每个 $...$ 消耗 2 个
  let consumed = 0;
  const regex = /\$\$([\s\S]*?)\$\$|\$([^$\n]+)\$/g;
  let m: RegExpExecArray | null;
  while ((m = regex.exec(text)) !== null)
    consumed += m[1] !== undefined ? 4 : 2;
  return dollars - consumed;
}

interface TextField {
  path: string;
  value: string;
}

/** 深度遍历 MathPanelData，收集所有字符串字段（含数组元素） */
function collectTextFields(data: MathPanelData, label: string): TextField[] {
  const out: TextField[] = [];
  const walk = (node: unknown, path: string) => {
    if (typeof node === "string") {
      if (node.trim()) out.push({ path: `${label}${path}`, value: node });
      return;
    }
    if (Array.isArray(node)) {
      node.forEach((item, i) => walk(item, `${path}[${i}]`));
      return;
    }
    if (node && typeof node === "object") {
      for (const [k, v] of Object.entries(node)) walk(v, `${path}.${k}`);
    }
  };
  walk(data, "");
  return out;
}

/** 承载数学的文本字段（$...$ 会被 renderMixedLatex 按定界符渲染） */
const MATH_BEARING =
  /\.(label|unit|value|rubric|mnemonic|invariantNote|symbol)$/;

/** KaTeX 渲染产物的容器字段：整串就是一条公式，不应含 $ 定界符 */
const WHOLE_FORMULA = /\.(latex|latexBlocks\[\d+\])$/;

/** 参与多行解构的字段 */
const MULTILINE_CANDIDATE = /\.(latex|symbol|value|condition|note|detail)$/;

/**
 * 少数专题的 KnowledgeNode.animationParams 未覆盖全部参数键，
 * 而对应 builder 会直接读取该键（缺省即 NaN 崩溃），此处补齐缺省值。
 */
const PARAM_OVERRIDES: Record<string, Record<string, number>> = {
  "anim-derivative-tangent-scaling": { x0: 1 },
};

const panelSamples: Array<{ animId: string; data: MathPanelData }> = (() => {
  const samples: Array<{ animId: string; data: MathPanelData }> = [];
  const seen = new Set<string>();
  for (const entry of routeEntries) {
    for (const animId of entry.node.animationIds ?? []) {
      if (seen.has(animId)) continue;
      seen.add(animId);
      const data = buildMathQuantities(
        animId,
        {
          ...(PARAM_OVERRIDES[animId] ?? {}),
          ...(entry.node.animationParams ?? {}),
        },
        undefined,
      );
      samples.push({ animId, data });
    }
  }
  return samples;
})();

describe("右屏数学文本渲染契约门禁", () => {
  describe("多行公式解构：顶层切分，环境内不拍平", () => {
    it("顶层 \\\\ 切分出的片段必须逐行可编译且无顶层 &/\\\\ 残留", () => {
      const samples: Array<[string, string]> = [
        // 两个并列 aligned 块由顶层 \\ 连接：应切成两个各自完整的环境片段
        [
          "并列 aligned 块",
          String.raw`\begin{aligned} \hat{y}_0 &= 1.10 \times 10 + 0.80 \\[4pt] &= 11.80 \end{aligned} \\ \begin{aligned} R^2 &= 1 - \frac{0.10}{24.30} \approx 0.9959 \end{aligned}`,
        ],
        // 无环境的朴素多行
        ["无环境朴素多行", String.raw`a = 1 + 2 \\ b = 3 + 4`],
        // 环境 + 尾部结论
        [
          "环境与尾部结论",
          String.raw`\begin{aligned} d &= \frac{a b}{\sqrt{a^2+b^2}} \end{aligned} \\ \implies d = 2.40`,
        ],
      ];

      for (const [name, formula] of samples) {
        const lines = extractLatexLines(formula);
        expect(lines, `${name}：应解构为多行`).not.toBeNull();
        expect(lines!.length, `${name}：行数`).toBeGreaterThan(1);
        lines!.forEach((line, i) => {
          expect(
            hasTopLevelToken(line, "&"),
            `${name}：第 ${i + 1} 行残留顶层对齐符 & -> "${line}"`,
          ).toBe(false);
          expect(
            hasTopLevelToken(line, "\\\\"),
            `${name}：第 ${i + 1} 行残留顶层换行符 \\\\ -> "${line}"`,
          ).toBe(false);
          expectKatexCompilable(line, `${name} 第 ${i + 1} 行`);
        });
      }
    });

    it("拍平 aligned 时，嵌套/并列环境必须保持闭合且逐行可编译", () => {
      // 单块 aligned：解包后拍平为独立行，且顶层对齐符剥离
      const single = String.raw`\begin{aligned} f_{\min} &= f(x_f) = y_f = 2.5 \\[4pt] g_{\max} &= g(x_g) = y_g = 1.5 \end{aligned}`;
      const singleRows = extractLatexLines(single);
      expect(singleRows, "单块 aligned 应解包拍平").not.toBeNull();
      expect(singleRows!.length).toBe(2);
      singleRows!.forEach((r, i) =>
        expectKatexCompilable(r, `单块 aligned 第 ${i + 1} 行`),
      );

      // aligned 内嵌 cases：cases 必须整段落在同一行内，不得被拦腰切断
      const nested = String.raw`\begin{aligned} \begin{cases} \vec{n} \cdot \vec{u} = 0 \\ \vec{n} \cdot \vec{v} = 0 \end{cases} &\implies \vec{n} = (1, 1, 1) \\[1ex] \implies d_{\min} &= \frac{|\vec{AA_1} \cdot \vec{n}|}{|\vec{n}|} \end{aligned}`;
      const nestedRows = extractLatexLines(nested);
      expect(nestedRows, "aligned 内嵌 cases 应可解包").not.toBeNull();
      for (const [i, row] of nestedRows!.entries()) {
        expect(
          countOf(row, "\\begin{cases}"),
          `内嵌 cases 第 ${i + 1} 行 begin 数量与 end 不一致 -> "${row}"`,
        ).toBe(countOf(row, "\\end{cases}"));
        expectKatexCompilable(row, `内嵌 cases 第 ${i + 1} 行`);
      }

      // 并列 aligned 块：不得解包（会被剥掉外层 begin/end 却留下内层，产生半截环境）
      const sibling = String.raw`\begin{aligned} \hat{y}_0 &= 1.10 \times 10 + 0.80 \\[4pt] &= 11.80 \end{aligned} \\ \begin{aligned} R^2 &= 1 - \frac{0.10}{24.30} \approx 0.9959 \end{aligned}`;
      const siblingRows = extractLatexLines(sibling);
      expect(siblingRows, "并列 aligned 应切分为两个完整片段").not.toBeNull();
      expect(siblingRows!.length).toBe(2);
      for (const [i, row] of siblingRows!.entries()) {
        expect(
          countOf(row, "\\begin{aligned}"),
          `并列 aligned 第 ${i + 1} 行 begin/end 不配对 -> "${row}"`,
        ).toBe(countOf(row, "\\end{aligned}"));
        expectKatexCompilable(row, `并列 aligned 第 ${i + 1} 行`);
      }
    });

    it("registry 全量数据：解构出的每个片段均可独立编译", () => {
      let splitCount = 0;
      for (const { animId, data } of panelSamples) {
        for (const { path, value } of collectTextFields(data, animId)) {
          if (!MULTILINE_CANDIDATE.test(path)) continue;
          if (!value.includes("\\\\")) continue;
          const lines = extractLatexLines(value);
          if (!lines) continue;
          splitCount++;
          lines.forEach((line, i) => {
            expect(
              hasTopLevelToken(line, "&"),
              `${path} 第 ${i + 1} 行残留顶层 & -> "${line}"`,
            ).toBe(false);
            expectKatexCompilable(line, `${path} 第 ${i + 1} 行`);
          });
        }
      }
      expect(splitCount, "应至少解构到若干多行公式样本").toBeGreaterThan(0);
    });

    it("registry 全量数据：所有多行公式原式均可被 KaTeX 编译", () => {
      for (const { animId, data } of panelSamples) {
        for (const { path, value } of collectTextFields(data, animId)) {
          if (!MULTILINE_CANDIDATE.test(path)) continue;
          if (!value.includes("\\\\")) continue;
          expectKatexCompilable(value, `${path} 原式`);
        }
      }
    });
  });

  describe("数学文本字段的 $ 定界符契约", () => {
    it("承载数学的字段中，$ 必须成对且 $...$ 内表达式合法", () => {
      for (const { animId, data } of panelSamples) {
        for (const { path, value } of collectTextFields(data, animId)) {
          if (!MATH_BEARING.test(path)) continue;
          if (value.includes("$")) {
            expect(
              countUnpairedDollar(value),
              `${path} 中 $ 定界符未成对：${JSON.stringify(value)}`,
            ).toBe(0);
          }
          extractDollarFormulas(value).forEach((f) =>
            expectKatexCompilable(f, `${path} 的 $...$ 片段`),
          );
        }
      }
    });

    it("整串公式字段（latex / latexBlocks）不得含 $ 定界符", () => {
      for (const { animId, data } of panelSamples) {
        for (const { path, value } of collectTextFields(data, animId)) {
          if (!WHOLE_FORMULA.test(path)) continue;
          expect(
            value.includes("$"),
            `${path} 是整串公式字段，不应含 $ 定界符：${JSON.stringify(value)}`,
          ).toBe(false);
        }
      }
    });

    it("label / unit / rubric 中不得出现未被 $ 包裹的裸 LaTeX 命令", () => {
      // \cmd 形式（如 \color{...}、\sum、\sqrt{...}）在纯文本渲染下会原样显示；
      // 上下标写法（a_{8}、T_{6}）属既有的可读简写，不在此断言范围内。
      const BARE_CMD =
        /\\(?:color|dfrac|tfrac|frac|sqrt|sum|prod|int|infty|cdot|times|pm|le|ge|neq|triangle|angle|vec|bar|hat|Delta|lambda|theta|mu|sigma|alpha|beta|gamma|pi|omega|arg|min|max|lim|ln|log|sin|cos|tan|text|begin|left|right)\b/;
      for (const { animId, data } of panelSamples) {
        for (const { path, value } of collectTextFields(data, animId)) {
          if (!/\.(label|unit|rubric)$/.test(path)) continue;
          // 先剔除 $...$ 内的合法公式，再看剩下的纯文本里是否残留裸命令
          const outside = value.replace(/\$[^$\n]*\$/g, "");
          expect(
            BARE_CMD.test(outside),
            `${path} 含未被 $ 包裹的裸 LaTeX 命令，会作为纯文本直接显示：${JSON.stringify(value)}`,
          ).toBe(false);
        }
      }
    });
  });
});
