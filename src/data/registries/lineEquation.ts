/**
 * src/data/registries/lineEquation.ts
 * 直线方程与点到直线的距离 声明式参数注册项
 */

import type { ParamMarkVariant } from "@/data/types";
import { MATH_COLORS } from "@/theme";

export const defaultParams = {
  // 方程形式
  form: "general",

  // 一般式参数 Ax + By + C = 0
  A: 1,
  B: -1,
  C: -1,

  // 点斜式 k, x0, y0
  k: 1,
  x0: 0,
  y0: 1,

  // 斜截式 k, b
  b: 1,

  // 两点式 (x1, y1), (x2, y2)
  x1: -2,
  y1: -1,
  x2: 2,
  y2: 3,

  // 截距式 a, b
  a: 3,

  // 第二条直线 L2: A2 x + B2 y + C2 = 0 (用于两线位置关系模式)
  A2: 1,
  B2: 1,
  C2: -2,

  // 直线系参数 lambda
  lambda: 1,
};

const c1 = MATH_COLORS.paramPrimary; // #EF4444
const c2 = MATH_COLORS.paramSecondary; // #D97706
const c3 = MATH_COLORS.paramTertiary; // #059669

export const paramMeta: Record<
  string,
  {
    label: string;
    labelFormula?: string;
    defaultValue?: number;
    min: number;
    max: number;
    step?: number;
    description: string;
    descriptionFormula?: string;
    importance?: "core" | "advanced" | "display";
    marks?: Array<{
      value: number;
      label?: string;
      labelFormula?: string;
      variant?: ParamMarkVariant;
    }>;
  }
