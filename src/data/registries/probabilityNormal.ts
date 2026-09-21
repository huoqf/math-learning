import { MATH_COLORS } from "@/theme";

export interface ParamMeta {
  label: string;
  labelFormula?: string;
  defaultValue: number;
  min: number;
  max: number;
  step?: number;
  description: string;
  descriptionFormula?: string;
  importance?: "core" | "display" | "advanced";
  marks?: Array<{
    value: number;
    label: string;
    labelFormula?: string;
    variant?: "zero" | "critical" | "recommended";
  }>;
}

/**
 * 正态分布页研究模式。
 *
 * 分册职能边界（审计 P1-3 决策）：
 *   频率分布直方图的**特征数精细计算**（众数 / 中位数 / 平均数 / 百分位数 / 四分位数）
 *   属人教A版必修二第九章，由 `know-stat-percentile`（/stat-percentile）唯一承载。
 *   本页（选择性必修三 7.5 正态分布）只保留直方图的**连续化逼近**职能：
 *   直方图渲染仅作为"组距细化 → 轮廓趋于光滑正态曲线"的直观佐证，不再重复讲解特征数。
 *   原 `histogram` 模式已移除，避免同一内容在必修二与选必三两页重复呈现。
 */
export type NormalStudyMode = "normalFit" | "paramsShape" | "sigmaRule";

export interface NormalScenario {
  key: string;
  label: string;
  badge: string;
  background: string;
  condition: string;
  question: string;
  params?: Partial<Record<string, number>>;
  visibleKeys?: string[];
  showSigmaIntervals?: boolean;
}

export const defaultParams: Record<string, number> = {
  mu: 0,
  sigma: 1,
  binCount: 10,
  sampleSize: 300,
  blend: 0.5,
  x0: -1,
  x1: -1,
  x2: 1,
};

