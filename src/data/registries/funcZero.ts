import type { ParamMeta } from "../types";

export const defaultParams: Record<string, number> = {
  intervalM: -1.0,
  intervalN: 2.5,
  bisectionSteps: 3,
};

export const paramMeta: Record<string, ParamMeta> = {
  intervalM: {
    key: "intervalM",
    label: "零点区间左端点 m",
    labelFormula: "m",
    min: -3.0,
    max: 3.0,
    step: 0.1,
    defaultValue: -1.0,
    importance: "advanced",
    description: "零点存在性定理与二分逼近法研究区间的左边界",
  },
  intervalN: {
    key: "intervalN",
    label: "零点区间右端点 n",
    labelFormula: "n",
    min: -2.0,
    max: 4.0,
    step: 0.1,
    defaultValue: 2.5,
    importance: "advanced",
    description: "零点存在性定理与二分逼近法研究区间的右边界",
  },
  bisectionSteps: {
    key: "bisectionSteps",
    label: "二分逼近步数 Step",
    labelFormula: "\\text{Step}",
    min: 1,
    max: 8,
    step: 1,
    defaultValue: 3,
    importance: "core",
    description: "二分逼近法迭代切分次数，次数越多误差越小",
  },
};
