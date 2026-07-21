import type { MathPanelData } from "../types";
import { evalFunctionParity } from "@/math/function";
import { MATH_COLORS } from "@/theme";

export function buildFuncPropertiesPanel(
  params: Record<string, number>,
  config?: Record<string, unknown>,
): MathPanelData {
  const x0 = params.x0 ?? 1.5;
  const fnType = ((config?.fnType as string) || "cubic") as
    "cubic" | "quadratic" | "abs" | "reciprocal";
  const parityRes = evalFunctionParity(fnType, x0);

  const quantities: MathPanelData["quantities"] = [
    {
      label: "采样自变量 x₀",
      symbol: "x₀",
      value: x0.toFixed(2),
      color: MATH_COLORS.paramPrimary,
    },
    {
      label: "函数值 f(x₀)",
      symbol: "f(x₀)",
      value: Number.isFinite(parityRes.fx) ? parityRes.fx.toFixed(2) : "无定义",
      color: MATH_COLORS.function,
    },
    {
      label: "对称点值 f(-x₀)",
      symbol: "f(-x₀)",
      value: Number.isFinite(parityRes.fNegX)
        ? parityRes.fNegX.toFixed(2)
        : "无定义",
      color: MATH_COLORS.functionTransformed,
    },
    {
      label: "奇偶性判定",
      value:
        parityRes.parity === "even"
          ? "偶函数 (Even)"
          : parityRes.parity === "odd"
            ? "奇函数 (Odd)"
            : "非奇非偶",
      highlight: parityRes.parity !== "neither" ? "extreme" : "positive",
    },
  ];

  const theorems: MathPanelData["theorems"] = [
    {
      name: "奇函数与偶函数严格定义",
      latex:
        "\\text{偶函数: } f(-x) = f(x), \\quad \\text{奇函数: } f(-x) = -f(x)",
      level: "core",
      prerequisites: ["定义域必须关于坐标原点对称！"],
    },
    {
      name: "函数图像对称性定理",
      latex:
        "f(a + x) = f(a - x) \\iff \\text{图象关于直线 } x = a \\text{ 轴对称}",
      level: "important",
      prerequisites: ["定义域关于 x = a 对称"],
    },
    {
      name: "周期性与对称性组合推导",
      latex:
        "\\text{若 } f(x) \\text{ 关于 } x=a \\text{ 与 } x=b \\text{ 均对称 } \\Rightarrow T = 2|a - b|",
      level: "important",
      prerequisites: ["a ≠ b"],
    },
  ];

  const gaokaoPoints: MathPanelData["gaokaoPoints"] = [
    {
      text: "高考第一陷阱：研究奇偶性或单调性前，必须首先确定函数的定义域！定义域如果不关于原点对称，直接判定为非奇非偶函数。",
      importance: "gaokao",
    },
    {
      text: "奇函数在原点处的性质：若奇函数 f(x) 在 x = 0 处有定义，则必有 f(0) = 0！这是高考特值秒杀的关键。",
      importance: "gaokao",
    },
    {
      text: "单调性与奇偶性复合：奇函数在对称区间上的单调性相同；偶函数在对称区间上的单调性相反。",
      importance: "core",
    },
  ];

  const warnings: MathPanelData["warnings"] = [];
  if (fnType === "reciprocal" && Math.abs(x0) < 1e-4) {
    warnings.push({
      text: "x = 0 处反比例函数无定义！",
      level: "danger",
    });
  }

  return {
    quantities,
    theorems,
    gaokaoPoints,
    warnings,
    mnemonic: "定义域先看对称否，奇在原点f(0)=0，双轴对称周期现。",
  };
}
