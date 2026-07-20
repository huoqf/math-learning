import type { ParamMeta } from "../types";

export const defaultParams = {
  a: 1.0,
  b: 0.0,
  c: 0.0,
} as const;

export const paramMeta: Record<string, ParamMeta> = {
  a: {
    key: "a",
    label: "二次项系数 a",
    labelFormula: "a",
    min: -2.0,
    max: 2.0,
    step: 0.1,
    defaultValue: 1.0,
    importance: "core",
    description: "控制抛物线开口方向与胖瘦，为 0 时退化为直线",
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
    labelFormula: "b",
    min: -4.0,
    max: 4.0,
    step: 0.1,
    defaultValue: 0.0,
    importance: "core",
    description: "与 a 共同决定对称轴位置 x = -b/(2a)",
    descriptionFormula:
      "\\text{与 } a \\text{ 共同决定对称轴位置 } x = -\\frac{b}{2a}",
  },
  c: {
    key: "c",
    label: "常数项 c",
    labelFormula: "c",
    min: -3.0,
    max: 3.0,
    step: 0.1,
    defaultValue: 0.0,
    importance: "core",
    description: "代表抛物线与 y 轴交点坐标 (0, c)",
  },
};
