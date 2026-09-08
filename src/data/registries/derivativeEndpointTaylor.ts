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
  /** 泰勒多项式拟合测试自变量 x */
  xTest: number;
}

export const defaultParams: DerivativeEndpointTaylorParams = {
  a: 1.2,
  xCurr: 0.5,
  xTest: 1.0,
};

export const paramMeta: Record<
  keyof DerivativeEndpointTaylorParams,
  ParamMeta
> = {
  a: {
    key: "a",
    label: "斜率参数 a",
    labelFormula: `\\text{斜率参数 } \\color{${MATH_COLORS.paramPrimary}}{a}`,
    min: 0.2,
    max: 2.2,
    step: 0.05,
    defaultValue: 1.2,
    importance: "core",
    marks: [{ value: 1.0, label: "1.0", variant: "critical" }],
  },
  xCurr: {
    key: "xCurr",
    label: "极限动点 x",
    labelFormula: `\\text{逼近自变量 } \\color{${MATH_COLORS.paramPrimary}}{x}`,
    min: -1.2,
    max: 1.2,
    step: 0.02,
    defaultValue: 0.5,
    importance: "core",
    marks: [{ value: 0.0, label: "0", variant: "critical" }],
  },
  xTest: {
    key: "xTest",
    label: "测试自变量 x",
    labelFormula: `\\text{测试自变量 } \\color{${MATH_COLORS.paramPrimary}}{x}`,
    min: 0.1,
    max: 2.5,
    step: 0.05,
    defaultValue: 1.0,
    importance: "core",
    marks: [{ value: 1.0, label: "1.0", variant: "critical" }],
  },
};
