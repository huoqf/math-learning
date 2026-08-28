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
    labelFormula: "\\text{组数 } K",
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
    labelFormula: "\\text{样本容量 } N",
    defaultValue: 300,
    min: 50,
    max: 1000,
    step: 50,
    description: "抽样调查的总体数据样本个数",
    importance: "display",
  },
  skewness: {
    label: "偏态系数 α",
    labelFormula: "\\text{偏度 } \\alpha",
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
    labelFormula: "\\text{平滑拟合 } \\lambda",
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
