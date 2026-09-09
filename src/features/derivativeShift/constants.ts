/**
 * src/features/derivativeShift/constants.ts
 * 极值点偏移与隐零点实验室常量与图例配置
 */

import type { SceneLegendItem } from "@/components/Math";
import { MATH_COLORS } from "@/theme";

export type ShiftMode = "implicit_zero" | "shift_symmetric" | "log_mean";
export type ShiftSubModel = "x_ln_x" | "exp_linear" | "xe_neg_x" | "ln_x_div_x";

export function getDerivativeShiftLegendItems(
  activeMode: ShiftMode,
  subModel: ShiftSubModel,
): SceneLegendItem[] {
  if (activeMode === "implicit_zero") {
    return [
      {
        color: MATH_COLORS.function,
        label: "原函数",
        formula:
          subModel === "x_ln_x"
            ? "f(x) = x\\ln x + \\frac{1}{2}x^2 - ax"
            : "f(x) = e^x - \\frac{1}{2}x^2 - ax",
        style: "solid",
      },
      {
        color: MATH_COLORS.derivative,
        label: "导函数",
        formula:
          subModel === "x_ln_x"
            ? "f'(x) = \\ln x + x + 1 - a"
            : "f'(x) = e^x - x - a",
        style: "dash",
      },
      {
        color: MATH_COLORS.trace,
        label: "消元轨迹",
        formula:
          subModel === "x_ln_x"
            ? "h(x) = -\\frac{1}{2}x^2 - x"
            : "h(x) = e^x(1 - x) + \\frac{1}{2}x^2",
        style: "dot",
      },
      {
        color: MATH_COLORS.paramPrimary,
        label: "极值消元点",
        formula: "P(x_0, f(x_0))",
        style: "point",
      },
      {
        color: MATH_COLORS.derivative,
        label: "导数零点",
        formula: "x_0",
        style: "hollow-point",
      },
    ];
  }

  if (activeMode === "shift_symmetric") {
    return [
      {
        color: MATH_COLORS.function,
        label: "原函数",
        formula:
          subModel === "xe_neg_x"
            ? "f(x) = xe^{-x}"
            : "f(x) = \\frac{\\ln x}{x}",
        style: "solid",
      },
      {
        color: MATH_COLORS.paramPrimary,
        label: "对称曲线",
        formula: "y = f(2x_0 - x)",
        style: "dash",
      },
      {
        color: MATH_COLORS.secantLine,
        label: "水平割线",
        formula: "y = k",
        style: "solid",
      },
      {
        color: MATH_COLORS.focusPoint,
        label: "割线双交点",
        formula: "P_1, P_2",
        style: "point",
      },
      {
        color: MATH_COLORS.paramPrimary,
        label: "对称构造点",
        formula: "P'_1(2x_0 - x_1, k)",
        style: "point",
      },
      {
        color: MATH_COLORS.paramTertiary,
        label: "弦中点",
        formula: "M\\left(\\frac{x_1+x_2}{2}, k\\right)",
        style: "point",
      },
    ];
  }

  return [
    {
      color: MATH_COLORS.function,
      label: "对数曲线",
      formula: "f(x) = \\ln x",
      style: "solid",
    },
    {
      color: MATH_COLORS.secantLine,
      label: "割线",
      formula: "P_1P_2",
      style: "solid",
    },
    {
      color: MATH_COLORS.tangentLine,
      label: "平行切线点",
      formula: "T(L, \\ln L)",
      style: "point",
    },
    {
      color: MATH_COLORS.paramSecondary,
      label: "几何均值",
      formula: "G = \\sqrt{x_1 x_2}",
      style: "point",
    },
    {
      color: MATH_COLORS.paramPrimary,
      label: "对数均值",
      formula: "L = L(x_1, x_2)",
      style: "point",
    },
    {
      color: MATH_COLORS.paramTertiary,
      label: "算术均值",
      formula: "A = \\frac{x_1 + x_2}{2}",
      style: "point",
    },
  ];
}
