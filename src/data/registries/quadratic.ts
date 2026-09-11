import type { ParamMeta } from "../types";
import { MATH_COLORS } from "@/theme";

export const defaultParams = {
  a: 1.0,
  b: -2.0,
  c: -3.0,
} as const;

export const paramMeta: Record<string, ParamMeta> = {
  a: {
    key: "a",
    label: "二次项系数 a",
    labelFormula: `\\text{二次项系数 } \\color{${MATH_COLORS.paramPrimary}}{a}`,
    min: -2.0,
    max: 2.0,
    step: 0.1,
    defaultValue: 1.0,
    importance: "core",
    description: "控制抛物线开口方向与胖瘦，为 0 时退化为直线",
    descriptionFormula: `二次项系数 $\\color{${MATH_COLORS.paramPrimary}}{a}$ 决定抛物线开口方向与张角，$a=0$ 时退化为一次直线`,
    marks: [
      {
        value: 0,
        variant: "critical",
        label: "退化为直线",
        labelFormula: "a = 0",
      },
    ],
  },
  b: {
    key: "b",
    label: "一次项系数 b",
    labelFormula: `\\text{一次项系数 } \\color{${MATH_COLORS.paramSecondary}}{b}`,
    min: -4.0,
    max: 4.0,
    step: 0.1,
    defaultValue: -2.0,
    importance: "core",
    description: "与 a 共同决定对称轴位置 x = -b/(2a)",
    descriptionFormula: `与 $\\color{${MATH_COLORS.paramPrimary}}{a}$ 共同决定对称轴位置 $x = -\\frac{b}{2a}$`,
  },
  c: {
    key: "c",
    label: "常数项 c",
    labelFormula: `\\text{常数项 } \\color{${MATH_COLORS.paramTertiary}}{c}`,
    min: -4.0,
    max: 4.0,
    step: 0.1,
    defaultValue: -3.0,
    importance: "core",
    description: "代表抛物线与 y 轴交点坐标 (0, c)",
    descriptionFormula: `代表抛物线与 $y$ 轴交点坐标 $(0, \\color{${MATH_COLORS.paramTertiary}}{c})$`,
  },
};