> = {
  A: {
    label: "A (x系数)",
    labelFormula: `\\text{x 系数 } \\color{${c1}}{A}`,
    defaultValue: 1,
    min: -5,
    max: 5,
    step: 0.5,
    description: "直线一般式方程中 x 的系数",
    descriptionFormula: `\\text{一般式 } \\color{${c1}}{A}x + By + C = 0 \\text{ 中 } x \\text{ 的系数}`,
    importance: "core",
    marks: [
      {
        value: 0,
        label: "A=0 (水平线)",
        labelFormula: "A=0",
        variant: "critical",
      },
    ],
  },
  B: {
    label: "B (y系数)",
    labelFormula: `\\text{y 系数 } \\color{${c2}}{B}`,
    defaultValue: -1,
    min: -5,
    max: 5,
    step: 0.5,
    description: "直线一般式方程中 y 的系数",
    descriptionFormula: `\\text{一般式 } Ax + \\color{${c2}}{B}y + C = 0 \\text{ 中 } y \\text{ 的系数}`,
    importance: "core",
    marks: [
      {
        value: 0,
        label: "B=0 (铅垂线)",
        labelFormula: "B=0",
        variant: "critical",
      },
    ],
  },
  C: {
    label: "C (常数项)",
    labelFormula: `\\text{常数项 } \\color{${c3}}{C}`,
    defaultValue: -1,
    min: -6,
    max: 6,
    step: 0.5,
    description: "直线一般式方程的常数项",
    descriptionFormula: "\\text{常数项，控制直线的平移}",
    importance: "advanced",
    marks: [
      { value: 0, label: "C=0 (过原点)", labelFormula: "C=0", variant: "zero" },
    ],
  },
  k: {
    label: "k (斜率)",
    labelFormula: `\\text{斜率 } \\color{${c1}}{k}`,
    defaultValue: 1,
    min: -4,
    max: 4,
    step: 0.1,
    description: "直线的斜率 (k = tan α)",
    descriptionFormula: `\\color{${c1}}{k} = \\tan \\alpha`,
    importance: "core",
    marks: [
      { value: 0, label: "k=0 (水平)", labelFormula: "k=0", variant: "zero" },
    ],
  },
  x0: {
    label: "x₀ (点P/定点x)",
    labelFormula: `\\text{横坐标 } \\color{${c1}}{x_0}`,
    defaultValue: 2,
    min: -5,
    max: 5,
    step: 0.2,
    description: "动点 P 或已知定点的 x 坐标",
    descriptionFormula: `\\text{点 } P(\\color{${c1}}{x_0}, y_0) \\text{ 的 } x \\text{ 坐标}`,
    importance: "core",
  },
  y0: {
    label: "y₀ (点P/定点y)",
    labelFormula: `\\text{纵坐标 } \\color{${c2}}{y_0}`,
    defaultValue: 3,
    min: -4,
    max: 4,
    step: 0.2,
    description: "动点 P 或已知定点的 y 坐标",
    descriptionFormula: `\\text{点 } P(x_0, \\color{${c2}}{y_0}) \\text{ 的 } y \\text{ 坐标}`,
    importance: "advanced",
  },
  b: {
    label: "b (y截距)",
    labelFormula: `\\text{y 截距 } \\color{${c2}}{b}`,
    defaultValue: 1,
    min: -5,
    max: 5,
    step: 0.5,
    description: "直线在 y 轴上的截距",
    descriptionFormula: `y \\text{ 轴截距 } (0, \\color{${c2}}{b})`,
    importance: "advanced",
  },
  a: {
    label: "a (x截距)",
    labelFormula: `\\text{x 截距 } \\color{${c1}}{a}`,
    defaultValue: 3,
    min: -5,
    max: 5,
    step: 0.5,
    description: "直线在 x 轴上的截距（不可为0）",
    descriptionFormula: `x \\text{ 轴截距 } (\\color{${c1}}{a}, 0) \\quad a \\neq 0`,
    importance: "core",
    marks: [
      {
        value: 0,
        label: "a=0 (无效)",
        labelFormula: "a=0",
        variant: "critical",
      },
    ],
  },
  x1: {
    label: "x₁ (点P₁横坐标)",
    labelFormula: `\\text{点 P₁ 横坐标 } \\color{${c2}}{x_1}`,
    defaultValue: -2,
    min: -5,
    max: 5,
    step: 0.2,
    description: "两点式已知点 P₁ 的 x 坐标",
    descriptionFormula: `\\text{点 } P_1(\\color{${c2}}{x_1}, y_1) \\text{ 的 } x \\text{ 坐标}`,
    importance: "core",
  },
  y1: {
    label: "y₁ (点P₁纵坐标)",
    labelFormula: `\\text{点 P₁ 纵坐标 } \\color{${c2}}{y_1}`,
    defaultValue: -1,
    min: -4,
    max: 4,
    step: 0.2,
    description: "两点式已知点 P₁ 的 y 坐标",
    descriptionFormula: `\\text{点 } P_1(x_1, \\color{${c2}}{y_1}) \\text{ 的 } y \\text{ 坐标}`,
    importance: "core",
  },
  x2: {
    label: "x₂ (点P₂横坐标)",
    labelFormula: `\\text{点 P₂ 横坐标 } \\color{${c3}}{x_2}`,
    defaultValue: 2,
    min: -5,
    max: 5,
    step: 0.2,
    description: "两点式已知点 P₂ 的 x 坐标",
    descriptionFormula: `\\text{点 } P_2(\\color{${c3}}{x_2}, y_2) \\text{ 的 } x \\text{ 坐标}`,
    importance: "core",
  },
  y2: {
    label: "y₂ (点P₂纵坐标)",
    labelFormula: `\\text{点 P₂ 纵坐标 } \\color{${c3}}{y_2}`,
    defaultValue: 3,
    min: -4,
    max: 4,
    step: 0.2,
    description: "两点式已知点 P₂ 的 y 坐标",
    descriptionFormula: `\\text{点 } P_2(x_2, \\color{${c3}}{y_2}) \\text{ 的 } y \\text{ 坐标}`,
    importance: "core",
  },
  A2: {
    label: "A₂ (L₂系数)",
    labelFormula: `\\text{L₂ x 系数 } \\color{${c2}}{A_2}`,
    defaultValue: 1,
    min: -5,
    max: 5,
    step: 0.5,
    description: "第二条直线 L₂ 的 x 系数",
    descriptionFormula: `L_2 \\text{ 的 } x \\text{ 系数 } \\color{${c2}}{A_2}`,
    importance: "advanced",
  },
  B2: {
    label: "B₂ (L₂系数)",
    labelFormula: `\\text{L₂ y 系数 } \\color{${c2}}{B_2}`,
    defaultValue: 1,
    min: -5,
    max: 5,
    step: 0.5,
    description: "第二条直线 L₂ 的 y 系数",
    descriptionFormula: `L_2 \\text{ 的 } y \\text{ 系数 } \\color{${c2}}{B_2}`,
    importance: "advanced",
  },
  C2: {
    label: "C₂ (L₂常数)",
    labelFormula: `\\text{L₂ 常数项 } \\color{${c3}}{C_2}`,
    defaultValue: -2,
    min: -6,
    max: 6,
    step: 0.5,
    description: "第二条直线 L₂ 的常数项",
    descriptionFormula: `L_2 \\text{ 的常数项 } \\color{${c3}}{C_2}`,
    importance: "advanced",
  },
  lambda: {
    label: "λ (直线系参数)",
    labelFormula: `\\text{参数 } \\color{${c3}}{\\lambda}`,
    defaultValue: 1,
    min: -5,
    max: 5,
    step: 0.2,
    description: "直线系组合参数 L₁ + λ L₂ = 0",
    descriptionFormula: `L_1 + \\color{${c3}}{\\lambda} L_2 = 0`,
    importance: "advanced",
  },
};
