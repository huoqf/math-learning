/**
 * src/features/second-derivative/constants.ts
 * 二阶导数与拐点实验室常量与图例配置
 */

import type { SceneLegendItem } from "@/components/Math";
import { MATH_COLORS } from "@/theme";

export function getSecondDerivativeLegendItems(
  studyMode: "concavity" | "inflection" | "jensen",
): SceneLegendItem[] {
  if (studyMode === "concavity") {
    return [
      {
        color: MATH_COLORS.function,
        label: "原函数",
        formula: "f(x)",
        style: "solid",
      },
      {
        color: MATH_COLORS.tangentLine,
        label: "切线",
        formula: "y = f'(x_0)(x - x_0) + f(x_0)",
        style: "solid",
      },
      {
        color: MATH_COLORS.focusPoint,
        label: "探针切点",
        formula: "P_0(x_0, f(x_0))",
        style: "point",
      },
      {
        color: MATH_COLORS.paramTertiary,
        label: "下凸凹区间 f''(x) > 0",
        style: "area",
      },
      {
        color: MATH_COLORS.paramSecondary,
        label: "上凸凸区间 f''(x) < 0",
        style: "area",
      },
    ];
  }

  if (studyMode === "inflection") {
    return [
      {
        color: MATH_COLORS.function,
        label: "原函数",
        formula: "f(x)",
        style: "solid",
      },
      {
        color: MATH_COLORS.vectorResult,
        label: "拐点",
        formula: "I(x_{\\text{inf}}, y_{\\text{inf}})",
        style: "point",
      },
      {
        color: MATH_COLORS.paramSecondary,
        label: "极值点",
        formula: "E(x_{\\text{ext}}, y_{\\text{ext}})",
        style: "point",
      },
    ];
  }

  return [
    {
      color: MATH_COLORS.function,
      label: "原函数",
      formula: "f(x)",
      style: "solid",
    },
    {
      color: MATH_COLORS.paramSecondary,
      label: "割线段",
      formula: "S_1S_2",
      style: "solid",
    },
    {
      color: MATH_COLORS.paramSecondary,
      label: "弦中点",
      formula: "M",
      style: "point",
    },
    {
      color: MATH_COLORS.paramTertiary,
      label: "弧中点",
      formula: "P",
      style: "point",
    },
  ];
}
