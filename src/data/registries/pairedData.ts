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
    labelFormula: `\\text{频数 } \\color{${MATH_COLORS.paramPrimary}}{a} (A \\cap B)`,
    defaultValue: 85,
    min: 0,
    max: 200,
    step: 1,
    importance: "core",
  },
  freqB: {
    key: "freqB",
    label: "b (A且非B)",
    labelFormula: `\\text{频数 } \\color{${MATH_COLORS.paramSecondary}}{b} (A \\cap \\bar{B})`,
    defaultValue: 15,
    min: 0,
    max: 200,
    step: 1,
    importance: "core",
  },
  freqC: {
    key: "freqC",
    label: "c (非A且B)",
    labelFormula: `\\text{频数 } \\color{${MATH_COLORS.paramTertiary}}{c} (\\bar{A} \\cap B)`,
    defaultValue: 40,
    min: 0,
    max: 200,
    step: 1,
    importance: "core",
  },
  freqD: {
    key: "freqD",
    label: "d (非A且非B)",
    labelFormula: `\\text{频数 } \\color{${MATH_COLORS.textMuted}}{d} (\\bar{A} \\cap \\bar{B})`,
    defaultValue: 60,
    min: 0,
    max: 200,
    step: 1,
    importance: "core",
  },
  scaleMultiplier: {
    key: "scaleMultiplier",
    label: "样本倍增因子 k",
    labelFormula: `\\text{倍增因子 } \\color{${MATH_COLORS.paramPrimary}}{k}`,
    defaultValue: 1,
    min: 1,
    max: 10,
    step: 1,
    importance: "advanced",
  },
};
