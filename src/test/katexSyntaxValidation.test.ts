import { describe, it, expect } from "vitest";
import katex from "katex";
import { buildMathQuantities } from "@/data/mathQuantities";

/**
 * 提取文本中的 KaTeX 行内公式 ($...$) 与行间公式 ($$...$$)
 */
function extractLatexFormulas(text: string): string[] {
  const formulas: string[] = [];
  const regex = /\$\$([\s\S]*?)\$\$|\$([^$\n]+)\$/g;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(text)) !== null) {
    const expr = (match[1] || match[2])?.trim();
    if (expr) formulas.push(expr);
  }
  return formulas;
}

/**
 * 校验公式字符串是否能被 KaTeX 无错编译
 */
function assertKatexValid(expr: string, context: string) {
  if (!expr || typeof expr !== "string") return;
  const clean = expr.trim();
  if (!clean) return;

  try {
    katex.renderToString(clean, {
      throwOnError: true,
      displayMode: true,
      strict: false,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    expect.fail(`[KaTeX 语法错误] ${context} -> "${clean}": ${msg}`);
  }
}

describe("高中数学右屏数据推导链与 LaTeX 离线语法自动化校验", () => {
  const topicsToTest: Array<{
    animId: string;
    params: Record<string, number>;
    config?: Record<string, unknown>;
  }> = [
    {
      animId: "anim-solid-ball-models",
      params: { a: 3, b: 4, c: 5 },
      config: { modelType: "corner" },
    },
    {
      animId: "anim-solid-ball-models",
      params: { a: 3, b: 4, h: 4 },
      config: { modelType: "cylinder" },
    },
    {
      animId: "anim-derivative-shift",
      params: { a: 2.0 },
      config: { activeMode: "implicit_zero", subModel: "x_ln_x" },
    },
    {
      animId: "anim-derivative-shift",
      params: { k: 0.25 },
      config: { activeMode: "shift_symmetric", subModel: "xe_neg_x" },
    },
    {
      animId: "anim-probability-bayes",
      params: { pPriorD: 0.02, pSensitivity: 0.95, pFalsePositive: 0.05 },
      config: { activeMode: "bayes" },
    },
    {
      animId: "anim-solid-distance",
      params: { a: 3, b: 3, c: 3, lambda: 0.66, mu: 0.33 },
      config: { mode: "skewDistance", preset: "cube" },
    },
    {
      animId: "anim-sequence",
      params: { a1: 1, d: 1, q: 2, N: 3 },
      config: { activeMode: "models", subModel: "arith-geo" },
    },
    {
      animId: "anim-sequence",
      params: { a1: 3, d: -1, N: 8 },
      config: { activeMode: "arithmetic", arithmeticSubMode: "linear" },
    },
    {
      animId: "anim-sequence",
      params: { a1: 2, q: 3, N: 4 },
      config: { activeMode: "geometric" },
    },
    {
      animId: "anim-conic-parabola",
      params: { p: 2, tP: 1 },
      config: { studyMode: "definition", direction: "right" },
    },
    {
      animId: "anim-vector-dot-product",
      params: { magA: 3, magB: 4, thetaDeg: 60 },
      config: { studyMode: "defProj" },
    },
    {
      animId: "anim-vector-polarization-apollonius",
      params: { bcLength: 6, pointX: 2, pointY: 4 },
      config: { studyMode: "polarization" },
    },
    {
      animId: "anim-trig-lines",
      params: { alphaDeg: 45 },
      config: { studyMode: "lines" },
    },
    {
      animId: "anim-trig-transform",
      params: { A: 2, omega: 2, phi: 0, k: 1 },
      config: { studyMode: "transformPath" },
    },
    {
      animId: "anim-func-zero",
      params: { intervalM: -2, intervalN: 2 },
      config: { modelKey: "cubic" },
    },
    {
      animId: "anim-complex-geometry",
      params: { a1: 1, b1: 1, a2: 2, b2: -1 },
      config: { studyMode: "plane-operations" },
    },
    {
      animId: "anim-constant-single",
      params: { m: 1, n: 3, a: 2 },
      config: { funModel: "transcendent", logic: "always" },
    },
    {
      animId: "anim-constant-double",
      params: { yf: 1, yg: -1 },
      config: { selectedLogic: "all_all" },
    },
  ];

  topicsToTest.forEach(({ animId, params, config }) => {
    it(`校验专题 [${animId}] 的右屏数学量、定理与推导链公式 KaTeX 编译无错`, () => {
      const mathData = buildMathQuantities(animId, params, config);

      // 1. 校验 quantities 中的数学符号 symbol
      mathData.quantities.forEach((q) => {
        if (q.symbol) {
          assertKatexValid(q.symbol, `[${animId}] quantity symbol`);
        }
        // 如果 label 中包含 $...$，提取校验
        const labelFormulas = extractLatexFormulas(q.label);
        labelFormulas.forEach((f) =>
          assertKatexValid(f, `[${animId}] quantity label $formula`),
        );
      });

      // 2. 校验 theorems 中的 latex 与 condition
      mathData.theorems.forEach((t) => {
        if (t.latex) {
          assertKatexValid(t.latex, `[${animId}] theorem latex (${t.name})`);
        }
        if (t.condition) {
          const condFormulas = extractLatexFormulas(t.condition);
          condFormulas.forEach((f) =>
            assertKatexValid(f, `[${animId}] theorem condition $formula`),
          );
        }
      });

      // 3. 校验 reasoningSteps 推导链
      if (mathData.reasoningSteps) {
        mathData.reasoningSteps.forEach((step, idx) => {
          if (step.latex) {
            assertKatexValid(
              step.latex,
              `[${animId}] reasoningStep[${idx}] latex`,
            );
          }
          const titleFormulas = extractLatexFormulas(step.title);
          titleFormulas.forEach((f) =>
            assertKatexValid(
              f,
              `[${animId}] reasoningStep[${idx}] title $formula`,
            ),
          );
          if (step.detail) {
            const detailFormulas = extractLatexFormulas(step.detail);
            detailFormulas.forEach((f) =>
              assertKatexValid(
                f,
                `[${animId}] reasoningStep[${idx}] detail $formula`,
              ),
            );
          }
        });
      }

      // 4. 校验 mnemonic 中内嵌公式
      if (mathData.mnemonic) {
        const mnFormulas = extractLatexFormulas(mathData.mnemonic);
        mnFormulas.forEach((f) =>
          assertKatexValid(f, `[${animId}] mnemonic $formula`),
        );
      }
    });
  });
});
