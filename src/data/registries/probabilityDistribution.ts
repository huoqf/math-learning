import type { ParamMeta } from "../types";
import { MATH_COLORS } from "@/theme";

export const defaultParams = {
  // 二项分布参数 X ~ B(n, p)
  n: 6,
  p: 0.4,

  // 超几何分布参数 X ~ H(N, M, sampleN)
  N: 12,
  M: 5,
  sampleN: 4,

  // 线性变换 Y = aX + b
  linearA: 2,
  linearB: 1,

  // 双分布逼近对比模式 (超几何 vs 二项分布同屏收敛)
  compareN: 30,
  compareP: 0.35,
  compareSampleN: 4,

  // 决策模型参数 (0.01~0.2 质检次品率 或 0.1~0.9 投资景气概率)
  decisionParam: 0.08,

  // 一般分布概率分配权重（p1+p2+p3 可自由调节，P(X=3) 自动归一补全）
  p1: 0.2,
  p2: 0.4,
  p3: 0.3,
};

export const paramMeta: Record<string, ParamMeta> = {
  n: {
    key: "n",
    label: "试验次数 n",
    labelFormula: `\\text{试验总数 } \\color{${MATH_COLORS.paramPrimary}}{n}`,
    defaultValue: 6,
    min: 1,
    max: 16,
    step: 1,
    importance: "core",
  },
  p: {
    key: "p",
    label: "成功概率 p",
    labelFormula: `\\text{成功概率 } \\color{${MATH_COLORS.paramSecondary}}{p}`,
    defaultValue: 0.4,
    min: 0.05,
    max: 0.95,
    step: 0.05,
    importance: "core",
  },

  N: {
    key: "N",
    label: "总体容量 N",
    labelFormula: `\\text{总体总量 } \\color{${MATH_COLORS.paramPrimary}}{N}`,
    defaultValue: 12,
    min: 5,
    max: 30,
    step: 1,
    importance: "core",
  },
  M: {
    key: "M",
    label: "特征数 M",
    labelFormula: `\\text{特征数量 } \\color{${MATH_COLORS.paramSecondary}}{M}`,
    defaultValue: 5,
    min: 1,
    max: 30,
    step: 1,
    importance: "core",
  },
  sampleN: {
    key: "sampleN",
    label: "抽取样本数 n",
    labelFormula: `\\text{抽取数量 } \\color{${MATH_COLORS.paramTertiary}}{n}`,
    defaultValue: 4,
    min: 1,
    max: 30,
    step: 1,
    importance: "core",
  },

  linearA: {
    key: "linearA",
    label: "缩放因子 a",
    labelFormula: `\\text{倍数缩放 } \\color{${MATH_COLORS.paramPrimary}}{a}`,
    defaultValue: 2,
    min: -3,
    max: 4,
    step: 0.5,
    importance: "core",
    marks: [
      { value: 0, label: "a=0", labelFormula: "a=0", variant: "critical" },
      { value: 1, label: "a=1", labelFormula: "a=1", variant: "critical" },
    ],
  },
  linearB: {
    key: "linearB",
    label: "平移量 b",
    labelFormula: `\\text{加性平移 } \\color{${MATH_COLORS.paramSecondary}}{b}`,
    defaultValue: 1,
    min: -4,
    max: 5,
    step: 0.5,
    importance: "core",
  },

  compareN: {
    key: "compareN",
    label: "逼近总体容量 N",
    labelFormula: `\\text{逼近总体 } \\color{${MATH_COLORS.paramPrimary}}{N}`,
    defaultValue: 30,
    min: 8,
    max: 200,
    step: 2,
    importance: "core",
  },
  compareP: {
    key: "compareP",
    label: "特征比例 p",
    labelFormula: `\\text{特征比例 } \\color{${MATH_COLORS.paramSecondary}}{p_0}`,
    defaultValue: 0.35,
    min: 0.1,
    max: 0.9,
    step: 0.05,
    importance: "core",
  },
  compareSampleN: {
    key: "compareSampleN",
    label: "抽取样本容量 n",
    labelFormula: `\\text{抽样容量 } \\color{${MATH_COLORS.paramTertiary}}{n}`,
    defaultValue: 4,
    min: 2,
    max: 10,
    step: 1,
    importance: "core",
  },

  decisionParam: {
    key: "decisionParam",
    label: "情境关键概率参数",
    labelFormula: `\\text{关键概率 } \\color{${MATH_COLORS.paramPrimary}}{p}`,
    defaultValue: 0.08,
    min: 0.01,
    max: 0.2,
    step: 0.01,
    importance: "core",
  },

  p1: {
    key: "p1",
    label: "P(X=0)",
    labelFormula: `\\text{概率 } \\color{${MATH_COLORS.paramPrimary}}{P(X=0)}`,
    defaultValue: 0.2,
    min: 0,
    max: 0.8,
    step: 0.05,
    importance: "core",
  },
  p2: {
    key: "p2",
    label: "P(X=1)",
    labelFormula: `\\text{概率 } \\color{${MATH_COLORS.paramSecondary}}{P(X=1)}`,
    defaultValue: 0.4,
    min: 0,
    max: 0.8,
    step: 0.05,
    importance: "core",
  },
  p3: {
    key: "p3",
    label: "P(X=2)",
    labelFormula: `\\text{概率 } \\color{${MATH_COLORS.paramTertiary}}{P(X=2)}`,
    defaultValue: 0.3,
    min: 0,
    max: 0.8,
    step: 0.05,
    importance: "core",
  },
};
