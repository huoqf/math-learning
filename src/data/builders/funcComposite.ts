import type { MathPanelData } from "../types";
import { calculatePiecewise, calculateComposite } from "@/math/composite";
import { MATH_COLORS } from "@/theme";

export function buildFuncCompositePanel(
  params: Record<string, number>,
  config?: Record<string, unknown>,
): MathPanelData {
  const subMode = (config?.subMode as string) || "piecewise";

  if (subMode === "piecewise") {
    const x0 = params.x0 ?? 1.0;
    const leftSlope = params.leftSlope ?? 1.0;
    const leftConst = params.leftConst ?? 0.0;
    const rightSlope = params.rightSlope ?? -0.5;
    const rightConst = params.rightConst ?? 1.5;

    const res = calculatePiecewise({
      x0,
      leftSlope,
      leftConst,
      rightSlope,
      rightConst,
    });

    const quantities: MathPanelData["quantities"] = [
      {
        label: "分界点",
        symbol: "x₀",
        value: x0.toFixed(1),
        color: MATH_COLORS.paramPrimary,
      },
      { label: "左段 x ≤ x₀ 极限", value: res.leftValAtX0.toFixed(2) },
      { label: "右段 x > x₀ 极限", value: res.rightValAtX0.toFixed(2) },
      {
        label: "连续状态",
        value: res.isContinuous ? "连续" : "存在跳跃断点",
        highlight: res.isContinuous ? "extreme" : "negative",
      },
    ];

    const theorems: MathPanelData["theorems"] = [
      {
        name: "分段函数连续条件",
        latex: "\\lim_{x \\to x_0^-} f(x) = \\lim_{x \\to x_0^+} f(x) = f(x_0)",
        level: "core",
        prerequisites: ["左右两侧函数在分界点处函数值相等"],
      },
    ];

    const gaokaoPoints: MathPanelData["gaokaoPoints"] = [
      {
        text: "分段函数求值策略：\u201C由外向内\u201D或\u201C自内向外\u201D逐步代入，优先判断自变量所在段的区间范围。",
        importance: "gaokao",
      },
      {
        text: "分段函数零点：需分别求各段的零点，并严格检验所得解是否落在该段的定义域内！",
        importance: "gaokao",
      },
    ];

    return {
      quantities,
      theorems,
      gaokaoPoints,
      warnings: [],
      mnemonic: "分段讨论看分界，代入先核定义域；零点分别求解验证。",
    };
  } else {
    const xSample = params.xSample ?? 1.5;
    const innerB = params.innerB ?? -2.0;
    const innerC = params.innerC ?? 2.0;
    const outerType = (config?.outerType as any) || "exp";

    const res = calculateComposite({ xSample, innerB, innerC, outerType });

    const quantities: MathPanelData["quantities"] = [
      {
        label: "自变量采样",
        symbol: "x",
        value: xSample.toFixed(1),
        color: MATH_COLORS.paramPrimary,
      },
      {
        label: "中间变量",
        symbol: "u = g(x)",
        value: Number.isFinite(res.u) ? res.u.toFixed(2) : "无意义",
        color: MATH_COLORS.paramSecondary,
      },
      {
        label: "复合终值",
        symbol: "y = f(u)",
        value: Number.isFinite(res.y) ? res.y.toFixed(2) : "无意义",
        color: MATH_COLORS.function,
      },
      {
        label: "内层单调性",
        value:
          res.innerMonotonicity === "increasing"
            ? "单调递增"
            : res.innerMonotonicity === "decreasing"
              ? "单调递减"
              : "驻点/极值点",
      },
      {
        label: "外层单调性",
        value:
          res.outerMonotonicity === "increasing"
            ? "单调递增"
            : res.outerMonotonicity === "decreasing"
              ? "单调递减"
              : "驻点",
      },
      {
        label: "复合单调性",
        value:
          res.compositeMonotonicity === "increasing"
            ? "🟢 单调递增"
            : res.compositeMonotonicity === "decreasing"
              ? "🔴 单调递减"
              : "🟡 驻点",
        highlight:
          res.compositeMonotonicity === "increasing" ? "extreme" : "negative",
      },
    ];

    const theorems: MathPanelData["theorems"] = [
      {
        name: "复合函数单调性法则 (同增异减)",
        latex:
          "y = f(g(x)) \\quad (\\text{增}+\\text{增}\\to\\text{增},\\, \\text{减}+\\text{减}\\to\\text{增},\\, \\text{增}+\\text{减}\\to\\text{减})",
        level: "core",
        prerequisites: ["g(x) 在区间 I 上单调", "f(u) 在 g(I) 上单调"],
      },
    ];

    const gaokaoPoints: MathPanelData["gaokaoPoints"] = [
      {
        text: "复合函数值域核心：求解 y = f(g(x)) 的值域时，必须先求内层 u = g(x) 的值域 U，再求外层 f(u) 在定义域 U 上的值域！直接忽略内层值域是高考最高频错因。",
        importance: "gaokao",
      },
    ];

    const warnings: MathPanelData["warnings"] = [];
    if (!res.isValid && res.warningMessage) {
      warnings.push({ text: res.warningMessage, level: "warning" });
    }

    return {
      quantities,
      theorems,
      gaokaoPoints,
      warnings,
      mnemonic: res.ruleMnemonic,
    };
  }
}
