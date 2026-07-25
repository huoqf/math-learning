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
  config?: Record<string, unknown>,
): MathPanelData {
  const mu = params.mu ?? 0;
  const sigma = Math.max(0.1, params.sigma ?? 1);
  const binCount = params.binCount ?? 10;
  const sampleSize = params.sampleSize ?? 200;
  const x1 = params.x1 ?? -1;
  const x2 = params.x2 ?? 1;
  const studyMode = (config?.studyMode as string) ?? "histogram";

  // 直方图数据与统计
  const bins = generateHistogramBins(mu, sigma, binCount, sampleSize);
  const stats = estimateHistogramStats(bins);

  // 正态曲线特征
  const peakHeight = normalPdf(mu, mu, sigma);
  const intervalProb = calcIntervalProbability(mu, sigma, x1, x2);

  // 根据探究模式返回不同的右屏内容
  if (studyMode === "histogram") {
    // 直方图与数字特征模式
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
          label: "下四分位数 Q₁ (25%)",
          value: `${stats.q1.toFixed(3)}`,
          color: MATH_COLORS.paramTertiary,
        },
        {
          label: "上四分位数 Q₃ (75%)",
          value: `${stats.q3.toFixed(3)}`,
          color: MATH_COLORS.paramTertiary,
        },
      ],
      theorems: [
        {
          name: "频率分布直方图基本性质",
          latex:
            "\\sum (\\text{高}_i \\times \\text{组距}_i) = \\sum \\text{频率}_i = 1",
          note: "直方图纵轴为 频率/组距，矩形面积为频率。矩形总面积恒为 1。",
          level: "core",
        },
        {
          name: "数字特征估算公式",
          latex:
            "\\bar{x} = \\sum_{i=1}^{k} x_i \\cdot f_i \\quad m_e: \\sum_{i=1}^{m} f_i \\ge 0.5",
          note: "平均数 = Σ(组中值×频率)；中位数为累计频率达到 0.5 的位置。",
          level: "important",
        },
      ],
      gaokaoPoints: [
        {
          text: "【高考考点】直方图估算平均数 ∑(中点×频率)、中位数（平分面积）和众数（最高组中点）。",
          importance: "gaokao",
        },
        {
          text: "【高考考点】直方图中矩形面积 = 频率/组距 × 组距 = 频率，所有矩形面积之和为 1。",
          importance: "gaokao",
        },
        {
          text: "【高考考点】第 p 百分位数：累计频率达到 p 的位置，四分位数 Q₁(25%)、Q₃(75%) 为常考考点。",
          importance: "gaokao",
        },
      ],
      warnings: [
        {
          text: "警示：直方图纵轴表示'频率/组距'，面积才是频率！切勿将纵轴高度直接当作频率。",
          level: "warning",
        },
      ],
      mnemonic:
        "平均数用组中值乘频率求和，中位数找面积一半处，众数看最高矩形中点，四分位数看25%和75%！",
    };
  } else if (studyMode === "normalFit") {
    // 正态分布曲线拟合模式
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
            "$\\sigma > 0$",
            "$\\int_{-\\infty}^{+\\infty} f(x)dx = 1$",
          ],
          note: "均值 μ 决定曲线对称轴；标准差 σ 越小曲线越瘦陡高耸，σ 越大越矮胖平缓。",
          level: "core",
        },
        {
          name: "直方图与正态曲线关系",
          latex:
            "\\text{当 } n \\to \\infty \\text{ 时，直方图轮廓趋近于正态曲线}",
          note: "样本量越大，直方图的频率分布越接近正态分布曲线。",
          level: "important",
        },
      ],
      gaokaoPoints: [
        {
          text: "【高考考点】利用正态曲线对称性 P(X ≤ μ) = 0.5 与 3-σ 原则求解区间概率。",
          importance: "gaokao",
        },
        {
          text: "【高考考点】正态曲线下的面积恒为 1，可通过积分或查表计算区间概率。",
          importance: "gaokao",
        },
      ],
      warnings: [
        {
          text: "前提：标准差 $\\sigma$ 必须大于 0；$\\sigma$ 趋近于 0 时退化为确定常数。",
          level: "info",
        },
      ],
      mnemonic:
        "均值决定中心位置，标准差定胖瘦高低；正态曲线左右对称，面积恒为 1！",
    };
  } else {
    // 3-σ 原则与区间概率模式 (sigmaRule)
    const z1 = (x1 - mu) / sigma;
    const z2 = (x2 - mu) / sigma;
    const isStandardNormal = Math.abs(mu) < 0.01 && Math.abs(sigma - 1) < 0.01;

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
          label: "区间概率 P(x₁≤X≤x₂)",
          value: `${(intervalProb * 100).toFixed(2)}%`,
          color: MATH_COLORS.paramTertiary,
          highlight: "positive",
        },
        {
          label: "区间左端点 x₁",
          value: `${x1.toFixed(2)}`,
          color: MATH_COLORS.paramTertiary,
        },
        {
          label: "区间右端点 x₂",
          value: `${x2.toFixed(2)}`,
          color: MATH_COLORS.paramTertiary,
        },
        ...(isStandardNormal
          ? [
              {
                label: "★ 标准正态分布",
                value: "N(0, 1)",
                color: MATH_COLORS.paramPrimary,
                highlight: "positive" as const,
              },
            ]
          : [
              {
                label: "标准化 Z₁",
                value: `${z1.toFixed(2)}`,
                color: MATH_COLORS.function,
              },
              {
                label: "标准化 Z₂",
                value: `${z2.toFixed(2)}`,
                color: MATH_COLORS.function,
              },
            ]),
      ],
      theorems: [
        {
          name: "正态分布 3-σ 原则 (高考核心)",
          latex:
            "P(\\mu-\\sigma \\le X \\le \\mu+\\sigma) \\approx 68.27\\% \\quad P(\\mu-2\\sigma \\le X \\le \\mu+2\\sigma) \\approx 95.45\\%",
          prerequisites: ["$X \\sim N(\\mu, \\sigma^2)$"],
          note: "落在 [μ-3σ, μ+3σ] 之外的概率仅约 0.27%，为小概率事件。",
          level: "core",
        },
        {
          name: isStandardNormal ? "当前为标准正态分布" : "标准化转换公式",
          latex: isStandardNormal
            ? "\\text{当前：} X \\sim N(0, 1) \\text{，无需标准化}"
            : `Z = \\frac{X - \\color{#EF4444}{${mu.toFixed(1)}}}{\\color{#D97706}{${sigma.toFixed(1)}}} \\quad \\Rightarrow \\quad P(${z1.toFixed(2)} \\le Z \\le ${z2.toFixed(2)})`,
          note: isStandardNormal
            ? "均值 μ=0，标准差 σ=1，已处于标准正态分布状态。"
            : `将 X ∈ [${x1.toFixed(2)}, ${x2.toFixed(2)}] 转化为 Z ∈ [${z1.toFixed(2)}, ${z2.toFixed(2)}]`,
          level: isStandardNormal ? "core" : "important",
        },
      ],
      gaokaoPoints: [
        {
          text: "【高考考点】利用正态曲线对称性 P(X ≤ μ) = 0.5 与 3-σ 原则求解区间概率。",
          importance: "gaokao",
        },
        {
          text: isStandardNormal
            ? "【高考要点】当前为标准正态分布 N(0,1)，可直接使用标准正态分布表。"
            : `【高考考点】标准化 Z = (X-${mu.toFixed(1)})/${sigma.toFixed(1)}，当前区间对应 Z ∈ [${z1.toFixed(2)}, ${z2.toFixed(2)}]。`,
          importance: "gaokao",
        },
      ],
      warnings: [
        {
          text: "前提：标准差 $\\sigma$ 必须大于 0；$\\sigma$ 趋近于 0 时退化为确定常数。",
          level: "info",
        },
        ...(isStandardNormal
          ? []
          : [
              {
                text: `标准化后，$P(${x1.toFixed(2)} \\le X \\le ${x2.toFixed(2)}) = P(${z1.toFixed(2)} \\le Z \\le ${z2.toFixed(2)})$`,
                level: "info" as const,
              },
            ]),
      ],
      mnemonic:
        "一倍标准差 68%，两倍 95%，三倍 99.7%；标准化转换用 Z=(X-μ)/σ！",
    };
  }
}
