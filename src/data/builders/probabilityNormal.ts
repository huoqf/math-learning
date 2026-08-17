import type { MathPanelData } from "../types";
import {
  generateHistogramBins,
  estimateHistogramStats,
  normalPdf,
  calcSymmetricNormalIntervals,
} from "@/math/probabilityNormal";
import { MATH_COLORS } from "@/theme";

export function buildProbabilityNormalPanel(
  params: Record<string, number>,
  config?: Record<string, unknown>,
): MathPanelData {
  const mu = params.mu ?? 0;
  const sigma = Math.max(0.1, params.sigma ?? 1);
  const binCount = params.binCount ?? 10;
  const sampleSize = params.sampleSize ?? 300;
  const skewness = params.skewness ?? 0;
  const percentileP = params.percentileP ?? 50;
  const x0 = params.x0 ?? -1;
  const studyMode = (config?.studyMode as string) ?? "histogram";

  // 直方图数据与统计计算
  const bins = generateHistogramBins(mu, sigma, binCount, sampleSize, skewness);
  const stats = estimateHistogramStats(bins, percentileP);

  // 正态曲线特征
  const peakHeight = normalPdf(mu, mu, sigma);
  const symData = calcSymmetricNormalIntervals(mu, sigma, x0);

  // 1. 直方图与数字特征模式
  if (studyMode === "histogram") {
    let skewText = "对称分布 (众数 ≈ 中位数 ≈ 均值)";
    if (skewness > 0.2) {
      skewText = "右偏分布 (众数 < 中位数 < 均值)";
    } else if (skewness < -0.2) {
      skewText = "左偏分布 (均值 < 中位数 < 众数)";
    }

    const iqr = stats.q3 - stats.q1;

    return {
      quantities: [
        {
          label: "直方图均值 x̄",
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
          label: `第 ${percentileP}% 百分位数 P_${percentileP}`,
          value: `${stats.percentilePValue.toFixed(3)}`,
          color: MATH_COLORS.paramTertiary,
          highlight: "positive",
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
        {
          label: "四分位距 IQR (Q₃-Q₁)",
          value: `${iqr.toFixed(3)}`,
          color: MATH_COLORS.paramTertiary,
        },
        {
          label: "矩形总面积 ∑Sᵢ (恒为1)",
          value: `${stats.totalArea.toFixed(4)}`,
          color: MATH_COLORS.paramPrimary,
        },
      ],
      theorems: [
        {
          name: "频率分布直方图基本性质 (面积即频率)",
          latex:
            "S_i = \\frac{\\text{频率}_i}{\\text{组距}_i} \\times \\text{组距}_i = \\text{频率}_i \\quad \\sum_{i=1}^K S_i = 1",
          note: "纵轴表示'频率/组距'，各矩形面积等于该组频率，所有矩形面积之和恒等于 1。",
          level: "core",
        },
        {
          name: "三大数字特征估算与偏态关系",
          latex:
            "\\bar{x} = \\sum_{i=1}^{k} x_i \\cdot f_i \\quad m_e: \\text{平分面积} \\quad \\text{当前形态: }" +
            skewText,
          note: "中位数将直方图面积二等分；众数为最高矩形底边中点；平均数是直方图的物理平衡重心。",
          level: "important",
        },
      ],
      gaokaoPoints: [
        {
          text: "【高考考点】直方图估算平均数 ∑(组中点×频率)、中位数（平分面积线）和众数（最高矩形中点）。",
          importance: "gaokao",
        },
        {
          text: "【高考考点】百分位数：第 p 百分位数左侧面积占总面积的 p%。四分位数 Q₁(25%)、Q₃(75%)、四分位距 IQR = Q₃ - Q₁ 为新高考热点。",
          importance: "gaokao",
        },
      ],
      warnings: [
        {
          text: "警示：直方图纵轴不是频率！切勿将纵轴读数直接当成频率相加计算。",
          level: "warning",
        },
      ],
      mnemonic:
        "面积是频率总和恒为一，中位数平分面积，众数看最高矩形中点，平均数组中值乘频率！",
    };
  }

  // 2. 极限逼近与正态拟合模式
  if (studyMode === "normalFit") {
    const binWidth = bins[0]?.width ?? 0;
    const maxHistDensity = Math.max(...bins.map((b) => b.density));
    const densityDiff = Math.abs(maxHistDensity - peakHeight);

    return {
      quantities: [
        {
          label: "当前组距 Δx",
          value: `${binWidth.toFixed(3)}`,
          color: MATH_COLORS.function,
        },
        {
          label: "正态理论峰值 f(μ)",
          value: `${peakHeight.toFixed(3)}`,
          color: MATH_COLORS.paramPrimary,
        },
        {
          label: "直方图最大密度",
          value: `${maxHistDensity.toFixed(3)}`,
          color: MATH_COLORS.barBorder,
        },
        {
          label: "峰值拟合残差 |Δf|",
          value: `${densityDiff.toFixed(4)}`,
          color: MATH_COLORS.paramSecondary,
          highlight: densityDiff < 0.05 ? "positive" : undefined,
        },
        {
          label: "直方图实测总面积",
          value: `${stats.totalArea.toFixed(4)}`,
          color: MATH_COLORS.paramPrimary,
        },
      ],
      theorems: [
        {
          name: "大数定律与极限逼近 (中心极限定理)",
          latex:
            "\\lim_{N \\to \\infty, \\Delta x \\to 0} \\sum \\frac{f_i}{\\Delta x}\\Delta x = \\int_{-\\infty}^{+\\infty} f(x)dx = 1",
          note: "当样本容量 N 趋近无穷大且组距 Δx 趋近 0 时，频率折线图逐步光滑收敛为正态分布密度曲线。",
          level: "core",
        },
        {
          name: "正态分布密度函数 N(μ, σ²)",
          latex:
            "f(x) = \\frac{1}{\\sqrt{2\\pi}\\color{#D97706}{\\sigma}} e^{-\\frac{(x - \\color{#EF4444}{\\mu})^2}{2\\color{#D97706}{\\sigma}^2}}",
          prerequisites: [
            "$\\sigma > 0$",
            "$\\int_{-\\infty}^{+\\infty} f(x)dx = 1$",
          ],
          note: "曲线关于直线 x = μ 对称，且在 x = μ 处取得最大值 1/(√(2π)σ)。",
          level: "important",
        },
      ],
      gaokaoPoints: [
        {
          text: "【高考考点】理解从直方图离散统计到正态分布连续概率密度的连续化极限过程。",
          importance: "gaokao",
        },
      ],
      warnings: [
        {
          text: "提示：样本量越充分、组距越细密，直方图与理论正态曲线的拟合度越高。",
          level: "info",
        },
      ],
      mnemonic:
        "样本增大组距缩，阶梯渐变钟形坡；离散频率积为积，连续积分面积一！",
    };
  }

  // 3. 正态参数与形态探究模式
  if (studyMode === "paramsShape") {
    const inflectL = mu - sigma;
    const inflectR = mu + sigma;
    const inflectHeight = normalPdf(inflectL, mu, sigma);
    const fwhm = 2 * Math.sqrt(2 * Math.log(2)) * sigma; // 半峰全宽 ≈ 2.355σ
    const inflectionRatio = (inflectHeight / peakHeight) * 100; // e^(-0.5) ≈ 60.65%

    return {
      quantities: [
        {
          label: "最大概率密度 f_max",
          value: `${peakHeight.toFixed(3)}`,
          color: MATH_COLORS.paramPrimary,
        },
        {
          label: "左拐点 (μ-σ, f)",
          value: `(${inflectL.toFixed(2)}, ${inflectHeight.toFixed(3)})`,
          color: MATH_COLORS.paramSecondary,
        },
        {
          label: "右拐点 (μ+σ, f)",
          value: `(${inflectR.toFixed(2)}, ${inflectHeight.toFixed(3)})`,
          color: MATH_COLORS.paramSecondary,
        },
        {
          label: "拐点高度比 f(μ±σ)/f_max",
          value: `${inflectionRatio.toFixed(1)}% (e^{-0.5})`,
          color: MATH_COLORS.paramSecondary,
        },
        {
          label: "半峰全宽 FWHM",
          value: `${fwhm.toFixed(3)} (≈ 2.355σ)`,
          color: MATH_COLORS.function,
        },
        {
          label: "全域理论总概率",
          value: "1.0000 (100%)",
          color: MATH_COLORS.paramPrimary,
          highlight: "positive",
        },
      ],
      theorems: [
        {
          name: "参数 μ 与 σ 的几何意义",
          latex:
            "\\text{对称轴: } x = \\color{#EF4444}{\\mu} \\quad \\text{最大值: } f_{\\max} = \\frac{1}{\\sqrt{2\\pi}\\color{#D97706}{\\sigma}}",
          note: "μ 决定中心位置（平移）；σ 决定高矮胖瘦（σ 越小越瘦高陡峭，数据越集中；σ 越大越矮胖平缓，数据越分散）。",
          level: "core",
        },
        {
          name: "曲线凹凸性与拐点",
          latex:
            "x \\in (\\mu-\\sigma, \\mu+\\sigma) \\text{ 为凸区间，} x = \\mu \\pm \\sigma \\text{ 为拐点}",
          note: "拐点横坐标恰好相距 1 个标准差 σ，拐点处高度固定为最高点的 60.65%。",
          level: "important",
        },
      ],
      gaokaoPoints: [
        {
          text: "【高考考点】新高考常以两组正态数据（如甲乙两班成绩）同图对比，考察“比较两组均值 μ₁ 与 μ₂ 的大小”及“比较标准差 σ₁ 与 σ₂ 的分散程度”。",
          importance: "gaokao",
        },
      ],
      warnings: [
        {
          text: "核心：无论 μ 和 σ 如何变化，正态曲线与 x 轴所夹的总面积恒等于 1。",
          level: "info",
        },
      ],
      mnemonic: "均值定中心，方差定胖瘦；σ 越小越陡峭，面积恒为一！",
    };
  }

  // 4. 对称性与高考 3-σ 解题模式
  const z0 = (x0 - mu) / sigma;
  const isStandardNormal = Math.abs(mu) < 0.01 && Math.abs(sigma - 1) < 0.01;
  const devDistance = Math.abs(x0 - mu);

  return {
    quantities: [
      {
        label: "对称镜像点 2μ - x₀",
        value: `${symData.xSym.toFixed(2)}`,
        color: MATH_COLORS.setB,
        highlight: "positive",
      },
      {
        label: "偏离均值距离 |x₀ - μ|",
        value: `${devDistance.toFixed(2)} (${(devDistance / sigma).toFixed(2)}σ)`,
        color: MATH_COLORS.paramSecondary,
      },
      {
        label: "标准化分位数 Z₀",
        value: `${z0.toFixed(2)}`,
        color: MATH_COLORS.function,
      },
      {
        label: `单侧尾部概率 P(X ≤ ${symData.leftX.toFixed(1)})`,
        value: `${(symData.tailProb * 100).toFixed(2)}%`,
        color: MATH_COLORS.paramTertiary,
      },
      {
        label: `对称右尾概率 P(X ≥ ${symData.rightX.toFixed(1)})`,
        value: `${(symData.tailProb * 100).toFixed(2)}%`,
        color: MATH_COLORS.setB,
      },
      {
        label: `对称区间 P(${symData.leftX.toFixed(1)} ≤ X ≤ ${symData.rightX.toFixed(1)})`,
        value: `${(symData.centerProb * 100).toFixed(2)}%`,
        color: MATH_COLORS.paramSecondary,
        highlight: "positive",
      },
    ],
    theorems: [
      {
        name: "正态分布 3-σ 原则 (高考核心数据)",
        latex:
          "P(\\mu-\\sigma \\le X \\le \\mu+\\sigma) \\approx 68.27\\% \\quad P(\\mu-2\\sigma \\le X \\le \\mu+2\\sigma) \\approx 95.45\\% \\quad P(\\mu-3\\sigma \\le X \\le \\mu+3\\sigma) \\approx 99.73\\%",
        prerequisites: ["$X \\sim N(\\mu, \\sigma^2)$"],
        note: "落在 [μ-3σ, μ+3σ] 之外的概率仅约 0.27%，为小概率事件。",
        level: "core",
      },
      {
        name: "高考对称转化公式组",
        latex:
          "P(X \\le \\mu-a) = P(X \\ge \\mu+a) \\quad P(\\mu-a \\le X \\le \\mu+a) = 1 - 2P(X \\le \\mu-a)",
        note: "利用对称性 P(X ≤ μ) = 0.5，可快速将未知单侧或双侧区间转化为已知面积。",
        level: "core",
      },
      {
        name: "标准化变量变换公式",
        latex:
          "Z = \\frac{X - \\color{#EF4444}{\\mu}}{\\color{#D97706}{\\sigma}} \\sim N(0, 1) \\quad \\Rightarrow \\quad P(X \\le x_0) = \\Phi(Z_0)",
        note: isStandardNormal
          ? "当前已为标准正态分布 N(0, 1)。"
          : `当前 x₀ = ${x0.toFixed(2)} 对应标准正态分位数 Z₀ = ${z0.toFixed(2)}。`,
        level: "important",
      },
    ],
    gaokaoPoints: [
      {
        text: "【高考必考】对称性公式：P(X < a) + P(X > a) = 1；若 P(X < a) = P(X > b)，则对称轴 μ = (a+b)/2。",
        importance: "gaokao",
      },
      {
        text: "【高考必考】3-σ 原则结合二项分布综合题：先由 3-σ 计算单件产品合格率 p，再由独立重复试验计算恰有 k 件合格的概率 C_n^k p^k (1-p)^{n-k}。",
        importance: "gaokao",
      },
    ],
    warnings: [
      {
        text: "牢记：正态分布关于 x = μ 对称，任意点 x 与 2μ - x 处的概率密度完全相等 f(x) = f(2μ - x)。",
        level: "info",
      },
    ],
    mnemonic:
      "一倍六八二，两倍九五四，三倍九九七；关于均值成镜像，对称转化解难题！",
  };
}
