import type { MathPanelData } from "../types";
import { calculateExpLog, calculatePowerFunction } from "@/math/function";
import { MATH_COLORS } from "@/theme";

export function buildFuncExpLogPanel(
  params: Record<string, number>,
  config?: { subExpLog?: string },
): MathPanelData {
  const subType = config?.subExpLog ?? "exponential";

  // 1. 幂函数模式
  if (subType === "power") {
    const alpha = params.powerAlpha ?? 2.0;
    const x0 = params.x0 ?? 1.5;
    const powerRes = calculatePowerFunction(alpha, x0);

    const quantities: MathPanelData["quantities"] = [
      {
        label: "指数 α",
        symbol: "\\alpha",
        value: alpha.toFixed(1),
        color: MATH_COLORS.paramPrimary,
      },
      { label: "自变量 x₀", symbol: "x_0", value: x0.toFixed(2) },
      {
        label: "函数值 y₀",
        symbol: "x_0^{\\alpha}",
        value: powerRes.isValidPoint ? powerRes.yVal.toFixed(2) : "无定义",
        color: MATH_COLORS.function,
      },
      {
        label: "定义域",
        value: powerRes.domainDescription,
      },
      {
        label: "奇偶性",
        value: powerRes.parityDescription,
      },
      {
        label: "(0,+∞) 单调性",
        value: powerRes.monotonicityPositive,
        highlight: alpha > 0 ? "positive" : alpha < 0 ? "extreme" : undefined,
      },
    ];

    const theorems: MathPanelData["theorems"] = [
      {
        name: "幂函数概念与第一象限通用性质",
        latex: "y = x^{\\alpha} \\quad (x > 0)",
        level: "core",
        prerequisites: ["图象必过定点 (1, 1)", "在 (0, +∞) 上均有定义"],
      },
      {
        name: "高考常见 5 种基准幂函数",
        latex:
          "y=x, \\quad y=x^2, \\quad y=x^3, \\quad y=x^{-1}, \\quad y=x^{1/2}",
        level: "important",
        prerequisites: ["奇偶性判定", "定义域分析"],
      },
      {
        name: "第一象限图象变化特征",
        latex:
          "\\alpha > 1: \\text{凸向上递增}; \\quad 0 < \\alpha < 1: \\text{凹向下递增}; \\quad \\alpha < 0: \\text{减函数且含双渐近线}",
        level: "important",
        prerequisites: ["x > 0", "α ≠ 0"],
      },
    ];

    const gaokaoPoints: MathPanelData["gaokaoPoints"] = [
      {
        text: "高考必考定点：所有幂函数图象在第一象限内必过定点 (1, 1)；当 α > 0 时图象必过原点 (0, 0)。",
        importance: "gaokao",
      },
      {
        text: "第一象限图象比较策略：取 x = 2，看图象的高低，y 值越大对应的指数 α 越大。",
        importance: "gaokao",
      },
    ];

    const warnings: MathPanelData["warnings"] = [];
    if (powerRes.warningMessage) {
      warnings.push({
        text: powerRes.warningMessage,
        level: "danger",
      });
    }

    return {
      quantities,
      theorems,
      gaokaoPoints,
      warnings,
      mnemonic: "第一象限必过(1,1)，α大于0增且过原点；取x=2高者指数大。",
    };
  }

  // 2. 指数与对数模式
  const a = params.baseA ?? 2.0;
  const x0 = params.x0 ?? 1.5;
  const expLogRes = calculateExpLog(a, x0);

  const quantities: MathPanelData["quantities"] = [
    {
      label: "底数 a",
      symbol: "a",
      value: a.toFixed(1),
      color: MATH_COLORS.paramPrimary,
    },
    { label: "自变量 x₀", symbol: "x₀", value: x0.toFixed(2) },
    {
      label: subType === "logarithmic" ? "对数函数值" : "指数函数值",
      symbol: subType === "logarithmic" ? "\\log_a(x_0)" : "a^{x_0}",
      value:
        subType === "logarithmic"
          ? expLogRes.isValidBase && Number.isFinite(expLogRes.logVal)
            ? expLogRes.logVal.toFixed(2)
            : "无意义"
          : expLogRes.isValidBase
            ? expLogRes.expVal.toFixed(2)
            : "无意义",
      color: MATH_COLORS.function,
    },
    {
      label: subType === "logarithmic" ? "对称指数值" : "对称对数值",
      symbol: subType === "logarithmic" ? "a^{x_0}" : "\\log_a(x_0)",
      value:
        subType === "logarithmic"
          ? expLogRes.isValidBase
            ? expLogRes.expVal.toFixed(2)
            : "无意义"
          : expLogRes.isValidBase && Number.isFinite(expLogRes.logVal)
            ? expLogRes.logVal.toFixed(2)
            : "无意义",
      color: MATH_COLORS.functionTransformed,
    },
    {
      label: "单调状态",
      value:
        a > 1
          ? "单调递增 (a > 1)"
          : a > 0 && a < 1
            ? "单调递减 (0 < a < 1)"
            : "退化/无定义",
      highlight: a > 1 ? "extreme" : "positive",
    },
  ];

  const theorems: MathPanelData["theorems"] = [
    {
      name: "指数与对数互为反函数关系",
      latex: "y = a^x \\iff x = \\log_a y \\quad (a > 0, a \\neq 1)",
      level: "core",
      prerequisites: ["a > 0", "a ≠ 1", "x ∈ ℝ, y > 0"],
    },
    {
      name: "反函数图像对称定理",
      latex:
        "\\small\\text{互为反函数的两个函数图象关于直线 } y = x \\text{ 轴对称}",
      level: "important",
      prerequisites: ["定义域与值域互换"],
    },
    {
      name: "对数换底公式与运算法则",
      latex:
        "\\log_a b = \\frac{\\ln b}{\\ln a}, \\quad \\log_a(MN) = \\log_a M + \\log_a N",
      level: "important",
      prerequisites: ["M > 0", "N > 0"],
    },
  ];

  const gaokaoPoints: MathPanelData["gaokaoPoints"] = [
    {
      text: "高考高频定点：指数函数 y = a^x 必过定点 (0, 1)，渐近线 y = 0；对数函数 y = log_a x 必过定点 (1, 0)，渐近线 x = 0。",
      importance: "gaokao",
    },
    {
      text: "反函数三要素：① 定义域与值域互换；② 图象关于 y = x 对称；③ 只有严格单调函数才存在同单调性的反函数。",
      importance: "gaokao",
    },
  ];

  const warnings: MathPanelData["warnings"] = [];
  if (expLogRes.baseWarning) {
    warnings.push({
      text: expLogRes.baseWarning,
      level: "danger",
    });
  }

  return {
    quantities,
    theorems,
    gaokaoPoints,
    warnings,
    mnemonic: "指过(0,1)对过(1,0)，底过1增小1减；y=x对称反函数。",
  };
}
