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

export type NormalStudyMode =
  "histogram" | "normalFit" | "paramsShape" | "sigmaRule";

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
  skewness: 0,
  percentileP: 50,
  blend: 0.5,
  x0: -1,
  x1: -1,
  x2: 1,
};

export const MODE_SCENARIOS: Record<NormalStudyMode, NormalScenario[]> = {
  histogram: [
    {
      key: "free",
      label: "自由探索",
      badge: "自主探究 · 直方图与特征量",
      background:
        "某校抽样调查学生综合素养评估成绩，分析数据分布形态与集中趋势。",
      condition:
        "样本数据划分为若干组，纵轴为『频率/组距』，各矩形面积之和恒等于 1。",
      question:
        "求解估算均值、中位数与众数，比较偏态长尾分布对平均数和中位数的拉扯效应。",
      params: {
        mu: 0,
        sigma: 1,
        binCount: 10,
        sampleSize: 300,
        skewness: 0,
        percentileP: 50,
      },
      visibleKeys: ["binCount", "sampleSize", "skewness", "percentileP"],
    },
    {
      key: "examScores",
      label: "统考成绩标准模型",
      badge: "高考经典 · 对称统考成绩",
      background:
        "期末全市高三年级统考数学成绩抽样，满分按标准分换算，整体呈现对称钟形分布。",
      condition:
        "样本量 $N = 500$，划分为 $10$ 组，偏度 $\\alpha = 0$（严格对称）。",
      question:
        "求解直方图估算均值、中位数与众数，证明严格对称分布下三者数值重合的性质。",
      params: {
        mu: 0,
        sigma: 1,
        binCount: 10,
        sampleSize: 500,
        skewness: 0,
        percentileP: 50,
      },
      visibleKeys: ["binCount", "sampleSize", "percentileP"],
    },
    {
      key: "skewSalary",
      label: "偏态右偏长尾模型",
      badge: "新高考热点 · 偏态分布防坑",
      background:
        "高难度数学压轴创新题抽样得分统计：绝大多数学生得分集中在中低分段，少数拔尖学生获得高分拉长右尾。",
      condition: "样本呈现明显右偏长尾分布，偏态系数 $\\alpha = 0.6$。",
      question:
        "比较众数、中位数与平均数的大小次序，证明极端高分如何单向拉大样本平均数。",
      params: {
        mu: 0,
        sigma: 1,
        binCount: 10,
        sampleSize: 400,
        skewness: 0.6,
        percentileP: 50,
      },
      visibleKeys: ["skewness", "percentileP"],
    },
  ],
  normalFit: [
    {
      key: "free",
      label: "自由探索",
      badge: "核心思想 · 离散到连续",
      background:
        "高中数学概率统计核心思想：由离散样本直方图向总体连续正态曲线的过渡演变。",
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
      background: "抽样调查初期样本容量较小且分组较少的情形。",
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
      background: "大数据海量抽样情境：样本量充分巨大且组距极细。",
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
      label: "零件尺寸 3-σ 质检模型",
      badge: "新高考真题 · 实际工业应用",
      background:
        "新高考全国卷经典工业质检背景：机械加工零件直径服从正态分布，超出 $[\\mu - 3\\sigma, \\mu + 3\\sigma]$ 的零件视为次品。",
      condition:
        "零件尺寸 $X \\sim N(0, 0.8^2)$，取 $x_0 = -1.6$ 恰好偏离均值 $2\\sigma$。",
      question:
        "利用 $2\\sigma$ 准则 $P(\\mu - 2\\sigma \\le X \\le \\mu + 2\\sigma) \\approx 95.45\\%$，求解次品率与单侧超标废品率。",
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
  skewness: {
    label: "偏态系数 α",
    labelFormula: `\\text{偏度 } \\color{${MATH_COLORS.paramTertiary}}{\\alpha}`,
    defaultValue: 0,
    min: -1,
    max: 1,
    step: 0.2,
    description: "数据偏斜状态（-1 左偏，0 对称正态，1 右偏）",
    importance: "advanced",
    marks: [
      {
        value: 0,
        label: "对称",
        labelFormula: "\\alpha = 0",
        variant: "critical",
      },
    ],
  },
  percentileP: {
    label: "百分位数 p%",
    labelFormula: `\\text{百分位 } \\color{${MATH_COLORS.paramTertiary}}{p\\%}`,
    defaultValue: 50,
    min: 5,
    max: 95,
    step: 5,
    description: "累计频率达到 p% 对应的分界值（50% 对应中位数）",
    importance: "core",
    marks: [
      {
        value: 50,
        label: "中位数 (50%)",
        labelFormula: "m_e",
        variant: "critical",
      },
    ],
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
