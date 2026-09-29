import type { ParamMeta } from "../types";
import { MATH_COLORS } from "@/theme";

export interface FuncZeroModel {
  key: string;
  name: string;
  formula: string;
  defaultM: number;
  defaultN: number;
  minM: number;
  maxM: number;
  minN: number;
  maxN: number;
  step: number;
  approxZero: number;
  fn: (x: number) => number;
}

export const FUNC_ZERO_MODELS: Record<string, FuncZeroModel> = {
  cubic: {
    key: "cubic",
    name: "三次多项式",
    formula: "x^3 - x - 2 = 0",
    defaultM: 1.0,
    defaultN: 2.0,
    minM: -2.0,
    maxM: 3.0,
    minN: -1.0,
    maxN: 4.0,
    step: 0.1,
    approxZero: 1.5214,
    fn: (x: number) => x * x * x - x - 2,
  },
  logMixed: {
    key: "logMixed",
    name: "对数混合",
    formula: "\\ln x + 2x - 6 = 0",
    defaultM: 2.0,
    defaultN: 3.0,
    minM: 0.2,
    maxM: 3.5,
    minN: 0.5,
    maxN: 5.0,
    step: 0.1,
    approxZero: 2.5362,
    fn: (x: number) => (x > 0 ? Math.log(x) + 2 * x - 6 : NaN),
  },
  expMixed: {
    key: "expMixed",
    name: "指数混合",
    formula: "2^x + 3x - 7 = 0",
    defaultM: 1.0,
    defaultN: 2.0,
    minM: -1.0,
    maxM: 3.0,
    minN: 0.0,
    maxN: 4.0,
    step: 0.1,
    approxZero: 1.4312,
    fn: (x: number) => Math.pow(2, x) + 3 * x - 7,
  },
  counterExample: {
    key: "counterExample",
    name: "充分非必要反例",
    formula: "x^2 - 2x = 0",
    defaultM: -1.0,
    defaultN: 3.0,
    minM: -3.0,
    maxM: 3.0,
    minN: -1.0,
    maxN: 5.0,
    step: 0.1,
    approxZero: 0.0,
    fn: (x: number) => x * x - 2 * x,
  },
};

export const defaultParams: Record<string, number> = {
  modelKey: 0, // 0: cubic, 1: logMixed, 2: expMixed, 3: counterExample
  intervalM: 1.0,
  intervalN: 2.0,
  bisectionSteps: 3,
};

export const paramMeta: Record<string, ParamMeta> = {
  intervalM: {
    key: "intervalM",
    label: "区间左端点 a",
    labelFormula: `\\text{区间左端点 } \\color{${MATH_COLORS.paramPrimary}}{a}`,
    min: -3.0,
    max: 3.0,
    step: 0.1,
    defaultValue: 1.0,
    importance: "core",
  },
  intervalN: {
    key: "intervalN",
    label: "区间右端点 b",
    labelFormula: `\\text{区间右端点 } \\color{${MATH_COLORS.paramSecondary}}{b}`,
    min: -2.0,
    max: 5.0,
    step: 0.1,
    defaultValue: 2.0,
    importance: "core",
  },
  bisectionSteps: {
    key: "bisectionSteps",
    label: "迭代步数 k",
    labelFormula: `\\text{迭代步数 } \\color{${MATH_COLORS.paramTertiary}}{k}`,
    min: 1,
    max: 8,
    step: 1,
    defaultValue: 3,
    importance: "core",
  },
};

/**
 * 按当前模型取「有效参数域」—— 模型盒覆盖注册表默认域。
 *
 * 为什么必须由注册表统一出口：左屏滑块与中屏拖拽各自手写这份覆盖逻辑时，
 * 一旦只有一侧写全（历史实现里左屏覆盖了 minM/maxM/minN/maxN 四个边界，
 * 中屏拖拽却只覆盖了 minM 与 maxN），就会出现「拖得到但滑块表达不出」、
 * 以及端点被拖出模型定义域的双向错位。二者必须消费同一份定义。
 */
export function getDynamicParamMeta(
  modelKey: string,
): Record<string, ParamMeta> {
  const model = FUNC_ZERO_MODELS[modelKey] ?? FUNC_ZERO_MODELS.cubic;
  return {
    ...paramMeta,
    intervalM: { ...paramMeta.intervalM, min: model.minM, max: model.maxM },
    intervalN: { ...paramMeta.intervalN, min: model.minN, max: model.maxN },
  };
}
