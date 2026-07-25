import type { ParamMeta } from "../types";

export const defaultParams: Record<string, number> = {
  // 回归预设索引
  presetIndex: 0,
  // 噪声强度
  noise: 0,

  // 独立性检验 2x2 频数
  freqA: 85, // a: A 且 B
  freqB: 15, // b: A 且 非B
  freqC: 40, // c: 非A 且 B
  freqD: 60, // d: 非A 且 非B
};

export const paramMeta: Record<string, ParamMeta> = {
  noise: {
    key: "noise",
    label: "噪声强度",
    labelFormula: "\\sigma",
    defaultValue: 0,
    min: 0,
    max: 3,
    step: 0.2,
    description: "对回归散点加入正态随机波动",
    descriptionFormula: "y_i \\to y_i + \\epsilon_i",
    importance: "core",
  },

  freqA: {
    key: "freqA",
    label: "a (A且B)",
    labelFormula: "a",
    defaultValue: 85,
    min: 0,
    max: 200,
    step: 5,
    description: "满足 A 且满足 B 的样本频数",
    descriptionFormula: "n_{11} = a",
    importance: "core",
    marks: [{ value: 0, label: "0", labelFormula: "0" }],
  },
  freqB: {
    key: "freqB",
    label: "b (A且非B)",
    labelFormula: "b",
    defaultValue: 15,
    min: 0,
    max: 200,
    step: 5,
    description: "满足 A 但不满足 B 的样本频数",
    descriptionFormula: "n_{12} = b",
    importance: "core",
    marks: [{ value: 0, label: "0", labelFormula: "0" }],
  },
  freqC: {
    key: "freqC",
    label: "c (非A且B)",
    labelFormula: "c",
    defaultValue: 40,
    min: 0,
    max: 200,
    step: 5,
    description: "不满足 A 但满足 B 的样本频数",
    descriptionFormula: "n_{21} = c",
    importance: "core",
    marks: [{ value: 0, label: "0", labelFormula: "0" }],
  },
  freqD: {
    key: "freqD",
    label: "d (非A且非B)",
    labelFormula: "d",
    defaultValue: 60,
    min: 0,
    max: 200,
    step: 5,
    description: "既不满足 A 也不满足 B 的样本频数",
    descriptionFormula: "n_{22} = d",
    importance: "core",
    marks: [{ value: 0, label: "0", labelFormula: "0" }],
  },
};
