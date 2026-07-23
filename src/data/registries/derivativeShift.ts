/**
 * src/data/registries/derivativeShift.ts
 * 隐零点定理与极值点偏移 参数注册表
 */

import type { ParamMeta } from "../types";

export const defaultParams = {
  a: 1.5, // 隐零点参数 a
  k: 0.25, // 割线高度 y = k
  x1: 0.3, // 对数均值不等式 x1
  x2: 2.5, // 对数均值不等式 x2
} as const;

export const paramMeta: Record<string, ParamMeta> = {
  a: {
    key: "a",
    label: "函数参数 a",
    labelFormula: "a",
    min: 0.1,
    max: 3.5,
    step: 0.05,
    defaultValue: 1.5,
    importance: "core",
    description: "控制导函数零点位置及原函数极值高度",
    descriptionFormula: "控制导函数零点 $x_0$ 及原函数极值 $f(x_0)$",
    marks: [
      {
        value: 1.0,
        variant: "critical",
        label: "标准界",
        labelFormula: "a = 1.0",
      },
    ],
  },
  k: {
    key: "k",
    label: "割线高度 k",
    labelFormula: "k",
    min: 0.05,
    max: 0.35,
    step: 0.01,
    defaultValue: 0.25,
    importance: "core",
    description: "割线 y = k 截原函数的两根 x1 与 x2",
    descriptionFormula: "割线 $y = k$ 截原函数的两根 $x_1, x_2$",
    marks: [
      {
        value: 0.368,
        variant: "critical",
        label: "极值临界",
        labelFormula: "k_{max} = 1/e",
      },
    ],
  },
  x1: {
    key: "x1",
    label: "端点 x1",
    labelFormula: "x_1",
    min: 0.1,
    max: 2.0,
    step: 0.05,
    defaultValue: 0.3,
    importance: "display",
    description: "对数均值不等式左端点",
    descriptionFormula: "对数均值不等式左端点 $x_1 > 0$",
  },
  x2: {
    key: "x2",
    label: "端点 x2",
    labelFormula: "x_2",
    min: 2.1,
    max: 6.0,
    step: 0.1,
    defaultValue: 3.5,
    importance: "display",
    description: "对数均值不等式右端点",
    descriptionFormula: "对数均值不等式右端点 $x_2 > x_1$",
  },
};
