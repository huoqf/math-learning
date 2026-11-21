/**
 * src/data/registries/derivativeMonotonicity.ts
 * 导数与单调性极值参数注册表与元数据
 */

import type { ParamMeta } from "../types";
import type { AnswerStepItem } from "@/components/UI/StepNavigator";
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

const MONOTONICITY_ANSWER_STEPS: Record<string, AnswerStepItem[]> = {
  monotonicity_point: [
    {
      step: 1,
      title: "确定定义域并规范求导",
      sceneHint: "聚焦定义域与原函数主体曲线",
    },
    {
      step: 2,
      title: "代入切点计算导数值与切线方程",
      sceneHint: "聚焦动切点 P 与切线斜率变化",
    },
    {
      step: 3,
      title: "导数符号判定局部单调增减性",
      sceneHint: "聚焦横轴增减区间色带与极值分界点",
    },
  ],
  extrema_analysis: [
    {
      step: 1,
      title: "求解导函数零点 (必要条件)",
      sceneHint: "聚焦导函数曲线 f'(x) 与导数零点",
    },
    {
      step: 2,
      title: "第一充分条件符号穿零检验",
      sceneHint: "聚焦极值竖虚线、水平切线与切点左右变化",
    },
    {
      step: 3,
      title: "代入原函数规范下结论",
      sceneHint: "聚焦原函数曲线与极值点数值位置",
    },
  ],
  parametric_discuss: [
    {
      step: 1,
      title: "确定定义域与导数因式分解",
      sceneHint: "聚焦定义域渐近线与导函数曲线",
    },
    {
      step: 2,
      title: "分类讨论分水岭划分依据",
      sceneHint: "聚焦极值分水岭虚线与临界变化",
    },
    {
      step: 3,
      title: "列表汇总与单调区间规范书写",
      sceneHint: "聚焦原函数图像与横轴增减区间色带",
    },
  ],
};

export function getMonotonicityAnswerSteps(mode: string): AnswerStepItem[] {
  return (
    MONOTONICITY_ANSWER_STEPS[mode] ??
    MONOTONICITY_ANSWER_STEPS.monotonicity_point
  );
}
