/**
 * src/data/registries/lineEquation.ts
 * 直线方程与点到直线的距离 声明式参数注册项
 */

import type { ParamMarkVariant } from "@/data/types";

export const defaultParams = {
  // 方程形式
  form: "general",

  // 一般式参数 Ax + By + C = 0
  A: 1,
  B: -1,
  C: -1,

  // 点斜式 k, x0, y0
  k: 1,
  x0: 2,
  y0: 3,

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
    importance?: "primary" | "secondary" | "advanced";
    marks?: Array<{ value: number; label?: string; labelFormula?: string; variant?: ParamMarkVariant }>;
  }
> = {
  A: {
    label: "A (x系数)",
    labelFormula: "A",
    defaultValue: 1,
    min: -5,
    max: 5,
    step: 0.5,
    description: "直线一般式方程中 x 的系数",
    descriptionFormula: "\\text{一般式 } Ax + By + C = 0 \\text{ 中 } x \\text{ 的系数}",
    importance: "primary",
    marks: [
      { value: 0, label: "A=0 (水平线)", labelFormula: "A=0", variant: "critical" },
    ],
  },
  B: {
    label: "B (y系数)",
    labelFormula: "B",
    defaultValue: -1,
    min: -5,
    max: 5,
    step: 0.5,
    description: "直线一般式方程中 y 的系数",
    descriptionFormula: "\\text{一般式 } Ax + By + C = 0 \\text{ 中 } y \\text{ 的系数}",
    importance: "primary",
    marks: [
      { value: 0, label: "B=0 (铅垂线)", labelFormula: "B=0", variant: "critical" },
    ],
  },
  C: {
    label: "C (常数项)",
    labelFormula: "C",
    defaultValue: -1,
    min: -6,
    max: 6,
    step: 0.5,
    description: "直线一般式方程的常数项",
    descriptionFormula: "\\text{常数项，控制直线的平移}",
    importance: "secondary",
    marks: [
      { value: 0, label: "C=0 (过原点)", labelFormula: "C=0", variant: "zero" },
    ],
  },
  k: {
    label: "k (斜率)",
    labelFormula: "k",
    defaultValue: 1,
    min: -4,
    max: 4,
    step: 0.1,
    description: "直线的斜率 (k = tan α)",
    descriptionFormula: "k = \\tan \\alpha",
    importance: "primary",
    marks: [
      { value: 0, label: "k=0 (水平)", labelFormula: "k=0", variant: "zero" },
    ],
  },
  x0: {
    label: "x₀ (点P/定点x)",
    labelFormula: "x_0",
    defaultValue: 2,
    min: -5,
    max: 5,
    step: 0.2,
    description: "动点 P 或已知定点的 x 坐标",
    descriptionFormula: "\\text{点 } P(x_0, y_0) \\text{ 的 } x \\text{ 坐标}",
    importance: "primary",
  },
  y0: {
    label: "y₀ (点P/定点y)",
    labelFormula: "y_0",
    defaultValue: 3,
    min: -4,
    max: 4,
    step: 0.2,
    description: "动点 P 或已知定点的 y 坐标",
    descriptionFormula: "\\text{点 } P(x_0, y_0) \\text{ 的 } y \\text{ 坐标}",
    importance: "secondary",
  },
  b: {
    label: "b (y截距)",
    labelFormula: "b",
    defaultValue: 1,
    min: -5,
    max: 5,
    step: 0.5,
    description: "直线在 y 轴上的截距",
    descriptionFormula: "y \\text{ 轴截距 } (0, b)",
    importance: "secondary",
  },
  a: {
    label: "a (x截距)",
    labelFormula: "a",
    defaultValue: 3,
    min: -5,
    max: 5,
    step: 0.5,
    description: "直线在 x 轴上的截距（不可为0）",
    descriptionFormula: "x \\text{ 轴截距 } (a, 0) \\quad a \\neq 0",
    importance: "primary",
    marks: [
      { value: 0, label: "a=0 (无效)", labelFormula: "a=0", variant: "critical" },
    ],
  },
  A2: {
    label: "A₂ (L₂系数)",
    labelFormula: "A_2",
    defaultValue: 1,
    min: -5,
    max: 5,
    step: 0.5,
    description: "第二条直线 L₂ 的 x 系数",
    descriptionFormula: "L_2 \\text{ 的 } x \\text{ 系数 } A_2",
    importance: "secondary",
  },
  B2: {
    label: "B₂ (L₂系数)",
    labelFormula: "B_2",
    defaultValue: 1,
    min: -5,
    max: 5,
    step: 0.5,
    description: "第二条直线 L₂ 的 y 系数",
    descriptionFormula: "L_2 \\text{ 的 } y \\text{ 系数 } B_2",
    importance: "secondary",
  },
  C2: {
    label: "C₂ (L₂常数)",
    labelFormula: "C_2",
    defaultValue: -2,
    min: -6,
    max: 6,
    step: 0.5,
    description: "第二条直线 L₂ 的常数项",
    descriptionFormula: "L_2 \\text{ 的常数项 } C_2",
    importance: "secondary",
  },
  lambda: {
    label: "λ (直线系参数)",
    labelFormula: "\\lambda",
    defaultValue: 1,
    min: -5,
    max: 5,
    step: 0.2,
    description: "直线系组合参数 L₁ + λ L₂ = 0",
    descriptionFormula: "L_1 + \\lambda L_2 = 0",
    importance: "advanced",
  },
};
