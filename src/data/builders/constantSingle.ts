import type { MathPanelData } from "../types";
import { colorize } from "../types";
import {
  solveConstantSingleSep,
  solveConstantSingleDirect,
  solveConstantSingleSepTrans,
  solveConstantSingleDirectTrans,
} from "@/math/constant";
import { MATH_COLORS } from "@/theme";

export function buildConstantSinglePanel(
  params: Record<string, number>,
  config?: Record<string, unknown>,
): MathPanelData {
  const subMode = (config?.subMode as "sep" | "direct") || "sep";
  const logic = (config?.logic as "always" | "exist") || "always";
  const funModel =
    (config?.funModel as "quadratic" | "transcendent") || "quadratic";
  const m = params.m ?? 0.5;
  const n = params.n ?? 2.5;
  const col = colorize;
  const isTranscendent = funModel === "transcendent";

  if (subMode === "sep") {
    return buildSepBranch(params, m, n, logic, isTranscendent, col);
  } else {
    return buildDirectBranch(params, m, n, isTranscendent, col);
  }
}

function buildSepBranch(
  params: Record<string, number>,
  m: number,
  n: number,
  logic: "always" | "exist",
  isTranscendent: boolean,
  col: typeof colorize,
): MathPanelData {
  const a = params.a ?? 1.2;
  const res = isTranscendent
    ? solveConstantSingleSepTrans(a, m, n)
    : solveConstantSingleSep(a, m, n);

  const quantities: MathPanelData["quantities"] = [
    {
      label: "区间内最小值",
      symbol: "f(x)min",
      value: res.fMin,
      color: MATH_COLORS.function,
    },
    { label: "最小值横坐标", symbol: "xmin", value: res.xFMin },
    {
      label: "区间内最大值",
      symbol: "f(x)max",
      value: res.fMax,
      color: MATH_COLORS.derivative,
    },
    { label: "最大值横坐标", symbol: "xmax", value: res.xFMax },
    {
      label:
        logic === "always" ? "恒成立状态 (f(x) ≥ a)" : "存在性状态 (f(x) ≥ a)",
      value: (logic === "always" ? res.isAlwaysTrue : res.isExistTrue)
        ? "成立"
        : "不成立",
      highlight: (logic === "always" ? res.isAlwaysTrue : res.isExistTrue)
        ? "extreme"
        : "negative",
    },
  ];

  const theorems: MathPanelData["theorems"] = [
    {
      name: "恒成立等价关系",
      latex: `\\forall x \\in [m, n], \\, f(x) \\ge ${col("a", MATH_COLORS.paramPrimary)} \\iff f(x)_{\\min} \\ge ${col("a", MATH_COLORS.paramPrimary)}`,
      level: "core",
      prerequisites: ["区间范围存在 [m, n]", "函数最值可达"],
    },
    {
      name: "存在性等价关系",
      latex: `\\exists x \\in [m, n], \\, f(x) \\ge ${col("a", MATH_COLORS.paramPrimary)} \\iff f(x)_{\\max} \\ge ${col("a", MATH_COLORS.paramPrimary)}`,
      level: "core",
      prerequisites: ["区间范围存在 [m, n]", "函数最值可达"],
    },
  ];

  if (isTranscendent) {
    theorems.push({
      name: "目标超越函数导数",
      latex: `f(x) = \\frac{\\ln x}{x} \\Rightarrow f'(x) = \\frac{1-\\ln x}{x^2}`,
      level: "important",
      prerequisites: ["x > 0", "在 x = e 取得最大值 1/e ≈ 0.368"],
    });
  }

  const gaokaoPoints: MathPanelData["gaokaoPoints"] = isTranscendent
    ? [
        {
          text: "高考核心\u201Cln x / x\u201D模型：其单调性与最值是高考导数大题中出现频率极高的经典结构。通过求导容易得出它在 (0, e) 单调递增，在 (e, +∞) 单调递减，在 x = e 处取得全局最大值 1/e。",
          importance: "gaokao",
        },
        {
          text: "参变分离法：在超越不等式中，若要求 f(x) ≥ a 恒成立，转化为求其在区间上的最小值 ≥ a；若要求存在性成立，转化为求最大值 ≥ a。",
          importance: "gaokao",
        },
      ]
    : [
        {
          text: "参变分离法核心：将不等式一侧完全分离出参数，直接探究另一侧函数在给定区间上的最值。",
          importance: "gaokao",
        },
        {
          text: "恒成立问题看\u201C最底端（最小值）\u201D，存在性问题看\u201C最顶端（最大值）\u201D。",
          importance: "core",
        },
      ];

  const warnings: MathPanelData["warnings"] = [];
  if (res.isDegenerate) {
    warnings.push({
      text: "区间发生退化 (左端点 m ≥ 右端点 n) 或不在定义域内 (m <= 0)，请重新调整区间滑块！",
      level: "danger",
    });
  }
  if (logic === "always" && !res.isAlwaysTrue) {
    warnings.push({
      text: `参数 a 超过了最小值 ${res.fMin.toFixed(2)}，红色区间内的 x 均无法满足不等式。`,
      level: "warning",
    });
  }

  return {
    quantities,
    theorems,
    gaokaoPoints,
    warnings,
    mnemonic: isTranscendent
      ? "ln x 比 x 极值在 e，恒成求小存在大。"
      : "参变分离超好用，恒成求小存在大。",
  };
}

