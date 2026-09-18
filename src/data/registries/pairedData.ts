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

  // 高考回归预测目标自变量 x₀
  targetX: 10,
  // 独立性检验 2x2 频数
  freqA: 85, // a: A 且 B
  freqB: 15, // b: A 且 非B
  freqC: 40, // c: 非A 且 B
  freqD: 60, // d: 非A 且 非B
  scaleMultiplier: 1, // 样本容量倍增因子 (探究样本容量对卡方检验的影响)
};

/** 「高考标准解答分步走」的单步（左屏导航 / 右屏推演链 / 中屏高亮三方共用） */
export interface IndependenceAnswerStep {
  step: number;
  title: string;
  /** 该步在中屏对应的图元区域说明 */
  sceneHint: string;
}

/**
 * 独立性检验模块的解答分步链条（SSOT）。
 *
 * 同一份数据被三处消费，保证"左屏点第 N 步、右屏聚焦第 N 条推演步、中屏高亮第 N 块图元"
 * 三者永远指向同一件事，不会各写一份而漂移：
 *   - 左屏 `StepNavigator`：step / title / sceneHint
 *   - 右屏推演链：`builders/pairedData.ts` 取 title 作标题、step 作步号
 *   - 中屏 `IndependenceScene`：按 step 高亮对应分区
 *
 * 分区与步骤的对应关系按"这一步到底该看哪块图"确定，而非随手指定：
 *   1 设 H₀    → 左上列联表（H₀ 的对象就是表里那两个分类变量与四格频数）
 *   2 算 χ²    → 右上等高条形图（两行条件频率落差 |p₁-p₂| 是卡方统计量的直观来源，落差为 0 即独立）
 *   3 比临界值 → 下半 χ²(1) 分布曲线（拒绝域与 3.841 / 6.635 / 10.828 判读）
 */
export const INDEPENDENCE_ANSWER_STEPS: IndependenceAnswerStep[] = [
  {
    step: 1,
    title: "审题定法 · 明确设立零假设与对立假设",
    sceneHint:
      "左上【2×2 列联表】先认清题设的两个分类变量与四格观测频数——H₀ 讲的就是这两个变量相互独立",
  },
  {
    step: 2,
    title: "建模展开 · 列联表数据代入卡方公式求解",
    sceneHint:
      "右上【等高条形图】两行条件频率落差 |p₁-p₂|：落差为 0 即独立，而卡方分子 n(ad-bc)² 正是这一落差的量化；数值代入对照左上列联表的四格频数",
  },
  {
    step: 3,
    title: "求解反思 · 对比分位数临界值合规推断",
    sceneHint:
      "下半【χ²(1) 分布曲线与临界决策标尺】把算得的 χ² 与 3.841 / 6.635 / 10.828 比对，落在阴影拒绝域内才可否定 H₀",
  },
];

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
  targetX: {
    key: "targetX",
    label: "预测目标值 x₀",
    labelFormula: `\\text{高考预测目标 } \\color{${MATH_COLORS.paramPrimary}}{x_0}`,
    defaultValue: 10,
    min: 0,
    max: 50,
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
    labelFormula: `\\text{残差分布图 }\\color{${MATH_COLORS.paramTertiary}}{(x_i, e_i)}`,
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
