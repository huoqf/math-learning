/**
 * src/data/registries/derivativeEndpointTaylor.ts
 * 声明式参数注册表：端点效应与洛必达/泰勒拟合放缩
 */

import type { ParamMeta } from "@/data/types";
import { MATH_COLORS } from "@/theme";

export interface DerivativeEndpointTaylorParams {
  /** 端点效应参数 a (切线斜率控制参数) */
  a: number;
  /** 洛必达动点 x (用于 x -> 0 无限逼近) */
  xCurr: number;
  /** 泰勒展开点 x0 */
  x0: number;
}

export const defaultParams: DerivativeEndpointTaylorParams = {
  a: 1.2,
  xCurr: 0.5,
  x0: 0,
};

export const paramMeta: Record<
  keyof DerivativeEndpointTaylorParams,
  ParamMeta
> = {
  a: {
    key: "a",
    label: "切线/求参系数 a",
    labelFormula: `\\color{${MATH_COLORS.paramPrimary}}{a}`,
    min: 0.2,
    max: 2.2,
    step: 0.05,
    defaultValue: 1.2,
    description: "控制端点 f'(0) 切线斜率及恒成立临界",
    descriptionFormula: `f'(0) = 1 - \\color{${MATH_COLORS.paramPrimary}}{a} \\ge 0 \\implies a \\le 1 \\text{ (a>1 时端点失效)}`,
    importance: "core",
    marks: [
      { value: 0.5, label: "0.5" },
      { value: 1.0, label: "1.0", variant: "critical" },
      { value: 1.5, label: "1.5" },
    ],
  },
  xCurr: {
    key: "xCurr",
    label: "洛必达逼近动点 x",
    labelFormula: `\\color{${MATH_COLORS.paramSecondary}}{x}`,
    min: -1.5,
    max: 1.5,
    step: 0.02,
    defaultValue: 0.5,
    description: "用于观察 x -> 0 时 0/0 未定式的极限逼近",
    descriptionFormula: `\\text{动点 } x \\to 0 \\text{ 时逼近洛必达极限值 } 1/2`,
    importance: "core",
    marks: [
      { value: -0.8, label: "-0.8" },
      { value: 0.0, label: "0", variant: "critical" },
      { value: 0.8, label: "0.8" },
    ],
  },
  x0: {
    key: "x0",
    label: "泰勒展开点 x₀",
    labelFormula: `\\color{${MATH_COLORS.paramTertiary}}{x_0}`,
    min: -1.0,
    max: 1.0,
    step: 0.1,
    defaultValue: 0,
    description: "泰勒切线及多项式局部拟合展开点",
    descriptionFormula: `\\text{展开点 } x_0 = 0 \\text{ (麦克劳林展开)}`,
    importance: "advanced",
    marks: [
      { value: -0.5, label: "-0.5" },
      { value: 0.0, label: "0", variant: "critical" },
      { value: 0.5, label: "0.5" },
    ],
  },
};