export const MODE_SCENARIOS: Record<NormalStudyMode, NormalScenario[]> = {
  normalFit: [
    {
      key: "free",
      label: "自由探索",
      badge: "核心思想 · 离散到连续",
      background:
        "高中数学概率统计核心思想：由离散样本直方图向总体连续正态曲线的过渡演变。本模式承接必修二第九章频率分布直方图（特征数精细计算已在必修二完成），只聚焦其组距细化、样本量扩大后的连续化延伸。",
      condition:
        "固定总体参数 $\\mu$ 与 $\\sigma$，调节样本容量 $N$、组数 $K$ 与平滑比例。",
      question:
        "探究频率矩形上底边折线随组距缩小与样本量扩增时向理论钟形正态曲线的收敛极限。",
      params: { mu: 0, sigma: 1, binCount: 10, sampleSize: 300, blend: 0.5 },
      visibleKeys: ["binCount", "sampleSize", "blend"],
    },
    {
      key: "coarse",
      label: "小样本粗划分阶段",
      badge: "课标对比 · 离散阶梯特征",
      background:
        "抽样调查初期样本容量较小且分组较少的情形。承接必修二第九章频率分布直方图，本模式只关注组距细化后直方图轮廓向正态曲线的连续化逼近。",
      condition: "样本容量 $N = 80$，划分为 $6$ 组，组距较宽。",
      question:
        "计算当前分组矩形高度与连续理论正态峰值的差值，分析小样本粗分组带来的估算误差。",
      params: { mu: 0, sigma: 1, binCount: 6, sampleSize: 80, blend: 0.2 },
      visibleKeys: ["binCount", "sampleSize", "blend"],
    },
    {
      key: "dense",
      label: "大样本密集逼近阶段",
      badge: "极限思想 · 渐近总体曲线",
      background:
        "大数据海量抽样情境：样本量充分巨大且组距极细。承接必修二第九章——直方图组距不断细分时，其上底边折线轮廓趋于光滑正态曲线。",
      condition: "样本容量 $N = 800$，划分为 $20$ 组，细密网格切分。",
      question:
        "证明各细分组矩形频率累加向总体正态曲线下方积分面积恒等于 $1$ 的收敛过程。",
      params: { mu: 0, sigma: 1, binCount: 20, sampleSize: 800, blend: 0.8 },
      visibleKeys: ["binCount", "sampleSize", "blend"],
    },
  ],
  paramsShape: [
    {
      key: "free",
      label: "自由探索",
      badge: "数形结合 · 均值与方差",
      background:
        "探究正态分布两大约束参数 $\\mu$（期望/均值）与 $\\sigma$（标准差）对曲线形态的决定性作用。",
      condition:
        "随机变量 $X \\sim N(\\mu, \\sigma^2)$，曲线关于直线 $x = \\mu$ 严格对称。",
      question:
        "求解对称轴方程 $x = \\mu$ 与最大高度值 $f_{\\max}$，判定标准差 $\\sigma$ 对数据离散程度的单调控制。",
      params: { mu: 0, sigma: 1 },
      visibleKeys: ["mu", "sigma"],
    },
    {
      key: "standard",
      label: "标准正态基准 N(0, 1)",
      badge: "课标基准 · 标准正态分布",
      background:
        "高中数学选必三课标核心基准分布：期望 $\\mu = 0$、方差 $\\sigma^2 = 1$ 的标准正态分布。",
      condition:
        "$X \\sim N(0, 1)$，对称轴为 $y$ 轴（$x = 0$），最大高度 $f(0) = \\frac{1}{\\sqrt{2\\pi}} \\approx 0.399$。",
      question:
        "求解标准正态分布在原点处的峰值与对称区间概率，确立标准化变量代换基准。",
      params: { mu: 0, sigma: 1 },
      visibleKeys: ["mu", "sigma"],
    },
    {
      key: "sharp",
      label: "尖锐集中型 (小 σ)",
      badge: "高考对比 · 离散度极小",
      background:
        "高精度加工或发挥极稳定的考生群体：成绩或尺寸高度集中在均值附近。",
      condition: "$\\mu = 0, \\sigma = 0.5$，标准差较小。",
      question:
        "计算峰值高度并证明 $\\sigma$ 缩小时正态曲线陡峭化与数据集中度的对应关系。",
      params: { mu: 0, sigma: 0.5 },
      visibleKeys: ["mu", "sigma"],
    },
    {
      key: "flat",
      label: "平缓分散型 (大 σ)",
      badge: "高考对比 · 离散度较大",
      background: "成绩两极分化或生产波动较大的样本：数据离散度显著增大。",
      condition: "$\\mu = 0.5, \\sigma = 1.6$，标准差较大且对称轴向右平移。",
      question:
        "证明无论 $\\sigma$ 如何增大导致峰值下降，正态曲线与横轴所夹全域总概率恒等于 $1$。",
      params: { mu: 0.5, sigma: 1.6 },
      visibleKeys: ["mu", "sigma"],
    },
  ],
  sigmaRule: [
    {
      key: "free",
      label: "自由探索",
      badge: "高考解题 · 3-σ 准则与对称性",
      background:
        "高考必考题型：利用正态曲线轴对称性与 3-σ 准则快速求解未知区间概率。",
      condition:
        "$X \\sim N(\\mu, \\sigma^2)$，给定基准点 $x_0$，其关于 $\\mu$ 的镜像对称点为 $2\\mu - x_0$。",
      question:
        "求解镜像对称点坐标 $x_{\\text{sym}} = 2\\mu - x_0$，计算单侧对称尾部概率与中间双侧对称区间概率。",
      params: { mu: 0, sigma: 1, x0: -1 },
      visibleKeys: ["mu", "sigma", "x0"],
      showSigmaIntervals: false,
    },
    {
      key: "partQuality",
      label: "零件尺寸 2-σ 质检模型",
      badge: "新高考真题 · 实际工业应用",
      background:
        "新高考全国卷经典工业质检背景：精密零件加工中，尺寸偏差超出 $[\\mu - 2\\sigma, \\mu + 2\\sigma]$ 的零件视为超标次品。",
      condition:
        "零件尺寸 $X \\sim N(0, 0.8^2)$，取下限警戒线 $x_0 = -1.6$ 恰好偏离均值 $-2\\sigma$。",
      question:
        "利用 $2\\sigma$ 准则 $P(\\mu - 2\\sigma \\le X \\le \\mu + 2\\sigma) \\approx 95.45\\%$，求解次品率与单侧超标废品率 $P(X < -1.6)$。",
      params: { mu: 0, sigma: 0.8, x0: -1.6 },
      visibleKeys: ["mu", "sigma", "x0"],
      showSigmaIntervals: true,
    },
    {
      key: "scoreQuota",
      label: "考录切线分与单侧达标",
      badge: "高考常考 · 重点线切线分",
      background:
        "高三模考总分划线分析：某重点高校划定前 $15.87\\%$ 的考生成绩为自招达标线。",
      condition:
        "成绩标准化后 $X \\sim N(0, 1^2)$，切线分对应 $x_0 = 1.0$（偏离均值 $+1\\sigma$）。",
      question:
        "由 $P(\\mu - \\sigma \\le X \\le \\mu + \\sigma) \\approx 68.27\\%$ 对称转化求解 $P(X \\ge 1) = \\frac{1 - 0.6827}{2} \\approx 15.87\\%$ 的录取人数。",
      params: { mu: 0, sigma: 1, x0: 1 },
      visibleKeys: ["mu", "sigma", "x0"],
      showSigmaIntervals: true,
    },
  ],
};

