import { MATH_COLORS } from "@/theme";

export interface ConicPropertiesParams {
  a: number;
  b: number;
  e: number;
  t: number;
}

export const defaultParams: ConicPropertiesParams = {
  a: 3,
  b: 2,
  e: 0.745,
  t: Math.PI / 4,
};

export const paramMeta: Record<string, any> = {
  a: {
    label: "半长轴 / 半实轴 a",
    labelFormula: `\\color{${MATH_COLORS.paramPrimary}}{a}`,
    defaultValue: 3,
    min: 1,
    max: 5,
    step: 0.1,
    description: "控制椭圆长轴 2a 或双曲线实轴 2a",
    importance: "core",
  },
  b: {
    label: "半短轴 / 半虚轴 b",
    labelFormula: `\\color{${MATH_COLORS.paramSecondary}}{b}`,
    defaultValue: 2,
    min: 0.5,
    max: 4,
    step: 0.1,
    description: "控制椭圆短轴 2b 或双曲线虚轴 2b",
    importance: "core",
  },
  e: {
    label: "离心率 e",
    labelFormula: `\\color{${MATH_COLORS.primary}}{e}`,
    defaultValue: 0.745,
    min: 0.1,
    max: 2.5,
    step: 0.01,
    description: "控制圆锥曲线扁平程度或开口开合度",
    importance: "core",
    marks: [
      { value: 0.01, label: "圆", labelFormula: "e \\to 0" },
      {
        value: 0.707,
        label: "直角焦点三角形",
        labelFormula: "e = \\frac{\\sqrt{2}}{2}",
      },
      { value: 1.0, label: "抛物线临界", labelFormula: "e = 1" },
      {
        value: 1.414,
        label: "等轴双曲线",
        labelFormula: "e = \\sqrt{2}",
      },
    ],
  },
  t: {
    label: "动点 P 位置角 t",
    labelFormula: "\\theta_P",
    defaultValue: Math.PI / 4,
    min: -Math.PI + 0.05,
    max: Math.PI - 0.05,
    step: 0.02,
    description: "沿曲线滑动动点 P 的位置",
    importance: "basic",
  },
};
