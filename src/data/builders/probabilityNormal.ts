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
          label: "直方图中位数 $m_e$",
          value: `${stats.median.toFixed(3)}`,
          color: MATH_COLORS.paramSecondary,
        },
        {
          label: "直方图众数 $m_o$",
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
          note: "纵轴表示『频率/组距』，各矩形面积等于该组频率，所有矩形面积之和恒等于 1。",
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
          label: "直方图实测最高高度",
          value: `${maxHistDensity.toFixed(3)}`,
          color: MATH_COLORS.barBorder,
        },
        {
          label: "峰度接近差值",
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
          name: "频率直方图向总体密度曲线逼近",
          latex:
            "\\text{样本容量 } N \\to \\infty \\text{ 且组距 } \\Delta x \\to 0 \\text{ 时，频率折线图无限逼近总体正态曲线 } f(x)",
          note: "高中数学概率统计核心思想：由离散样本频率矩形逐步光滑演变为连续总体钟形密度曲线。",
          level: "core",
        },
        {
          name: "正态分布密度曲线 N(μ, σ²)",
          latex: `f(x) = \\frac{1}{\\sqrt{2\\pi}\\color{${MATH_COLORS.paramSecondary}}{\\sigma}} e^{-\\frac{(x - \\color{${MATH_COLORS.paramPrimary}}{\\mu})^2}{2\\color{${MATH_COLORS.paramSecondary}}{\\sigma}^2}}`,
          prerequisites: ["$\\sigma > 0$", "曲线与 $x$ 轴所围总面积为 1"],
          note: "曲线关于直线 x = μ 对称，且在 x = μ 处取得最大值 1/(√(2π)σ)。",
          level: "important",
        },
      ],
      gaokaoPoints: [
        {
          text: "【高考考点】理解从直方图离散统计到正态分布连续概率密度的过渡过程；曲线下方全域面积恒为 1。",
          importance: "gaokao",
        },
      ],
      warnings: [
        {
          text: "提示：样本量越充分、组距越细密，直方图上底边折线与理论正态曲线的贴合度越高。",
          level: "info",
        },
      ],
      mnemonic:
        "样本增大组距缩，阶梯渐变钟形坡；离散频率和为积，连续曲线面积一！",
    };
  }

  // 3. 正态参数与形态探究模式
  if (studyMode === "paramsShape") {
    const inflectL = mu - sigma;
    const inflectR = mu + sigma;
    const inflectHeight = normalPdf(inflectL, mu, sigma);
    const inflectionRatio = (inflectHeight / peakHeight) * 100; // e^(-0.5) ≈ 60.65%

    let dispersionDesc = "标准适中";
    if (sigma <= 0.6) {
      dispersionDesc = "陡峭集中型 (数据高度集中在均值附近)";
    } else if (sigma >= 1.4) {
      dispersionDesc = "平缓分散型 (数据波动范围较宽)";
    }

    return {
      quantities: [
        {
          label: "对称轴位置 x = μ",
          value: `${mu.toFixed(2)}`,
          color: MATH_COLORS.paramPrimary,
          highlight: "positive",
        },
        {
          label: "曲线最大峰值 $f_{\\max}$",
          value: `${peakHeight.toFixed(3)}`,
          color: MATH_COLORS.paramPrimary,
        },
        {
          label: "数据离散状态",
          value: dispersionDesc,
          color: MATH_COLORS.function,
        },
        {
          label: "弯曲改变点 x = μ±σ",
          value: `[${inflectL.toFixed(2)}, ${inflectR.toFixed(2)}]`,
          color: MATH_COLORS.paramSecondary,
        },
        {
          label: "μ±σ 处相对峰高比",
          value: `${inflectionRatio.toFixed(1)}% (e^{-0.5})`,
          color: MATH_COLORS.paramSecondary,
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
          name: "参数 μ 与 σ 的几何与统计意义",
          latex: `\\text{对称轴: } x = \\color{${MATH_COLORS.paramPrimary}}{\\mu} \\quad \\text{最大值: } f_{\\max} = \\frac{1}{\\sqrt{2\\pi}\\color{${MATH_COLORS.paramSecondary}}{\\sigma}}`,
          note: "μ 决定中心对称轴位置（曲线左右刚性平移）；σ 决定高矮胖瘦（σ 越小越瘦高陡峭，数据越集中；σ 越大越矮胖平缓，数据越分散）。",
          level: "core",
        },
        {
          name: "单调性与曲率变化",
          latex:
            "(-\\infty, \\mu] \\text{ 单调递增，} [\\mu, +\\infty) \\text{ 单调递减，} x = \\mu \\pm \\sigma \\text{ 处弯曲转向}",
          note: "在 $x < \\mu$ 时曲线上升，在 $x > \\mu$ 时曲线下降；在 $x = \\mu \\pm \\sigma$ 处高度固定为最高峰值的 $e^{-0.5} \\approx 60.65\\%$。",
          level: "important",
        },
      ],
      gaokaoPoints: [
        {
          text: "【高考考点】比较两组正态数据（如甲乙两班模考成绩）：曲线对称轴位置判定均值 μ₁ 与 μ₂ 的大小；曲线峰值高低判定标准差 σ₁ 与 σ₂ 的离散程度。",
          importance: "gaokao",
        },
      ],
      warnings: [
        {
          text: "核心：无论 μ 如何平移、σ 如何伸缩，正态曲线与 x 轴所围图形的总面积恒等于 1。",
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
        label: "标准化变量 Z₀",
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
    reasoningSteps: [
      {
        step: 1,
        title: "第一步：确定对称轴与镜像点",
        latex: `x_{\\text{sym}} = 2\\color{${MATH_COLORS.paramPrimary}}{\\mu} - x_0 = 2 \\times ${mu.toFixed(1)} - (${x0.toFixed(1)}) = ${symData.xSym.toFixed(2)}`,
        detail: `正态分布曲线关于直线 $x = \\mu = ${mu.toFixed(1)}$ 轴对称，基准点 $x_0 = ${x0.toFixed(1)}$ 的镜面对称点为 $2\\mu - x_0 = ${symData.xSym.toFixed(2)}$。`,
      },
      {
        step: 2,
        title: "第二步：对称转化单侧尾部概率",
        latex: `P(X \\ge ${symData.rightX.toFixed(1)}) = P(X \\le ${symData.leftX.toFixed(1)}) = ${(symData.tailProb * 100).toFixed(2)}\\%`,
        detail: `由图形关于对称轴完全对称的几何性质，两端对称尾部的阴影面积严格相等。`,
      },
      {
        step: 3,
        title: "第三步：利用全概率归一求解对称区间",
        latex: `P(${symData.leftX.toFixed(1)} \\le X \\le ${symData.rightX.toFixed(1)}) = 1 - 2P(X \\le ${symData.leftX.toFixed(1)}) = ${(symData.centerProb * 100).toFixed(2)}\\%`,
        detail: `正态曲线与 $x$ 轴所夹总概率恒为 $1$，从总概率中扣除两侧对称尾部，即得中间双侧对称概率。`,
      },
    ],
    theorems: [
      {
        name: "正态分布 3-σ 原则 (高考必记数据)",
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
        note: "利用对称性 P(X ≤ μ) = 0.5，可快速将未知单侧或双侧区间转化为已知对称面积。",
        level: "core",
      },
      {
        name: "标准化变量变换公式",
        latex: `Z = \\frac{X - \\color{${MATH_COLORS.paramPrimary}}{\\mu}}{\\color{${MATH_COLORS.paramSecondary}}{\\sigma}} \\sim N(0, 1) \\quad \\Rightarrow \\quad P(X \\le x_0) = \\Phi(Z_0)`,
        note: isStandardNormal
          ? "当前已为标准正态分布 N(0, 1)。"
          : `当前 x₀ = ${x0.toFixed(2)} 对应标准正态变量 Z₀ = ${z0.toFixed(2)}。`,
        level: "important",
      },
    ],
    gaokaoPoints: [
      {
        text: "【高考必考】对称性公式：P(X < a) + P(X > a) = 1；若 P(X < a) = P(X > b)，则对称轴 μ = (a+b)/2。",
        importance: "gaokao",
      },
      {
        text: "【高考必考】3-σ 原则结合二项分布综合题：先由 3-σ 计算单件产品合格率 $p$，再由独立重复试验计算恰有 $k$ 件合格的概率 $C_n^k p^k (1-p)^{n-k}$。",
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
