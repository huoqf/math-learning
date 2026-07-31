import type { ParamMeta } from "../types";

export const defaultParams = {
  a: 3.0,
  c: 2.0,
  e: 0.66,
  p: 2.0,
  theta: 0.8,
} as const;

export const paramMeta: Record<string, ParamMeta> = {
  a: {
    key: "a",
    label: "长半轴 / 实半轴 a",
    labelFormula: "a",
    min: 1.0,
    max: 5.0,
    step: 0.1,
    defaultValue: 3.0,
    importance: "core",
    description: "决定椭圆长半轴或双曲线实半轴长度",
    marks: [
      {
        value: 2.0,
        variant: "critical",
        label: "与 c 相等 (a=c)",
        labelFormula: "a = c",
      },
    ],
  },
  c: {
    key: "c",
    label: "半焦距 c",
    labelFormula: "c",
    min: 0.5,
    max: 4.5,
    step: 0.1,
    defaultValue: 2.0,
    importance: "core",
    description: "焦点坐标为 (±c, 0)，焦距为 2c",
    marks: [
      {
        value: 3.0,
        variant: "critical",
        label: "与 a 相等 (c=a)",
        labelFormula: "c = a",
      },
    ],
  },
  e: {
    key: "e",
    label: "离心率 e (d_F / d_l)",
    labelFormula: "e",
    min: 0.1,
    max: 2.5,
    step: 0.05,
    defaultValue: 0.66,
    importance: "core",
    description: "离心率 e < 1 为椭圆，e = 1 为抛物线，e > 1 为双曲线",
    marks: [
      {
        value: 1.0,
        variant: "critical",
        label: "抛物线 (e=1)",
        labelFormula: "e = 1",
      },
    ],
  },
  p: {
    key: "p",
    label: "焦准距 p",
    labelFormula: "p",
    min: 0.5,
    max: 4.0,
    step: 0.1,
    defaultValue: 2.0,
    importance: "core",
    description: "焦点到准线的距离 (p > 0)，焦点 (p/2, 0)，准线 x = -p/2",
  },
  theta: {
    key: "theta",
    label: "动点参数 θ / t",
    labelFormula: "\\theta",
    min: 0,
    max: 6.28,
    step: 0.02,
    defaultValue: 0.8,
    importance: "core",
    description: "控制动点 P 沿着圆锥曲线轨迹连续滑动",
  },
};
