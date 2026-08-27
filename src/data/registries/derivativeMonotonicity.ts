/**
 * src/data/registries/derivativeMonotonicity.ts
 * 导数与单调性极值参数注册表与元数据
 */

import type { ParamMeta } from "../types";
import { MATH_COLORS } from "@/theme";
import {
  MONOTONICITY_MODELS,
  type MonotonicityModelKey,
} from "@/math/derivativeMonotonicity";

export const defaultParams = {
  modelKey: "cubic_param" as MonotonicityModelKey,
  a: 1.0,
  x0: 1.5,
};

export const paramMeta: Record<string, ParamMeta> = {
  a: {
    key: "a",
    label: "含参系数 a",
    labelFormula: `\\text{含参系数 } \\color{${MATH_COLORS.paramPrimary}}{a}`,
    min: -2.0,
    max: 3.0,
    step: 0.1,
    defaultValue: 1.0,
    importance: "core",
    marks: [
      {
        value: 0,
        label: "a=0 (临界)",
        variant: "critical",
      },
    ],
  },
  x0: {
    key: "x0",
    label: "动点横坐标 x₀",
    labelFormula: `\\text{切点横坐标 } \\color{${MATH_COLORS.tangentLine}}{x_0}`,
    min: -4.0,
    max: 4.0,
    step: 0.05,
    defaultValue: 1.5,
    importance: "core",
  },
};

/**
 * 根据当前选择的函数模型动态获取参数配置与范围保护
 */
export function getDynamicParamMeta(
  modelKey: MonotonicityModelKey,
): Record<string, ParamMeta> {
  const model = MONOTONICITY_MODELS[modelKey];
  return {
    a: {
      key: "a",
      label: `含参系数 a (${model.name})`,
      labelFormula: `\\text{参数 } \\color{${MATH_COLORS.paramPrimary}}{a}`,
      min: model.aRange[0],
      max: model.aRange[1],
      step: model.aStep,
      defaultValue: model.defaultA,
      importance: "core",
      marks:
        modelKey === "cubic_param" || modelKey === "nike_rational"
          ? [
              {
                value: 0,
                label: "a=0 (临界)",
                variant: "critical",
              },
            ]
          : undefined,
    },
    x0: {
      key: "x0",
      label: "切点横坐标 x₀",
      labelFormula: `\\text{切点 } \\color{${MATH_COLORS.tangentLine}}{x_0}`,
      min: model.xRange[0],
      max: model.xRange[1],
      step: 0.05,
      defaultValue: model.defaultX0,
      importance: "core",
    },
  };
}
