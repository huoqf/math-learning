import type { MathPanelData } from "../types";
import {
  generateHistogramBins,
  estimateHistogramStats,
  normalPdf,
  calcIntervalProbability,
} from "@/math/probabilityNormal";
import { MATH_COLORS } from "@/theme";

export function buildProbabilityNormalPanel(
  params: Record<string, number>,
  _config?: Record<string, unknown>,
): MathPanelData {
  const mu = params.mu ?? 0;
  const sigma = Math.max(0.1, params.sigma ?? 1);
  const binCount = params.binCount ?? 10;
  const sampleSize = params.sampleSize ?? 200;
  const x1 = params.x1 ?? -1;
  const x2 = params.x2 ?? 1;

  // 直方图数据与统计
  const bins = generateHistogramBins(mu, sigma, binCount, sampleSize);
  const stats = estimateHistogramStats(bins);

  // 正态曲线特征
  const peakHeight = normalPdf(mu, mu, sigma);
  const intervalProb = calcIntervalProbability(mu, sigma, x1, x2);

  return {
    quantities: [
      {
        label: "总体均值 μ",
        value: `${mu.toFixed(2)}`,
        color: MATH_COLORS.paramPrimary,
      },
      {
        label: "标准差 σ",
        value: `${sigma.toFixed(2)}`,
        color: MATH_COLORS.paramSecondary,
      },
      {
        label: "直方图估算均值 x̄",
        value: `${stats.mean.toFixed(3)}`,
        color: MATH_COLORS.function,
      },
      {
        label: "直方图中位数 m_e",
        value: `${stats.median.toFixed(3)}`,
        color: MATH_COLORS.paramSecondary,
      },
      {
        label: "直方图众数 m_o",
        value: `${stats.mode.toFixed(3)}`,
        color: MATH_COLORS.paramPrimary,
      },
      {
        label: "密度最大值 f(μ)",
        value: `${peakHeight.toFixed(3)}`,
        color: MATH_COLORS.paramPrimary,
      },
      {
        label: "区间概率 P(x₁≤X≤x₂)",
        value: `${(intervalProb * 100).toFixed(2)}%`,
        color: MATH_COLORS.paramTertiary,
        highlight: "positive",
      },
    ],
    theorems: [
      {
        name: "正态分布密度函数 N(μ, σ²)",
        latex:
          "f(x) = \\frac{1}{\\sqrt{2\\pi}\\color{#D97706}{\\sigma}} e^{-\\frac{(x - \\color{#EF4444}{\\mu})^2}{2\\color{#D97706}{\\sigma}^2}}",
        prerequisites: [
          "\\sigma > 0",
          "\\int_{-\\infty}^{+\\infty} f(x)dx = 1",
        ],
        note: "均值 μ 决定曲线对称轴；标准差 σ 越小曲线越瘦陡高耸，σ 越大越矮胖平缓。",
        level: "core",
      },
      {
        name: "正态分布 3-σ 原则 (高考核心)",
        latex:
          "P(\\mu-\\sigma \\le X \\le \\mu+\\sigma) \\approx 68.27\\% \\quad P(\\mu-2\\sigma \\le X \\le \\mu+2\\sigma) \\approx 95.45\\%",
        prerequisites: ["X \\sim N(\\mu, \\sigma^2)"],
        note: "落在 [μ-3σ, μ+3σ] 之外的概率仅约 0.27%，为小概率事件。",
        level: "important",
      },
      {
        name: "频率分布直方图基本性质",
        latex:
          "\\sum (\\text{高}_i \\times \\text{组距}_i) = \\sum \\text{频率}_i = 1",
        note: "直方图纵轴为 频率/组距，矩形面积为频率。矩形总面积恒为 1。",
        level: "derived",
      },
    ],
    gaokaoPoints: [
      {
        text: "【高考考点】直方图估算平均数 ∑(中点×频率)、中位数（平分面积）和众数（最高组中点）。",
        importance: "gaokao",
      },
      {
        text: "【高考考点】利用正态曲线对称性 P(X ≤ μ) = 0.5 与 3-σ 原则求解区间概率。",
        importance: "gaokao",
      },
    ],
    warnings: [
      {
        text: "警示：直方图纵轴表示“频率/组距”，面积才是频率！切勿将纵轴高度直接当作频率。",
        level: "warning",
      },
      {
        text: "前提：标准差 σ 必须大于 0；σ 趋近于 0 时退化为确定常数。",
        level: "info",
      },
    ],
    mnemonic:
      "均值决定中心位置，标准差定胖瘦高低；正态曲线左右对称，三倍标准差几乎包罗万象！",
  };
}
