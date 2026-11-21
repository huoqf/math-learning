/**
 * src/data/registries/derivativeShift.ts
 * 隐零点定理与极值点偏移 参数注册表
 */

import type { ParamMeta } from "../types";
import type { AnswerStepItem } from "@/components/UI/StepNavigator";
import { MATH_COLORS } from "@/theme";

export const defaultParams: Record<string, number> = {
  a: 2.0, // 隐零点参数 a
  k: 0.25, // 割线高度 y = k
  x1: 0.3, // 对数均值不等式 x1
  x2: 3.5, // 对数均值不等式 x2
};

export interface ShiftPreset {
  key: string;
  label: string;
  formula?: string;
  description: string;
  params: Record<string, number>;
}

export const presetsByModeAndModel: Record<
  string,
  Record<string, ShiftPreset[]>
> = {
  implicit_zero: {
    x_ln_x: [
      {
        key: "free",
        label: "自由探究",
        description: "全参数开放",
        params: { a: 2.0 },
      },
      {
        key: "critical_one",
        label: "基准零点",
        formula: "x_0 = 1",
        description: "零点x0为1",
        params: { a: 2.0 },
      },
      {
        key: "small_root",
        label: "区间压缩",
        formula: "x_0 \\approx 0.5",
        description: "隐零点落入零到一区间",
        params: { a: 1.2 },
      },
      {
        key: "deep_zero",
        label: "深部隐零",
        formula: "x_0 \\approx 1.8",
        description: "大跨度代换消参",
        params: { a: 3.4 },
      },
    ],
    exp_linear: [
      {
        key: "free",
        label: "自由探究",
        description: "全参数开放",
        params: { a: 2.0 },
      },
      {
        key: "critical_root",
        label: "特征零点",
        formula: "x_0 = 1",
        description: "特征零点x0为1",
        params: { a: 1.72 },
      },
      {
        key: "typical_span",
        label: "常见跨度",
        formula: "a = 2.5",
        description: "新高考常考参数跨度（模型原型）",
        params: { a: 2.5 },
      },
      {
        key: "deep_exp",
        label: "深度消元",
        formula: "x_0 \\approx 1.5",
        description: "强指数非线性轨迹",
        params: { a: 3.5 },
      },
    ],
  },
  shift_symmetric: {
    xe_neg_x: [
      {
        key: "free",
        label: "自由探究",
        description: "全参数开放",
        params: { k: 0.25 },
      },
      {
        key: "classic_double_root",
        label: "经典双根",
        formula: "k = 0.25",
        description: "典型双根割线模型",
        params: { k: 0.25 },
      },
      {
        key: "critical_tan",
        label: "极值相切",
        formula: "k \\to 1/e",
        description: "双根无限重合趋向",
        params: { k: 0.36 },
      },
      {
        key: "deep_secant",
        label: "深部割线",
        formula: "k = 0.12",
        description: "大偏移量",
        params: { k: 0.12 },
      },
    ],
    ln_x_div_x: [
      {
        key: "free",
        label: "自由探究",
        description: "全参数开放",
        params: { k: 0.25 },
      },
      {
        key: "classic_double_root",
        label: "经典双根",
        formula: "k = 0.25",
        description: "经典双根割线模型",
        params: { k: 0.25 },
      },
      {
        key: "critical_tan",
        label: "极值相切",
        formula: "k \\to 1/e",
        description: "双根无限重合趋向",
        params: { k: 0.36 },
      },
      {
        key: "deep_secant",
        label: "深部割线",
        formula: "k = 0.12",
        description: "双重右偏显著区域",
        params: { k: 0.12 },
      },
    ],
  },
  log_mean: {
    default: [
      {
        key: "free",
        label: "自由探究",
        description: "全参数开放",
        params: { x1: 0.3, x2: 3.5 },
      },
      {
        key: "gaokao_classic",
        label: "高考经典",
        formula: "x_2 = e^2 x_1",
        description: "指数跨度",
        params: { x1: 1.0, x2: 7.39 },
      },
      {
        key: "close_nodes",
        label: "近邻均值",
        formula: "x_2 \\approx 1.5 x_1",
        description: "逼近极限",
        params: { x1: 1.0, x2: 1.5 },
      },
      {
        key: "large_ratio",
        label: "大比值齐次",
        formula: "x_2 = 10 x_1",
        description: "右端放缩",
        params: { x1: 0.5, x2: 5.0 },
      },
    ],
  },
};

