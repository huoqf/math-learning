/**
 * src/data/registries/secondDerivative.ts
 * 二阶导数与拐点实验室参数声明
 */

import type { ParamMeta } from "@/data/types";
import { MATH_COLORS } from "@/theme";

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
    labelFormula: `\\text{最高次项系数 } \\color{${MATH_COLORS.paramPrimary}}{a}`,
    defaultValue: 0.5,
    min: -2,
    max: 2,
    step: 0.1,
    importance: "core",
    group: "函数解析式核心参数",
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
    label: "二次项系数 b",
    labelFormula: `\\text{二次项系数 } \\color{${MATH_COLORS.paramSecondary}}{b}`,
    defaultValue: 0,
    min: -3,
    max: 3,
    step: 0.1,
    importance: "core",
    group: "函数解析式核心参数",
  },
  c: {
    key: "c",
    label: "一次项系数 c",
    labelFormula: `\\text{一次项系数 } \\color{${MATH_COLORS.paramTertiary}}{c}`,
    defaultValue: -1.5,
    min: -4,
    max: 4,
    step: 0.1,
    importance: "advanced",
    group: "函数解析式核心参数",
  },
  d: {
    key: "d",
    label: "常数项 d",
    labelFormula: "\\text{常数项 } d",
    defaultValue: 0,
    min: -3,
    max: 3,
    step: 0.1,
    importance: "advanced",
    group: "函数解析式核心参数",
  },
  x0: {
    key: "x0",
    label: "切点探针 x0",
    labelFormula: `\\text{切点探针 } \\color{${MATH_COLORS.paramPrimary}}{x_0}`,
    defaultValue: 1.0,
    min: -4,
    max: 4,
    step: 0.05,
    importance: "core",
    group: "探针与割线位置",
  },
  x1: {
    key: "x1",
    label: "割线左端点 x1",
    labelFormula: `\\text{割线左端点 } \\color{${MATH_COLORS.paramSecondary}}{x_1}`,
    defaultValue: -1.5,
    min: -4,
    max: 4,
    step: 0.1,
    importance: "advanced",
    group: "探针与割线位置",
  },
  x2: {
    key: "x2",
    label: "割线右端点 x2",
    labelFormula: `\\text{割线右端点 } \\color{${MATH_COLORS.paramTertiary}}{x_2}`,
    defaultValue: 1.5,
    min: -4,
    max: 4,
    step: 0.1,
    importance: "advanced",
    group: "探针与割线位置",
  },
};
