/**
 * src/data/builders/derivativeMonotonicity.ts
 * 导数与单调性及极值看板数据组装器
 */

import type {
  MathPanelData,
  MathQuantity,
  Theorem,
  GaokaoPoint,
  WarningItem,
} from "../types";
import {
  solveMonotonicityModel,
  formatFloat,
  type MonotonicityModelKey,
} from "@/math/derivativeMonotonicity";
import { MATH_COLORS } from "@/theme";

export function buildDerivativeMonotonicityQuantities(
  params: Record<string, number>,
  config?: { modelKey?: MonotonicityModelKey; mode?: string },
): MathPanelData {
  const modelKey: MonotonicityModelKey = config?.modelKey || "cubic_param";
  const a = params.a ?? 1.0;
  const x0 = params.x0 ?? 1.0;

  const result = solveMonotonicityModel(modelKey, a);
  const fx0 = result.fn(x0);
  const fpx0 = result.derivativeFn(x0);

  const fx0Str = Number.isFinite(fx0) ? formatFloat(fx0) : "无定义";
  const fpx0Str = Number.isFinite(fpx0) ? formatFloat(fpx0) : "无定义";

  let slopeStatus = "无定义";
  let slopeHighlight: MathQuantity["highlight"] = undefined;
  if (Number.isFinite(fpx0)) {
    if (Math.abs(fpx0) < 1e-5) {
      slopeStatus = "切线水平 (驻点 f'(x₀) = 0)";
      slopeHighlight = "zero";
    } else if (fpx0 > 0) {
      slopeStatus = "单调递增 (f'(x₀) > 0, 切线斜率 k > 0)";
      slopeHighlight = "positive";
    } else {
      slopeStatus = "单调递减 (f'(x₀) < 0, 切线斜率 k < 0)";
      slopeHighlight = "negative";
    }
  }

  // 整理单调区间 LaTeX
  const incIntervals = result.monotonicIntervals
    .filter((it) => it.type === "increasing")
    .map((it) => it.latex)
    .join(", ");
  const decIntervals = result.monotonicIntervals
    .filter((it) => it.type === "decreasing")
    .map((it) => it.latex)
    .join(", ");

  const quantities: MathQuantity[] = [
    {
      label: "当前函数解析式",
      value: result.latex,
    },
    {
      label: "导函数解析式 f'(x)",
      value: result.derivativeLatex,
      color: MATH_COLORS.derivative,
    },
    {
      label: "动点切线状态",
      value: `x₀ = ${formatFloat(x0)}, f(x₀) = ${fx0Str}, f'(x₀) = ${fpx0Str} (${slopeStatus})`,
      color: MATH_COLORS.tangentLine,
      highlight: slopeHighlight,
    },
    {
      label: "单调递增区间 (f'(x) > 0)",
      value: incIntervals || "无",
      color: MATH_COLORS.vectorSecondary,
    },
    {
      label: "单调递减区间 (f'(x) < 0)",
      value: decIntervals || "无",
      color: MATH_COLORS.paramPrimary,
    },
  ];

  // 极值点数学量
  if (result.extrema.length > 0) {
    const extremaStr = result.extrema
      .map(
        (e) =>
          `x = ${formatFloat(e.x)} (${e.type === "maximum" ? "极大值 " : e.type === "minimum" ? "极小值 " : "驻点 "}${formatFloat(e.y)})`,
      )
      .join("；");

    quantities.push({
      label: "极值点与驻点列表",
      value: extremaStr,
      color: MATH_COLORS.focusPoint,
      highlight: "extreme",
    });
  } else {
    quantities.push({
      label: "极值点",
      value: "无极值点 (全域单调)",
    });
  }

  // 定理清单
  const theorems: Theorem[] = [
    {
      name: "导数与单调性判定定理",
      latex:
        "\\begin{cases} f'(x) > 0 \\implies f(x) \\text{ 严格单调递增} \\\\ f'(x) < 0 \\implies f(x) \\text{ 严格单调递减} \\end{cases}",
      condition: "函数 f(x) 在开区间 (a, b) 内可导",
      prerequisites: [
        "若在区间内 f'(x) > 0 (除有限个点外)，则 f(x) 为增函数",
        "若在区间内 f'(x) < 0 (除有限个点外)，则 f(x) 为减函数",
        "若在区间内 f'(x) = 0 恒成立，则 f(x) 为常数函数",
      ],
      note: "导数的正负决定了切线斜率的正负，进而决定了函数的增减走势。",
      level: "core",
      mode: "block",
    },
    {
      name: "极值点第一充分条件 (变号零点法则)",
      latex:
        "\\begin{aligned} &\\text{左正右负 } (+\\to 0 \\to -) \\implies \\text{极大值点} \\\\ &\\text{左负右正 } (-\\to 0 \\to +) \\implies \\text{极小值点} \\\\ &\\text{两侧同号 } (+\\to 0 \\to +) \\implies \\text{驻点非极值} \\end{aligned}",
      condition: "设 f(x) 在 x₀ 处连续且在左右邻域内可导，f'(x₀) = 0",
      prerequisites: [
        "极值是局部的几何性质，反映点附近的小范围峰谷形态",
        "极大值不一定大于极小值；端点绝不能取作极值点",
      ],
      note: "可导函数在极值点处切线必定水平 (f'(x₀)=0)，但切线水平的点不一定是极值点（必须穿零变号）。",
      level: "core",
      mode: "block",
    },
  ];

  // 高考考点
  const gaokaoPoints: GaokaoPoint[] = [
    {
      text: "高考导数大题第一问：单调性讨论标准五步法（求定义域 → 准确求导 → 因式分解求零点 → 依参数分类讨论 → 列表下结论）",
      importance: "gaokao",
    },
    {
      text: "单调性充要条件判定陷阱：f'(x) > 0 是 f(x) 递增的充分不必要条件；已知 f(x) 在区间上单调递增，必要条件为 f'(x) ≥ 0 且不恒为0",
      importance: "core",
    },
    {
      text: "含参分类讨论核心分界依据：依判别式 Δ=0、零点大小排序或零点进入定义域情况划分讨论分段",
      importance: "hard",
    },
  ];

  // 退化与易错警示
  const warnings: WarningItem[] = [
    {
      text: "警示：驻点 ≠ 极值点！例如 f(x) = x³ 在 x = 0 处 f'(0) = 0，但两侧导数均为正，函数穿过零点单调递增，x=0 不是极值点。",
      level: "danger",
    },
    {
      text: "规范警示：单调区间切忌用并集符号 ∪ 连接！定义域断裂时（如 f(x)=1/x 或对勾函数），减区间必须写作 (-∞, 0) 和 (0, +∞)。",
      level: "warning",
    },
    {
      text: "认知警示：极大值不一定大于极小值！极值仅反映局部邻域内的最值，与全局最大值/最小值有本质区别。",
      level: "info",
    },
  ];

  return {
    quantities,
    theorems,
    gaokaoPoints,
    warnings,
    mnemonic:
      "求导因式先看域，穿零变号极值立；左正右负极大顶，左负右正极小底；区间断裂莫并集，含参讨论依根析！",
  };
}
