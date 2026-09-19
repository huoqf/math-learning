import { describe, it, expect } from "vitest";
import katex from "katex";
import { buildMathQuantities } from "@/data/mathQuantities";
import {
  findOptimalSplit,
  extractLatexLines,
  getEffectiveLatexLength,
  normalizeFractionRowSpacing,
  splitAtTopLevelPunctuation,
  getAlignmentPrefix,
  startsWithRelation,
} from "@/components/UI/latexUtils";
import type { MathPanelData } from "@/data/types";

/**
 * 右屏公式拆行门禁：
 * 把「buildMathQuantities 真实产出」的每一条 LaTeX 送入 KatexFormula 的同款拆行流程，
 * 断言拆行后的每一段都是合法且语义完整的 LaTeX。
 *
 * 覆盖两类曾实际发生的缺陷：
 *  - 顶层 \; / \, 的分号被误判为断点 → 左行残留孤立反斜杠（非法 LaTeX）
 *  - 断点标点被直接删除 → 公式内容被静默改写
 */

/** 收集面板数据中的全部 LaTeX 文本（含 $...$ 行内公式） */
function collectLatex(data: MathPanelData): { text: string; from: string }[] {
  const out: { text: string; from: string }[] = [];
  const push = (t: string | undefined, from: string) => {
    if (t) out.push({ text: t, from });
  };

  data.quantities.forEach((q, i) => push(q.symbol, `quantities[${i}].symbol`));
  data.theorems.forEach((t, i) => push(t.latex, `theorems[${i}].latex`));
  data.reasoningSteps?.forEach((s, i) => {
    push(s.latex, `reasoningSteps[${i}].latex`);
    s.latexBlocks?.forEach((b, j) =>
      push(b, `reasoningSteps[${i}].latexBlocks[${j}]`),
    );
  });
  return out;
}

/** 与 KatexFormula 一致：最多 6 行、阈值 30 有效字符 */
function simulateSplit(latex: string): string[] {
  let lines = extractLatexLines(latex) ?? [latex];
  let guard = 0;
  while (guard++ < 12) {
    const widths = lines.map(getEffectiveLatexLength);
    const max = Math.max(...widths);
    if (max <= 30) break;
    const idx = widths.indexOf(max);
    const further = findOptimalSplit(lines[idx]);
    if (!further) break;
    if (lines.length >= 6) break;
    const next = [...lines];
    next.splice(idx, 1, further[0], further[1]);
    lines = next;
  }
  return lines;
}

/** 统计顶层标点数量（逗号/分号，含 \; \, 这类间距命令里的符号） */
function countPunctuation(s: string): number {
  return (s.match(/[,;]/g) || []).length;
}

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
    params: { normA: 3, normB: 4, thetaDeg: 60 },
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
  {
    animId: "anim-line-equation",
    params: { k: 1, b: 1, A: 1, B: -1, C: -1, x0: 0, y0: 1 },
    config: { studyMode: "forms", form: "slopeIntercept" },
  },
  {
    animId: "anim-line-equation",
    params: { A: 3, B: 4, C: -5, x0: 2, y0: 1 },
    config: { studyMode: "distance" },
  },
  {
    animId: "anim-line-equation",
    params: { A: 1, B: -1, C: -1, A2: 1, B2: 1, C2: -2 },
    config: { studyMode: "relation" },
  },
  {
    animId: "anim-conic-line",
    params: { a: 2, b: 1, k: 0.5, m: 0 },
    config: { curveType: "ellipse" },
  },
];

