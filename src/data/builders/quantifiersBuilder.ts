import type { MathPanelData } from "../types";
import { MATH_COLORS } from "@/theme";
import {
  solveSingleVarQuantifier,
  solveDualVarQuantifier,
} from "@/math/quantifiers";

export function buildQuantifiersPanel(
  params: Record<string, number>,
  config: {
    activeTab?: "universal" | "existential" | "dual";
    dualScenario?: "all_all" | "all_exist" | "exist_exist";
  } = {},
): MathPanelData {
  const activeTab = config.activeTab ?? "universal";
  const dualScenario = config.dualScenario ?? "all_all";

  const k = params.k ?? 1.0;
  const h = params.h ?? 0.0;
  const v = params.v ?? 1.0;
  const intMin = params.intMin ?? -2.0;
  const intMax = params.intMax ?? 2.0;
  const threshold = params.threshold ?? 0.0;
  const probeX = params.probeX ?? 0.0;

  const k2 = params.k2 ?? -0.8;
  const h2 = params.h2 ?? 0.0;
  const v2 = params.v2 ?? -0.5;
  const int2Min = params.int2Min ?? -1.5;
  const int2Max = params.int2Max ?? 1.5;

  if (activeTab === "dual") {
    const dualRes = solveDualVarQuantifier(
      dualScenario,
      k,
      h,
      v,
      intMin,
      intMax,
      k2,
      h2,
      v2,
      int2Min,
      int2Max,
    );

    const scenarioTitle =
      dualScenario === "all_all"
        ? "∀x₁ ∀x₂ 恒成立模型"
        : dualScenario === "all_exist"
          ? "∀x₁ ∃x₂ 值域包含模型"
          : "∃x₁ ∃x₂ 交集非空模型";

    return {
      quantities: [
        {
          label: "f(x) 值域",
          symbol: "\\text{Range}(f)",
          value: `[${dualRes.fMin.toFixed(2)}, ${dualRes.fMax.toFixed(2)}]`,
          color: MATH_COLORS.primary,
        },
        {
          label: "g(x) 值域",
          symbol: "\\text{Range}(g)",
          value: `[${dualRes.gMin.toFixed(2)}, ${dualRes.gMax.toFixed(2)}]`,
          color: MATH_COLORS.secondary,
        },
        {
          label: "博弈命题判定",
          symbol: "\\text{Truth}",
          value: dualRes.isTrue ? "真命题 (True)" : "假命题 (False)",
          color: dualRes.isTrue
            ? MATH_COLORS.paramTertiary
            : MATH_COLORS.paramPrimary,
        },
      ],
      theorems: [
        {
          name: scenarioTitle,
          latex:
            dualScenario === "all_all"
              ? `\\forall x_1 \\in I_1,\\, \\forall x_2 \\in I_2,\\, f(x_1) > g(x_2) \\iff f(x)_{\\min} > g(x)_{\\max}`
              : dualScenario === "all_exist"
                ? `\\forall x_1 \\in I_1,\\, \\exists x_2 \\in I_2,\\, f(x_1) = g(x_2) \\iff \\text{Range}(f) \\subseteq \\text{Range}(g)`
                : `\\exists x_1 \\in I_1,\\, \\exists x_2 \\in I_2,\\, f(x_1) = g(x_2) \\iff \\text{Range}(f) \\cap \\text{Range}(g) \\neq \\emptyset`,
          condition: "I₁, I₂ 为各自连续闭区间",
        },
      ],
      gaokaoPoints: [
        {
          text: "双变量任意对任意（∀x₁ ∀x₂）：属于最强约束，等价于 f 的最小值严格压制 g 的最大值。",
          importance: "gaokao",
        },
        {
          text: "双变量任意对存在（∀x₁ ∃x₂）：等价于 f 的值域完全被包含在 g 的值域内（Range(f) ⊆ Range(g)）。",
          importance: "hard",
        },
        {
          text: "双变量存在对存在（∃x₁ ∃x₂）：等价于两函数值域至少有一个公共点，即交集非空。",
          importance: "gaokao",
        },
      ],
      warnings:
        intMin >= intMax || int2Min >= int2Max
          ? [
              {
                text: "区间端点设置无效（需左端点严格小于右端点）",
                level: "warning",
              },
            ]
          : [],
      mnemonic: "全对全看最值压制，全对存看值域包含，存对存看交集非空",
    };
  }

  // 单变量模式 (universal / existential)
  const res = solveSingleVarQuantifier(
    activeTab,
    k,
    h,
    v,
    intMin,
    intMax,
    threshold,
    probeX,
  );

  return {
    quantities: [
      {
        label: "区间最小值",
        symbol: "f_{\\min}",
        value: res.fMin.toFixed(2),
        color: MATH_COLORS.primary,
      },
      {
        label: "基准阈值",
        symbol: "m",
        value: threshold.toFixed(2),
        color: MATH_COLORS.paramPrimary,
      },
      {
        label: "动点探针值",
        symbol: `f(${probeX.toFixed(1)})`,
        value: res.probeVal.toFixed(2),
        color: res.isProbeCounterExample
          ? MATH_COLORS.paramPrimary
          : MATH_COLORS.paramTertiary,
      },
      {
        label: "原命题真假",
        symbol: "p",
        value: res.isOriginalTrue ? "真 (True)" : "假 (False)",
        color: res.isOriginalTrue
          ? MATH_COLORS.paramTertiary
          : MATH_COLORS.paramPrimary,
      },
      {
        label: "否定命题真假",
        symbol: "\\neg p",
        value: res.isNegationTrue ? "真 (True)" : "假 (False)",
        color: res.isNegationTrue
          ? MATH_COLORS.paramTertiary
          : MATH_COLORS.paramPrimary,
      },
    ],
    theorems: [
      {
        name:
          activeTab === "universal" ? "全称命题及其否定" : "存在命题及其否定",
        latex:
          activeTab === "universal"
            ? `p: \\forall x \\in [a, b],\\, f(x) \\ge m \\iff f(x)_{\\min} \\ge m`
            : `q: \\exists x \\in [a, b],\\, f(x) \\le m \\iff f(x)_{\\min} \\le m`,
        condition: `\\text{否定转换规则：} \\neg(\\forall x, P(x)) \\iff \\exists x, \\neg P(x)`,
      },
      {
        name: "命题否定的等价转换",
        latex:
          activeTab === "universal"
            ? `\\neg p: \\exists x \\in [a, b],\\, f(x) < m`
            : `\\neg q: \\forall x \\in [a, b],\\, f(x) > m`,
        condition: "全称改存在/存在改全称，正面结论取反面",
      },
    ],
    gaokaoPoints: [
      {
        text: "全称命题证伪只需一个反例：一旦找到动点 x₀ 使得 f(x₀) < m，原全称命题立即为假。",
        importance: "gaokao",
      },
      {
        text: "含参不等式恒成立：∀x ∈ I, f(x) ≥ m 转化为求最值问题 f_min ≥ m。",
        importance: "core",
      },
      {
        text: "含参不等式能成立/存在性：∃x ∈ I, f(x) ≤ m 转化为求最值问题 f_min ≤ m。",
        importance: "gaokao",
      },
    ],
    warnings:
      intMin >= intMax
        ? [
            {
              text: "区间左端点需严格小于右端点",
              level: "warning",
            },
          ]
        : k === 0
          ? [
              {
                text: "二次项系数 k = 0，函数退化为常数函数",
                level: "warning",
              },
            ]
          : [],
    mnemonic:
      "全称改存在、存在改全称，正面结论变否定；恒成立找最值，证伪只需一反例",
  };
}