export function getPresets(mode: string, subModel = "default"): ShiftPreset[] {
  const modePresets = presetsByModeAndModel[mode];
  if (!modePresets) return [];
  return modePresets[subModel] ?? modePresets.default ?? [];
}

export const paramMeta: Record<string, ParamMeta> = {
  a: {
    key: "a",
    label: "函数参数 a",
    labelFormula: `\\color{${MATH_COLORS.paramPrimary}}{a}`,
    group: "隐零点函数参数",
    min: 0.5,
    max: 3.6,
    step: 0.05,
    defaultValue: 2.0,
    importance: "core",
    description: "控制导函数超越方程零点位置及原函数极值",
    descriptionFormula: "控制导函数零点 $x_0$ 满足 $f'(x_0)=0$ 及极值 $f(x_0)$",
    marks: [
      {
        value: 2.0,
        variant: "critical",
        label: "2.0",
        labelFormula: "2.0",
      },
    ],
  },
  k: {
    key: "k",
    label: "割线高度 k",
    labelFormula: `\\color{${MATH_COLORS.secantLine}}{k}`,
    group: "割线截弦参数",
    min: 0.05,
    max: 0.35,
    step: 0.01,
    defaultValue: 0.25,
    importance: "core",
    description:
      "割线 $y = k$ 截原函数的两根 $x_1$ 与 $x_2$ ($k_{max} = 1/e$ 临界)",
    descriptionFormula:
      "割线 $y = k$ 截原函数的两根 $x_1, x_2$ (极值临界 $k_{\\max} = 1/e$)",
    marks: [
      {
        value: 0.368,
        variant: "critical",
        label: "1/e",
        labelFormula: "1/e",
      },
    ],
  },
  x1: {
    key: "x1",
    label: "左端点 x₁",
    labelFormula: `\\color{${MATH_COLORS.function}}{x_1}`,
    group: "对数均值区间端点",
    min: 0.1,
    max: 2.0,
    step: 0.05,
    defaultValue: 0.3,
    importance: "display",
    description: "对数均值不等式左端点",
    descriptionFormula: "对数均值不等式左端点 $x_1 > 0$",
  },
  x2: {
    key: "x2",
    label: "右端点 x₂",
    labelFormula: `\\color{${MATH_COLORS.functionSecondary}}{x_2}`,
    group: "对数均值区间端点",
    min: 2.1,
    max: 8.0,
    step: 0.1,
    defaultValue: 3.5,
    importance: "display",
    description: "对数均值不等式右端点",
    descriptionFormula: "对数均值不等式右端点 $x_2 > x_1$",
  },
};

const SHIFT_ANSWER_STEPS: Record<string, AnswerStepItem[]> = {
  implicit_zero: [
    {
      step: 1,
      title: "求导与零点存在性证明",
      sceneHint: "聚焦导函数曲线与导数零点 $(x_0, 0)$",
    },
    {
      step: 2,
      title: "设而不求消参下沉",
      sceneHint: "聚焦消元轨迹 $h(x)$ 与代换轨迹点 $(x_0, h(x_0))$",
    },
    {
      step: 3,
      title: "代入求值与范围确定",
      sceneHint: "聚焦原函数 $f(x)$ 与极值点 $P(x_0, f(x_0))$",
    },
  ],
  shift_symmetric: [
    {
      step: 1,
      title: "求导确立极值中心",
      sceneHint: "聚焦对称轴 $x = x_0$、水平割线与交点 $P_1, P_2$",
    },
    {
      step: 2,
      title: "对称构造差函数转化",
      sceneHint: "聚焦镜像曲线 $f(2x_0 - x)$ 与差函数 $F(x)$",
    },
    {
      step: 3,
      title: "求导定号与偏移结论",
      sceneHint: "聚焦中点 $M$ 与底部横轴大小序对照",
    },
  ],
  log_mean: [
    {
      step: 1,
      title: "割线切线斜率对应",
      sceneHint: "聚焦对数曲线、割线 $P_1 P_2$ 与平行切线",
    },
    {
      step: 2,
      title: "比值齐次化构造辅助函数",
      sceneHint: "聚焦切点 $T(L, \\ln L)$ 与横轴投影垂线",
    },
    {
      step: 3,
      title: "综合确立不等式链",
      sceneHint: "聚焦横轴三大均值 $G < L < A$ 排序位置",
    },
  ],
};

export function getDerivativeShiftAnswerSteps(mode: string): AnswerStepItem[] {
  return SHIFT_ANSWER_STEPS[mode] ?? SHIFT_ANSWER_STEPS.implicit_zero;
}