describe("顶层标点兜底拆行：分隔符判定与标点保全", () => {
  it("\\; 的分号不被当作顶层断点（否则左行会残留孤立反斜杠）", () => {
    const latex = "\\alpha \\subset \\beta, \\; \\alpha \\cap \\beta = l";
    const split = splitAtTopLevelPunctuation(latex);
    expect(split).not.toBeNull();
    // 左行必须以真正的逗号收尾，而不是以孤立反斜杠收尾
    expect(split![0].endsWith("\\")).toBe(false);
    expect(split![0]).toBe("\\alpha \\subset \\beta,");
    // 右行不得以 \; 这类间距命令起头
    expect(split![1].startsWith("\\;")).toBe(false);
    expect(split![1]).toContain("\\alpha \\cap \\beta = l");
  });

  it("\\, 的逗号同样不被当作顶层断点", () => {
    const latex = "a \\, b; c";
    const split = splitAtTopLevelPunctuation(latex);
    expect(split).not.toBeNull();
    expect(split![0].endsWith("\\")).toBe(false);
    expect(split![0]).toBe("a \\, b;");
  });

  it("断点标点保留在左行行尾，公式内容不被静默改写", () => {
    const cases = [
      "x_1 = 1, x_2 = 2, x_3 = 3",
      "a > 0, b > 0, c > 0",
      "\\text{当 } x > 0, \\text{当 } x < 0",
    ];
    for (const latex of cases) {
      const split = splitAtTopLevelPunctuation(latex);
      expect(split).not.toBeNull();
      expect(split![0].endsWith(",")).toBe(true);
      const before = (latex.match(/[,;]/g) || []).length;
      const after = ((split![0] + " " + split![1]).match(/[,;]/g) || []).length;
      expect(after, `标点丢失: ${latex}`).toBe(before);
    }
  });

  it("拆行后每段的 KaTeX 编译均无错（含 \\; 场景）", () => {
    for (const latex of [
      "\\alpha \\subset \\beta, \\; \\alpha \\cap \\beta = l",
      "\\text{当 } x > 0, \\; \\text{当 } x < 0",
    ]) {
      const split = splitAtTopLevelPunctuation(latex);
      expect(split).not.toBeNull();
      for (const seg of split!) {
        expect(() =>
          katex.renderToString(seg, {
            throwOnError: true,
            displayMode: true,
            strict: false,
          }),
        ).not.toThrow();
      }
    }
  });
});

describe("教材续行悬挂对齐基准", () => {
  it("取首行首个顶层关系符之前的片段作为对齐前缀", () => {
    expect(getAlignmentPrefix("f(x) = a(x - h)^2 + k")).toBe("f(x)");
    expect(getAlignmentPrefix("S = \\frac{S'}{\\cos\\theta}")).toBe("S");
    expect(
      getAlignmentPrefix(
        "\\cos\\langle\\vec{n_1},\\vec{n_2}\\rangle = \\frac{a}{b}",
      ),
    ).toBe("\\cos\\langle\\vec{n_1},\\vec{n_2}\\rangle");
  });

  it("无顶层对齐点、或前缀含环境体/过长时，不做悬挂对齐", () => {
    expect(getAlignmentPrefix("x^2 + 2ax + a^2")).toBeNull();
    expect(
      getAlignmentPrefix("\\begin{cases} x = 1 \\\\ y = 2 \\end{cases}"),
    ).toBeNull();
  });

  it("仅以关系符/运算符起头的续行需要对齐", () => {
    expect(startsWithRelation("= a x^2")).toBe(true);
    expect(startsWithRelation("+ k")).toBe(true);
    expect(startsWithRelation("\\Rightarrow x")).toBe(true);
    expect(startsWithRelation("\\text{中文}")).toBe(false);
    expect(startsWithRelation("x_1")).toBe(false);
  });
});

describe("右屏公式拆行门禁（合法性与内容完整性）", () => {
  topicsToTest.forEach(({ animId, params, config }) => {
    it(`[${animId}] 拆行后每段均为合法 LaTeX，且顶层标点无丢失`, () => {
      const data = buildMathQuantities(animId, params, config);
      const items = collectLatex(data);
      expect(items.length).toBeGreaterThan(0);

      for (const { text, from } of items) {
        // 面板会统一执行分式满尺寸升级，门禁须在与组件相同的字符串上判定
        const normalized = normalizeFractionRowSpacing(text, true);
        const segments = simulateSplit(normalized);

        for (const seg of segments) {
          // 1. 严禁行尾残留孤立反斜杠（KaTeX 会渲染成错误文本）
          const danglingBackslash = /\\$/.test(seg) && !/\\\\$/.test(seg);
          expect(
            danglingBackslash,
            `[${animId}] ${from} 拆行后出现孤立反斜杠：${JSON.stringify(seg)}`,
          ).toBe(false);

          // 2. 严禁出现空片段
          expect(
            seg.trim().length,
            `[${animId}] ${from} 拆行后出现空片段`,
          ).toBeGreaterThan(0);

          // 3. 每段都必须能被 KaTeX 无错编译
          try {
            katex.renderToString(seg, {
              throwOnError: true,
              displayMode: true,
              strict: false,
            });
          } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : String(err);
            expect.fail(
              `[${animId}] ${from} 拆行片段 KaTeX 编译失败 -> ${JSON.stringify(seg)}: ${msg}`,
            );
          }
        }

        // 4. 拆行不得静默删除顶层标点（逗号/分号数量必须守恒）
        const before = countPunctuation(normalized);
        const after = segments.reduce((n, s) => n + countPunctuation(s), 0);
        expect(
          after,
          `[${animId}] ${from} 拆行丢失标点：原 ${before} 个，拆后 ${after} 个`,
        ).toBe(before);
      }
    });
  });
});