export const paramMeta: Record<string, ParamMeta> = {
  mu: {
    label: "均值 μ",
    labelFormula: `\\text{均值 } \\color{${MATH_COLORS.paramPrimary}}{\\mu}`,
    defaultValue: 0,
    min: -2.5,
    max: 2.5,
    step: 0.1,
    description: "决定正态分布曲线的对称轴与中心位置",
    descriptionFormula: `x = \\color{${MATH_COLORS.paramPrimary}}{\\mu}`,
    importance: "core",
    marks: [
      {
        value: 0,
        label: "μ = 0",
        labelFormula: `\\color{${MATH_COLORS.paramPrimary}}{\\mu} = 0`,
        variant: "critical",
      },
    ],
  },
  sigma: {
    label: "标准差 σ",
    labelFormula: `\\text{标准差 } \\color{${MATH_COLORS.paramSecondary}}{\\sigma}`,
    defaultValue: 1,
    min: 0.4,
    max: 1.8,
    step: 0.1,
    description: "决定正态分布曲线的分散程度（σ越小越瘦陡，σ越大越矮胖）",
    descriptionFormula: `\\color{${MATH_COLORS.paramSecondary}}{\\sigma} > 0`,
    importance: "core",
    marks: [
      {
        value: 1,
        label: "σ = 1",
        labelFormula: `\\color{${MATH_COLORS.paramSecondary}}{\\sigma} = 1`,
        variant: "recommended",
      },
    ],
  },
  binCount: {
    label: "直方图组数 K",
    labelFormula: `\\text{组数 } \\color{${MATH_COLORS.paramTertiary}}{K}`,
    defaultValue: 10,
    min: 5,
    max: 24,
    step: 1,
    description: "数据切分的分组个数（组距 Δx = 全程 / K）",
    descriptionFormula: "\\Delta x = \\frac{7\\sigma}{K}",
    importance: "display",
  },
  sampleSize: {
    label: "样本容量 N",
    labelFormula: `\\text{样本容量 } \\color{${MATH_COLORS.paramTertiary}}{N}`,
    defaultValue: 300,
    min: 50,
    max: 1000,
    step: 50,
    description: "抽样调查的总体数据样本个数",
    importance: "display",
  },
  blend: {
    label: "拟合过渡比例",
    labelFormula: `\\text{平滑拟合 } \\color{${MATH_COLORS.paramTertiary}}{\\lambda}`,
    defaultValue: 0.5,
    min: 0,
    max: 1,
    step: 0.1,
    description: "直方图折线向光滑正态曲线的过渡逼近比例",
    importance: "display",
  },
  x0: {
    label: "对称探究点 x₀",
    labelFormula: `\\text{基准点 } \\color{${MATH_COLORS.paramPrimary}}{x_0}`,
    defaultValue: -1,
    min: -4,
    max: 4,
    step: 0.1,
    description: "探究关于 μ 对称点 2μ - x₀ 的基准位置",
    importance: "core",
  },
  x1: {
    label: "区间左端点 x₁",
    labelFormula: `\\text{左端点 } \\color{${MATH_COLORS.paramTertiary}}{x_1}`,
    defaultValue: -1,
    min: -4,
    max: 4,
    step: 0.1,
    description: "目标计算概率区间的左侧边界",
    importance: "core",
  },
  x2: {
    label: "区间右端点 x₂",
    labelFormula: `\\text{右端点 } \\color{${MATH_COLORS.paramTertiary}}{x_2}`,
    defaultValue: 1,
    min: -4,
    max: 4,
    step: 0.1,
    description: "目标计算概率区间的右侧边界",
    importance: "core",
  },
};
