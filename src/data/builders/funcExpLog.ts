import type { MathPanelData } from "../types";
import { calculateExpLog } from "@/math/function";
import { MATH_COLORS } from "@/theme";

export function buildFuncExpLogPanel(
  params: Record<string, number>,
): MathPanelData {
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
      label: "指数函数值",
      symbol: "a^(x₀)",
      value: expLogRes.isValidBase ? expLogRes.expVal.toFixed(2) : "无意义",
      color: MATH_COLORS.function,
    },
    {
      label: "对数函数值",
      symbol: "log_a(x₀)",
      value:
        expLogRes.isValidBase && Number.isFinite(expLogRes.logVal)
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
      latex: "\\text{互为反函数的两个函数图象关于直线 } y = x \\text{ 轴对称}",
      level: "important",
      prerequisites: ["定义域与值域互换"],
    },
    {
      name: "对数换底公式与对数运算法则",
      latex:
        "\\log_a b = \\frac{\\ln b}{\\ln a}, \\quad \\log_a(MN) = \\log_a M + \\log_a N",
      level: "important",
      prerequisites: ["M > 0", "N > 0"],
    },
  ];

  const gaokaoPoints: MathPanelData["gaokaoPoints"] = [
    {
      text: "高考高频定点：指数函数 y = a^x 必过定点 (0, 1)；对数函数 y = log_a x 必过定点 (1, 0)。",
      importance: "gaokao",
    },
    {
      text: "反函数三要要素：① 定义域与值域互换；② 图象关于 y = x 对称；③ 只有严格单调函数才存在单调性相同的反函数。",
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
