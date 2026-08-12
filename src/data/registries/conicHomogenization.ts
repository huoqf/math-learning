/**
 * src/data/registries/conicHomogenization.ts
 * 非对称齐次化实验室声明式参数注册
 */

export const defaultParams: Record<string, number> = {
  a: 2.5,
  b: 1.5,
  lineA: 0.3,
  lineB: 0.4,
  px: -2.5,
  py: 0,
  lambda: 1,
  mu: 1,
};

export const paramMeta: Record<
  string,
  {
    label: string;
    labelFormula?: string;
    defaultValue: number;
    min: number;
    max: number;
    step: number;
    description: string;
    descriptionFormula?: string;
    importance?: "primary" | "secondary";
    marks?: Array<{
      value: number;
      label: string;
      labelFormula?: string;
      variant?: "critical" | "zero" | "recommended";
    }>;
  }
> = {
  a: {
    label: "长半轴 a",
    labelFormula: "a",
    defaultValue: 2.5,
    min: 1.0,
    max: 4.0,
    step: 0.1,
    description: "椭圆/双曲线的半实轴长度",
    descriptionFormula: "a \\in [1, 4]",
    importance: "primary",
  },
  b: {
    label: "短半轴 b",
    labelFormula: "b",
    defaultValue: 1.5,
    min: 1.0,
    max: 3.0,
    step: 0.1,
    description: "椭圆/双曲线的半虚轴或短轴长度",
    descriptionFormula: "b \\in [1, 3]",
    importance: "primary",
  },
  lineA: {
    label: "割线 A/m 系数",
    labelFormula: "A",
    defaultValue: 0.3,
    min: -1.5,
    max: 1.5,
    step: 0.05,
    description: "割线方程 Ax + By = 1 中 x 的系数",
    descriptionFormula: "A \\text{ (Ax + By = 1)}",
    importance: "primary",
    marks: [{ value: 0, label: "A=0 (水平割线)", variant: "critical" }],
  },
  lineB: {
    label: "割线 B/n 系数",
    labelFormula: "B",
    defaultValue: 0.4,
    min: -1.5,
    max: 1.5,
    step: 0.05,
    description: "割线方程 Ax + By = 1 中 y 的系数",
    descriptionFormula: "B \\text{ (Ax + By = 1)}",
    importance: "primary",
    marks: [{ value: 0, label: "B=0 (竖直割线)", variant: "critical" }],
  },
  px: {
    label: "定点 x₀",
    labelFormula: "x_0",
    defaultValue: -2.5,
    min: -3.5,
    max: 3.5,
    step: 0.1,
    description: "平移坐标原点定点 P 的 x 坐标",
    descriptionFormula: "P(x_0, y_0)",
    importance: "secondary",
    marks: [
      { value: -2.5, label: "左顶点 (-a,0)", variant: "recommended" },
      { value: 0, label: "原点 (0,0)", variant: "zero" },
    ],
  },
  py: {
    label: "定点 y₀",
    labelFormula: "y_0",
    defaultValue: 0,
    min: -2.5,
    max: 2.5,
    step: 0.1,
    description: "平移坐标原点定点 P 的 y 坐标",
    descriptionFormula: "P(x_0, y_0)",
    importance: "secondary",
    marks: [{ value: 0, label: "对称轴上", variant: "zero" }],
  },
  lambda: {
    label: "非对称权重 λ",
    labelFormula: "\\lambda",
    defaultValue: 1,
    min: 0.5,
    max: 3.0,
    step: 0.5,
    description: "非对称斜率和 λ k₁ + μ k₂ 中 k₁ 的权重",
    descriptionFormula: "\\lambda \\in [0.5, 3]",
    importance: "secondary",
  },
  mu: {
    label: "非对称权重 μ",
    labelFormula: "\\mu",
    defaultValue: 1,
    min: 0.5,
    max: 3.0,
    step: 0.5,
    description: "非对称斜率和 λ k₁ + μ k₂ 中 k₂ 的权重",
    descriptionFormula: "\\mu \\in [0.5, 3]",
    importance: "secondary",
  },
};
