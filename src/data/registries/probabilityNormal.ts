/**
 * 频率分布直方图与正态分布参数注册与描述元数据
 */

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
  sampleSize: 200,
  x1: -1,
  x2: 1,
};

export const paramMeta: Record<string, ParamMeta> = {
  mu: {
    label: "均值 μ",
    labelFormula: "\\text{均值 } \\color{#EF4444}{\\mu}",
    defaultValue: 0,
    min: -3,
    max: 3,
    step: 0.1,
    description: "决定正态分布曲线的对称轴与中心位置",
    descriptionFormula: "x = \\color{#EF4444}{\\mu}",
    importance: "core",
    marks: [
      {
        value: 0,
        label: "μ = 0",
        labelFormula: "\\color{#EF4444}{\\mu} = 0",
        variant: "critical",
      },
    ],
  },
  sigma: {
    label: "标准差 σ",
    labelFormula: "\\text{标准差 } \\color{#D97706}{\\sigma}",
    defaultValue: 1,
    min: 0.3,
    max: 2.5,
    step: 0.1,
    description: "决定正态分布曲线的分散程度（σ越小越瘦陡，σ越大越矮胖）",
    descriptionFormula: "\\color{#D97706}{\\sigma} > 0",
    importance: "core",
    marks: [
      {
        value: 1,
        label: "σ = 1",
        labelFormula: "\\color{#D97706}{\\sigma} = 1",
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
    defaultValue: 200,
    min: 50,
    max: 1000,
    step: 50,
    description: "抽样调查的总体数据样本个数",
    importance: "display",
  },
  x1: {
    label: "区间左端点 x₁",
    labelFormula: "\\text{左端点 } \\color{#059669}{x_1}",
    defaultValue: -1,
    min: -4,
    max: 4,
    step: 0.1,
    description: "目标计算概率区间的左侧边界",
    importance: "core",
  },
  x2: {
    label: "区间右端点 x₂",
    labelFormula: "\\text{右端点 } \\color{#059669}{x_2}",
    defaultValue: 1,
    min: -4,
    max: 4,
    step: 0.1,
    description: "目标计算概率区间的右侧边界",
    importance: "core",
  },
};
