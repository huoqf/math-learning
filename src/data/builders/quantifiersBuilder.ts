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
      reasoningSteps: [
        {
          step: 1,
          title: "审题定法 · 两个函数各自在约束区间上取值域",
          detail: `先不管量词，分别把 $f$ 在 $I_1$、$g$ 在 $I_2$ 上的图象竖直投影成闭区间：$\\text{Range}(f) = [${dualRes.fMin.toFixed(2)}, ${dualRes.fMax.toFixed(2)}]$，$\\text{Range}(g) = [${dualRes.gMin.toFixed(2)}, ${dualRes.gMax.toFixed(2)}]$。值域算错，后面选的判据一定跟着错。`,
          latex: `\\text{Range}(f) = [${dualRes.fMin.toFixed(2)}, ${dualRes.fMax.toFixed(2)}],\\quad \\text{Range}(g) = [${dualRes.gMin.toFixed(2)}, ${dualRes.gMax.toFixed(2)}]`,
          rubric:
            "【高考采分点】分别求出 $f$、$g$ 在各自约束区间上的值域并写成闭区间，得 2 分。",
        },
        {
          step: 2,
          title: "建模联立 · 按量词组合选判定口径",
          detail:
            "「任意对任意」是最强约束，要求 $f$ 的最小值压制 $g$ 的最大值；「任意对存在」要求 $f$ 的值域被 $g$ 的值域包含；「存在对存在」只要求两值域有公共点。量词越强、条件越苛刻，读错一个量词，判据会整体偏一档。",
          latex:
            "\\forall\\forall: f_{\\min} > g_{\\max} \\quad \\forall\\exists: \\text{Range}(f) \\subseteq \\text{Range}(g) \\quad \\exists\\exists: \\text{Range}(f) \\cap \\text{Range}(g) \\neq \\emptyset",
          rubric:
            "【高考采分点】按当前量词组合选出判据（任意对任意用最值压制、任意对存在用值域包含、存在对存在用交集非空），得 3 分。",
        },
        {
          step: 3,
          title: "代入求解 · 端点比较出结论",
          detail: `按所选判据代入两端数值，当前模型判定为「${dualRes.isTrue ? "真命题" : "假命题"}」。答题时判据、数值、结论三件事要按顺序写全，只写结论不给分。`,
          latex: dualRes.isTrue
            ? "\\text{判据成立} \\implies \\text{真命题}"
            : "\\text{判据不成立} \\implies \\text{假命题}",
          rubric:
            "【高考采分点】把判据代入端点数值比较并写出真假结论，得 3 分。",
        },
      ],
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

  // 探针滑杆取值域 [−5, 5] 与目标区间共同决定探针可达性：越界时数学层按端点计算，
  // 右屏必须显式告知「读数取自哪个点」，否则学生会把 f(端点) 当成 f(越界点)。
  const probeClampWarning =
    Math.abs(probeX - res.probeXUsed) > 1e-9
      ? [
          {
            text: `探针 $x_0 = ${probeX.toFixed(1)}$ 已越出目标区间 $[${res.interval.min.toFixed(1)}, ${res.interval.max.toFixed(1)}]$，以下读数按端点 $x = ${res.probeXUsed.toFixed(1)}$ 计算`,
            level: "info" as const,
          },
        ]
      : [];

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
        symbol: `f(${res.probeXUsed.toFixed(1)})`,
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
        text: "含参不等式恒成立：$∀x ∈ I, f(x) ≥ m$ 转化为求最值问题 $f_min ≥ m$。",
        importance: "core",
      },
      {
        text: "含参不等式能成立/存在性：$∃x ∈ I, f(x) ≤ m$ 转化为求最值问题 $f_min ≤ m$。",
        importance: "gaokao",
      },
    ],
    warnings: [
      ...(intMin >= intMax
        ? [
            {
              text: "区间左端点需严格小于右端点",
              level: "warning" as const,
            },
          ]
        : []),
      ...(k === 0
        ? [
            {
              text: "二次项系数 k = 0，函数退化为常数函数",
              level: "warning" as const,
            },
          ]
        : []),
      ...probeClampWarning,
    ],
    reasoningSteps: [
      {
        step: 1,
        title: "审题定法 · 把量词命题化成最值条件",
        detail:
          "全称命题「对任意 $x$ 恒成立」等价于最小值满足条件；存在命题「存在 $x$ 使…」同样只用到最小值这一端。两类命题看似相反，落到运算上都归结为同一个数：区间最小值。",
        latex:
          activeTab === "universal"
            ? "\\forall x \\in [a, b],\\ f(x) \\ge m \\iff f_{\\min} \\ge m"
            : "\\exists x \\in [a, b],\\ f(x) \\le m \\iff f_{\\min} \\le m",
        rubric:
          "【高考采分点】把量词命题化为最值条件（全称恒成立取 $f_{\\min} \\ge m$，存在能成立取 $f_{\\min} \\le m$），得 2 分。",
      },
      {
        step: 2,
        title: "建模联立 · 在约束区间上求最小值",
        detail: `$f$ 在 $[${res.interval.min.toFixed(1)}, ${res.interval.max.toFixed(1)}]$ 上的最小值 $f_{\\min} = ${res.fMin.toFixed(2)}$。二次函数在闭区间上的最值只可能在顶点或端点取得，先看对称轴是否落在区间内，再决定比哪几个点。`,
        latex: `f_{\\min} = ${res.fMin.toFixed(2)} \\quad \\text{on } [${res.interval.min.toFixed(1)}, ${res.interval.max.toFixed(1)}]`,
        rubric:
          "【高考采分点】在约束区间上求出最小值（比较顶点与端点），得 3 分。",
      },
      {
        step: 3,
        title: "求解反思 · 判真假并写出否定命题",
        detail: `最小值 $f_{\\min} = ${res.fMin.toFixed(2)}$ 与阈值 $m = ${threshold.toFixed(2)}$ 比较，原命题为「${res.isOriginalTrue ? "真" : "假"}」，否定命题为「${res.isNegationTrue ? "真" : "假"}」。否定只改两处：量词互换、结论取反，其余原样不动。`,
        latex: `f_{\\min} = ${res.fMin.toFixed(2)} \\quad \\text{vs} \\quad m = ${threshold.toFixed(2)}`,
        rubric:
          "【高考采分点】用最小值与阈值比较判定真假，并按「换量词、否结论」写出否定命题，得 3 分。",
      },
    ],
    mnemonic:
      "全称改存在、存在改全称，正面结论变否定；恒成立找最值，证伪只需一反例",
  };
}