function buildDirectBranch(
  params: Record<string, number>,
  m: number,
  n: number,
  isTranscendent: boolean,
  col: typeof colorize,
): MathPanelData {
  const aAxis = params.a_axis ?? 1.0;
  const res = isTranscendent
    ? solveConstantSingleDirectTrans(aAxis, m, n)
    : solveConstantSingleDirect(aAxis, m, n);

  const quantities: MathPanelData["quantities"] = [
    {
      label: "研究区间内最小值",
      symbol: "f(x)min",
      value: res.fMin,
      color: MATH_COLORS.function,
    },
    {
      label: "最值所处位置",
      value:
        res.discussionType === "left"
          ? "区间左端点 m"
          : res.discussionType === "right"
            ? "区间右端点 n"
            : isTranscendent
              ? "极小值点 ln a"
              : "区间内部顶点 a",
    },
    {
      label: "恒成立状态 (f(x) ≥ 0)",
      value: res.isAlwaysTrue ? "成立" : "不成立",
      highlight: res.isAlwaysTrue ? "extreme" : "negative",
    },
  ];

  const theorems: MathPanelData["theorems"] = isTranscendent
    ? [
        {
          name: "直接讨论法（含参超越函数）",
          latex: `f(x) = e^x - ${col("a", MATH_COLORS.paramPrimary)}x \\ge 0 \\iff f(x)_{\\min} \\ge 0`,
          level: "core",
          prerequisites: ["讨论参数 a 对函数单调性的影响"],
        },
        {
          name: "超越函数求导与极值讨论",
          latex: `f'(x) = e^x - ${col("a", MATH_COLORS.paramPrimary)} \\Rightarrow \\text{极小值点为 } x = \\ln ${col("a", MATH_COLORS.paramPrimary)} \\; (${col("a", MATH_COLORS.paramPrimary)} > 0)`,
          level: "important",
          prerequisites: ["a ≤ 0 时 f(x) 严格单调递增，无极小值点"],
        },
      ]
    : [
        {
          name: "直接最值讨论法（区间轴动）",
          latex: `f(x) = x^2 - 2${col("a", MATH_COLORS.paramPrimary)}x + 2 \\ge 0 \\iff f(x)_{\\min} \\ge 0`,
          level: "core",
          prerequisites: ["区间 [m, n] 固定且合理"],
        },
        {
          name: "最小值分类讨论临界",
          latex: `f(x)_{\\min} = \\begin{cases} f(m), & ${col("a", MATH_COLORS.paramPrimary)} < m \\\\ f(${col("a", MATH_COLORS.paramPrimary)}), & m \\le ${col("a", MATH_COLORS.paramPrimary)} \\le n \\\\ f(n), & ${col("a", MATH_COLORS.paramPrimary)} > n \\end{cases}`,
          level: "important",
          prerequisites: ["对称轴 x = a 左右滑动"],
        },
      ];

  const gaokaoPoints: MathPanelData["gaokaoPoints"] = isTranscendent
    ? [
        {
          text: "超越函数\u201Ce^x - ax\u201D分类讨论模型：这是高考压轴题中求单调区间、极值和证明恒成立的最经典母题。讨论的界限基于极小值点 ln a 与区间端点 m, n 的大小关系。",
          importance: "gaokao",
        },
        {
          text: "直接讨论分类界限：a ≤ 0 (单调递增)；a < e^m (极小值在区间左侧)；e^m ≤ a ≤ e^n (极小值在区间内)；a > e^n (极小值在区间右侧)。",
          importance: "gaokao",
        },
      ]
    : [
        {
          text: "直接最值讨论法核心：不分离参数，而是通过分类讨论对称轴与固定区间的相对位置关系来确定最值。",
          importance: "gaokao",
        },
        {
          text: "\u201C轴动区间定\u201D问题中，临界讨论点恰好是轴与区间端点重合的时刻 (a = m 或 a = n)。",
          importance: "core",
        },
      ];

  const warnings: MathPanelData["warnings"] = [];
  if (res.isDegenerate) {
    warnings.push({
      text: "区间发生退化 (左端点 m ≥ 右端点 n)，请重新调整区间滑块！",
      level: "danger",
    });
  }
  if (!res.isAlwaysTrue) {
    warnings.push({
      text: `函数最小值跌破 0 (最小值为 ${res.fMin.toFixed(2)})，红色遮罩内的 x 均无法满足恒成立要求。`,
      level: "warning",
    });
  }

  return {
    quantities,
    theorems,
    gaokaoPoints,
    warnings,
    mnemonic: isTranscendent
      ? "指数减 ax 先求导，极小值在 ln a 找。"
      : "轴动定区间讨论，端点顶点定分界。",
  };
}
