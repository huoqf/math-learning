import type { ParamMeta } from "../types";
import { MATH_COLORS } from "@/theme";

export const defaultParams: Record<string, number> = {
  // 回归预设索引
  presetIndex: 0,
  // 噪声强度
  noise: 0,
  // 重心纵向平移偏移量 Δȳ
  meanShiftY: 0,
  // 离群点垂直偏离度 Δy (仅在异常点情境激活)
  outlierOffset: 0,
  // 是否显示最小二乘残差正方形几何面积 (0: 关, 1: 开)
  showResidualSquares: 1,
  // 是否显示下方残差图 (0: 关, 1: 开)
  showResidualPlot: 0,

  // 独立性检验 2x2 频数
  freqA: 85, // a: A 且 B
  freqB: 15, // b: A 且 非B
  freqC: 40, // c: 非A 且 B
  freqD: 60, // d: 非A 且 非B
  scaleMultiplier: 1, // 样本容量倍增因子 (探究样本容量对卡方检验的影响)
  displayMode: 0, // 0: 综合视图(列联表+等高图+卡方曲线), 1: 期望值偏离度对比
};

export const paramMeta: Record<string, ParamMeta> = {
  noise: {
    key: "noise",
    label: "噪声强度",
    labelFormula: `\\text{噪声扰动 } \\color{${MATH_COLORS.paramPrimary}}{\\sigma}`,
    defaultValue: 0,
    min: 0,
    max: 3,
    step: 0.2,
    importance: "core",
  },
  meanShiftY: {
    key: "meanShiftY",
    label: "重心平移",
    labelFormula: `\\text{重心纵向平移 } \\color{${MATH_COLORS.paramTertiary}}{\\Delta \\bar{y}}`,
    defaultValue: 0,
    min: -4,
    max: 4,
    step: 0.5,
    importance: "core",
  },
  outlierOffset: {
    key: "outlierOffset",
    label: "离群点偏移",
    labelFormula: `\\text{离群点偏移 } \\color{${MATH_COLORS.paramSecondary}}{\\Delta y}`,
    defaultValue: 0,
    min: -8,
    max: 8,
    step: 0.5,
    importance: "core",
  },
  showResidualSquares: {
    key: "showResidualSquares",
    label: "残差平方面积",
    labelFormula: `\\text{残差正方形 } \\color{${MATH_COLORS.paramTertiary}}{\\sum e_i^2}`,
    defaultValue: 1,
    min: 0,
    max: 1,
    step: 1,
    importance: "advanced",
  },
  showResidualPlot: {
    key: "showResidualPlot",
    label: "残差分析图",
    labelFormula: `\\text{残差分布图 } (x_i, e_i)`,
    defaultValue: 0,
    min: 0,
    max: 1,
    step: 1,
    importance: "advanced",
  },

  freqA: {
    key: "freqA",
    label: "a (A且B)",
    labelFormula: "a",
    defaultValue: 85,
    min: 0,
    max: 200,
    step: 1,
    description: "满足 A 且满足 B 的样本频数 (左上格)",
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
    step: 1,
    description: "满足 A 但不满足 B 的样本频数 (右上格)",
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
    step: 1,
    description: "不满足 A 但满足 B 的样本频数 (左下格)",
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
    step: 1,
    description: "既不满足 A 也不满足 B 的样本频数 (右下格)",
    descriptionFormula: "n_{22} = d",
    importance: "core",
    marks: [{ value: 0, label: "0", labelFormula: "0" }],
  },
  scaleMultiplier: {
    key: "scaleMultiplier",
    label: "样本倍增因子 k",
    labelFormula: "k \\times (a,b,c,d)",
    defaultValue: 1,
    min: 1,
    max: 10,
    step: 1,
    description:
      "等比例缩放样本容量，观察频率不变时卡方值随样本量线性放大的现象",
    descriptionFormula:
      "n \\to k \\cdot n \\implies \\chi^2 \\to k \\cdot \\chi^2",
    importance: "advanced",
    marks: [
      { value: 1, label: "1x", labelFormula: "1\\times" },
      { value: 2, label: "2x", labelFormula: "2\\times" },
      { value: 5, label: "5x", labelFormula: "5\\times" },
      { value: 10, label: "10x", labelFormula: "10\\times" },
    ],
  },
};
