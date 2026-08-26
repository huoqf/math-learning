/**
 * src/data/registries/derivativeShift.ts
 * 隐零点定理与极值点偏移 参数注册表
 */

import type { ParamMeta } from "../types";

export const defaultParams: Record<string, number> = {
  a: 1.5, // 隐零点参数 a
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
        params: { a: 1.5 },
      },
      {
        key: "critical_one",
        label: "标准切相",
        formula: "a = 1.0",
        description: "零点x0=1",
        params: { a: 1.0 },
      },
      {
        key: "gaokao_e",
        label: "对数基准",
        formula: "a = 2.0",
        description: "零点x0=e",
        params: { a: 2.0 },
      },
      {
        key: "deep_zero",
        label: "深部隐零",
        formula: "a = 2.7",
        description: "大跨度消元",
        params: { a: 2.7 },
      },
    ],
    exp_minus_ax: [
      {
        key: "free",
        label: "自由探究",
        description: "全参数开放",
        params: { a: 1.5 },
      },
      {
        key: "critical_zero",
        label: "标准切相",
        formula: "a = 1.0",
        description: "零点x0=0",
        params: { a: 1.0 },
      },
      {
        key: "gaokao_e_one",
        label: "特征零点",
        formula: "a = e",
        description: "零点x0=1",
        params: { a: 2.72 },
      },
      {
        key: "gaokao_two",
        label: "高考常考",
        formula: "a = 2.0",
        description: "零点ln2",
        params: { a: 2.0 },
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
        key: "gaokao_2016",
        label: "高考真题",
        formula: "k = 0.25",
        description: "典型双根",
        params: { k: 0.25 },
      },
      {
        key: "critical_tan",
        label: "极值相切",
        formula: "k \\to 1/e",
        description: "双根重合",
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
    lnx_div_x: [
      {
        key: "free",
        label: "自由探究",
        description: "全参数开放",
        params: { k: 0.25 },
      },
      {
        key: "gaokao_2010",
        label: "2010全国",
        formula: "k = 0.25",
        description: "经典双根",
        params: { k: 0.25 },
      },
      {
        key: "critical_tan",
        label: "极值相切",
        formula: "k \\to 1/e",
        description: "双根重合",
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
    labelFormula: "a",
    group: "隐零点函数参数",
    min: 0.1,
    max: 3.5,
    step: 0.05,
    defaultValue: 1.5,
    importance: "core",
    description: "控制导函数零点位置及原函数极值高度",
    descriptionFormula: "控制导函数零点 $x_0$ 及原函数极值 $f(x_0)$",
    marks: [
      {
        value: 1.0,
        variant: "critical",
        label: "1.0",
        labelFormula: "1.0",
      },
    ],
  },
  k: {
    key: "k",
    label: "割线高度 k",
    labelFormula: "k",
    group: "割线截弦参数",
    min: 0.05,
    max: 0.35,
    step: 0.01,
    defaultValue: 0.25,
    importance: "core",
    description: "割线 y = k 截原函数的两根 x1 与 x2 (k_max = 1/e 临界)",
    descriptionFormula:
      "割线 $y = k$ 截原函数的两根 $x_1, x_2$ (极值临界 $k_{max} = 1/e$)",
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
    label: "端点 x1",
    labelFormula: "x_1",
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
    label: "端点 x2",
    labelFormula: "x_2",
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
