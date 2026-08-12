/**
 * src/data/registries/secondDerivative.ts
 * 二阶导数与拐点实验室参数声明
 */

import type { ParamMeta } from "@/data/types";

export const defaultParams = {
  a: 0.5,
  b: 0,
  c: -1.5,
  d: 0,
  x0: 1.0,
  x1: -1.5,
  x2: 1.5,
};

export const paramMeta: Record<string, ParamMeta> = {
  a: {
    key: "a",
    label: "最高次项系数 a",
    labelFormula: "\\color{#EF4444}{a}",
    defaultValue: 0.5,
    min: -2,
    max: 2,
    step: 0.1,
    description: "控制函数的整体开口方向与凹凸程度",
    descriptionFormula: "a > 0 \\text{ 时下凸，} a < 0 \\text{ 时上凸}",
    importance: "core",
    marks: [
      {
        value: 0,
        label: "0",
        labelFormula: "0",
        variant: "critical",
      },
    ],
  },
  b: {
    key: "b",
    label: "二次项/系数 b",
    labelFormula: "\\color{#D97706}{b}",
    defaultValue: 0,
    min: -3,
    max: 3,
    step: 0.1,
    description: "决定三次函数拐点横坐标 x_0 = -b/(3a) 的平移",
    descriptionFormula:
      "x_0 = -\\frac{\\color{#D97706}{b}}{3\\color{#EF4444}{a}}",
    importance: "core",
  },
  c: {
    key: "c",
    label: "一次项系数 c",
    labelFormula: "\\color{#059669}{c}",
    defaultValue: -1.5,
    min: -4,
    max: 4,
    step: 0.1,
    description: "影响一阶导数与极值点的存在性与距离",
    descriptionFormula: "f'(x) \\text{ 中一次项系数}",
    importance: "advanced",
  },
  d: {
    key: "d",
    label: "常数项 d",
    labelFormula: "d",
    defaultValue: 0,
    min: -3,
    max: 3,
    step: 0.1,
    description: "函数整体上下平移量",
    importance: "advanced",
  },
  x0: {
    key: "x0",
    label: "切点探针 x0",
    labelFormula: "\\color{#EF4444}{x_0}",
    defaultValue: 1.0,
    min: -4,
    max: 4,
    step: 0.05,
    description: "切线与二阶导数实时检测探针",
    descriptionFormula: "\\text{观测 } f''(x_0) \\text{ 符号与切线位置}",
    importance: "core",
  },
  x1: {
    key: "x1",
    label: "琴生点 x1",
    labelFormula: "\\color{#D97706}{x_1}",
    defaultValue: -1.5,
    min: -4,
    max: 4,
    step: 0.1,
    description: "琴生不等式割线左侧端点",
    importance: "advanced",
  },
  x2: {
    key: "x2",
    label: "琴生点 x2",
    labelFormula: "\\color{#059669}{x_2}",
    defaultValue: 1.5,
    min: -4,
    max: 4,
    step: 0.1,
    description: "琴生不等式割线右侧端点",
    importance: "advanced",
  },
};
