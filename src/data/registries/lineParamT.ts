import type { ParamMeta } from "../types";

export interface LineParamTParams extends Record<string, number> {
  x0: number;
  y0: number;
  alpha: number;
  t: number;
  kNorm: number;
  R: number;
  a: number;
  b: number;
  p: number;
}

export const defaultParams: LineParamTParams = {
  x0: 0.5,
  y0: 0.8,
  alpha: 45,
  t: 2.5,
  kNorm: 1.5,
  R: 3.0,
  a: 3.5,
  b: 2.0,
  p: 1.5,
};

export const paramMeta: Record<keyof LineParamTParams, ParamMeta> = {
  x0: {
    key: "x0",
    label: "定点 x0",
    labelFormula: "x_0",
    description: "直线上定点 P0 的横坐标",
    descriptionFormula: "P_0(x_0, y_0) \\text{ 的横坐标}",
    defaultValue: 0.5,
    min: -4.0,
    max: 4.0,
    step: 0.1,
    importance: "core",
  },
  y0: {
    key: "y0",
    label: "定点 y0",
    labelFormula: "y_0",
    description: "直线上定点 P0 的纵坐标",
    descriptionFormula: "P_0(x_0, y_0) \\text{ 的纵坐标}",
    defaultValue: 0.8,
    min: -3.0,
    max: 3.0,
    step: 0.1,
    importance: "core",
  },
  alpha: {
    key: "alpha",
    label: "倾斜角 α",
    labelFormula: "\\alpha (^\\circ)",
    description: "直线的倾斜角 (0° ~ 180°)",
    descriptionFormula:
      "\\text{直线倾斜角 } \\alpha \\in [0^\\circ, 180^\\circ)",
    defaultValue: 45,
    min: 0,
    max: 179,
    step: 1,
    importance: "core",
    marks: [
      { value: 0, label: "0°" },
      { value: 90, label: "90°" },
    ],
  },
  t: {
    key: "t",
    label: "参数 t",
    labelFormula: "t",
    description: "动点 P 到 P0 的有向距离",
    descriptionFormula:
      "\\text{动点 } P \\text{ 到 } P_0 \\text{ 的有向距离 } t",
    defaultValue: 2.5,
    min: -6.0,
    max: 6.0,
    step: 0.1,
    importance: "advanced",
    marks: [{ value: 0, label: "t=0", variant: "critical" }],
  },
  kNorm: {
    key: "kNorm",
    label: "非标准比例",
    labelFormula: "k_{\\text{norm}} = \\sqrt{a^2+b^2}",
    description: "非标准参数方程方向向量模长比例",
    descriptionFormula:
      "\\text{归一化比例 } k_{\\text{norm}} (k=1 \\text{ 为标准方程})",
    defaultValue: 1.5,
    min: 0.5,
    max: 2.5,
    step: 0.1,
    importance: "advanced",
    marks: [{ value: 1.0, label: "1.0(标准)", variant: "critical" }],
  },
  R: {
    key: "R",
    label: "圆半径 R",
    labelFormula: "R",
    description: "圆的半径",
    descriptionFormula: "\\text{圆方程 } x^2+y^2=R^2",
    defaultValue: 3.0,
    min: 1.0,
    max: 5.0,
    step: 0.1,
    importance: "display",
  },
  a: {
    key: "a",
    label: "半轴 a",
    labelFormula: "a",
    description: "椭圆/双曲线的长/实半轴 a",
    descriptionFormula: "\\text{半轴 } a",
    defaultValue: 3.5,
    min: 1.5,
    max: 5.0,
    step: 0.1,
    importance: "display",
  },
  b: {
    key: "b",
    label: "半轴 b",
    labelFormula: "b",
    description: "椭圆/双曲线的短/虚半轴 b",
    descriptionFormula: "\\text{半轴 } b",
    defaultValue: 2.0,
    min: 1.0,
    max: 4.0,
    step: 0.1,
    importance: "display",
  },
  p: {
    key: "p",
    label: "焦准距 p",
    labelFormula: "p",
    description: "抛物线焦准距 p (y^2 = 2px)",
    descriptionFormula: "\\text{抛物线参数 } y^2=2px",
    defaultValue: 1.5,
    min: 0.5,
    max: 4.0,
    step: 0.1,
    importance: "display",
  },
};
