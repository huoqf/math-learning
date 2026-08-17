/**
 * src/data/registries/sequence.ts
 * 数列实验室声明式参数注册表
 */
import { MATH_COLORS } from "@/theme";
import type { ParamMeta } from "@/data/types";

export interface SequenceParams {
  a1: number;
  d: number;
  q: number;
  N: number;
  kSegment: number;
  gaussRatio: number;
  sumStep: number;
  teleGap: number;
  p_rec: number;
  q_rec: number;
  r_rec: number;
  stepParam: number;
  a2: number;
  coefA: number;
  coefB: number;
  coefC: number;
}

export const defaultParams: SequenceParams = {
  a1: 1,
  d: -1,
  q: 0.5,
  N: 6,
  kSegment: 3,
  gaussRatio: 1,
  sumStep: 1,
  teleGap: 1,
  p_rec: 2,
  q_rec: 1,
  r_rec: 2,
  stepParam: 2,
  a2: 3,
  coefA: 1,
  coefB: 1,
  coefC: 1,
};

export interface RecurrencePreset {
  key: string;
  name: string;
  desc: string;
  params: Partial<SequenceParams>;
}

export const RECURRENCE_PRESETS: Record<string, RecurrencePreset[]> = {
  "linear-pan": [
    {
      key: "converge",
      name: "收敛衰减型 (|p|<1)",
      desc: "p=0.5, q=1, 不动点 c=2，迭代螺旋收敛",
      params: { a1: 5, p_rec: 0.5, q_rec: 1, N: 6 },
    },
    {
      key: "geometric",
      name: "标准等比待定系数",
      desc: "p=2, q=1, 构造 b_n = a_n + 1 为等比",
      params: { a1: 1, p_rec: 2, q_rec: 1, N: 6 },
    },
    {
      key: "degenerate",
      name: "退化等差型 (p=1)",
      desc: "p=1, q=2, 退化为公差 d=2 的等差数列",
      params: { a1: 1, p_rec: 1, q_rec: 2, N: 6 },
    },
  ],
  "non-homogeneous": [
    {
      key: "resonant",
      name: "同除共振等差 (p=r=2)",
      desc: "a_{n+1}=2a_n+2^n，同除 2^{n+1} 化为等差数列",
      params: { a1: 1, p_rec: 2, q_rec: 1, r_rec: 2, N: 6 },
    },
    {
      key: "non-resonant",
      name: "同除待定等比 (p=2, r=3)",
      desc: "a_{n+1}=2a_n+3^n，同除 3^{n+1} 化为一阶线性",
      params: { a1: 1, p_rec: 2, q_rec: 1, r_rec: 3, N: 6 },
    },
  ],
  accumulation: [
    {
      key: "arithmetic-step",
      name: "等差增量 f(n)=2n",
      desc: "a_{n+1}-a_n=2n，累加得 a_n=n^2-n+1",
      params: { a1: 1, stepParam: 2, N: 6 },
    },
    {
      key: "geometric-step",
      name: "指数增量 f(n)=2ⁿ",
      desc: "a_{n+1}-a_n=2^n，累加等比求和",
      params: { a1: 1, stepParam: 2, N: 6 },
    },
  ],
  multiplication: [
    {
      key: "telescope-mul",
      name: "因式对消 f(n)=n/(n+1)",
      desc: "a_{n+1}/a_n=n/(n+1)，累乘得 a_n=a_1/n",
      params: { a1: 6, N: 6 },
    },
    {
      key: "expand-mul",
      name: "阶乘型 f(n)=(n+1)/n",
      desc: "a_{n+1}/a_n=(n+1)/n，累乘得 a_n=n·a_1",
      params: { a1: 1, N: 6 },
    },
  ],
  reciprocal: [
    {
      key: "harmonic",
      name: "标准倒数等差 (A=C=1)",
      desc: "a_{n+1}=a_n/(a_n+1)，取倒数得 1/a_n=n",
      params: { a1: 1, coefA: 1, coefB: 1, coefC: 1, N: 6 },
    },
    {
      key: "linear-recip",
      name: "倒数一阶线性 (A=2, C=1)",
      desc: "取倒数化归为一阶待定系数等比",
      params: { a1: 1, coefA: 2, coefB: 1, coefC: 1, N: 6 },
    },
  ],
  "second-order": [
    {
      key: "integer-roots",
      name: "整特征根型 (r₁=2, r₂=-1)",
      desc: "a_{n+2}=a_{n+1}+2a_n，特征方程 (x-2)(x+1)=0",
      params: { a1: 1, a2: 3, p_rec: 1, q_rec: 2, N: 6 },
    },
    {
      key: "fibonacci",
      name: "斐波那契模型 (p=1, q=1)",
      desc: "a_{n+2}=a_{n+1}+a_n，黄金分割比 φ≈1.618",
      params: { a1: 1, a2: 1, p_rec: 1, q_rec: 1, N: 6 },
    },
    {
      key: "equal-roots",
      name: "重特征根型 (r₁=r₂=2)",
      desc: "a_{n+2}=4a_{n+1}-4a_n，(x-2)²=0 重根构造",
      params: { a1: 1, a2: 4, p_rec: 4, q_rec: -4, N: 6 },
    },
  ],
};

export const paramMeta: Record<string, ParamMeta> = {
  a1: {
    key: "a1",
    label: "首项 a₁",
    labelFormula: `\\color{${MATH_COLORS.paramPrimary}}{a_1}`,
    defaultValue: 5,
    min: -6,
    max: 8,
    step: 0.5,
    description: "数列首项值（决定数列起点与截距）",
    importance: "core",
    marks: [
      { value: -3, label: "负首项 (-3)", labelFormula: "-3" },
      { value: 0, label: "零首项 (0)", labelFormula: "0" },
      { value: 5, label: "正首项 (5)", labelFormula: "5" },
    ],
  },
  d: {
    key: "d",
    label: "公差 d",
    labelFormula: `\\color{${MATH_COLORS.paramSecondary}}{d}`,
    defaultValue: -1.5,
    min: -3,
    max: 3,
    step: 0.5,
    description: "公差 d（对应一次函数斜率与二次函数二次项系数 d/2）",
    importance: "core",
    marks: [
      {
        value: -1.5,
        label: "递减 (-1.5)",
        labelFormula: "-1.5",
      },
      {
        value: 0,
        label: "常数列 (0)",
        labelFormula: "\\color{#DC2626}{d=0}",
      },
      {
        value: 1,
        label: "递增 (1)",
        labelFormula: "1",
      },
    ],
  },
  q: {
    key: "q",
    label: "公比 q",
    labelFormula: `\\color{${MATH_COLORS.paramSecondary}}{q}`,
    defaultValue: 0.5,
    min: -2,
    max: 2,
    step: 0.1,
    description: "等比数列公比 q（决定数列增长、衰减、常数或震荡形态）",
    importance: "core",
    marks: [
      { value: -1, label: "-1 (周期)", labelFormula: "-1" },
      {
        value: 0,
        label: "0 (退化)",
        labelFormula: "\\color{#DC2626}{q=0}",
        variant: "critical",
      },
      { value: 0.5, label: "0.5 (衰减)", labelFormula: "0.5" },
      {
        value: 1,
        label: "1 (常数)",
        labelFormula: "\\color{#DC2626}{q=1}",
        variant: "critical",
      },
      { value: 1.5, label: "1.5 (激增)", labelFormula: "1.5" },
    ],
  },
  kSegment: {
    key: "kSegment",
    label: "片段项数 k",
    labelFormula: `\\color{${MATH_COLORS.paramTertiary}}{k}`,
    defaultValue: 3,
    min: 2,
    max: 4,
    step: 1,
    description: "等长片段大小 k（展示 S_k, S_2k-S_k, S_3k-S_2k 的等差性）",
    importance: "core",
    marks: [
      { value: 2, label: "k=2", labelFormula: "k=2" },
      { value: 3, label: "k=3", labelFormula: "k=3" },
      { value: 4, label: "k=4", labelFormula: "k=4" },
    ],
  },
  gaussRatio: {
    key: "gaussRatio",
    label: "倒序拼图进度 λ",
    labelFormula: "\\lambda",
    defaultValue: 1,
    min: 0,
    max: 1,
    step: 0.05,
    description: "高斯倒序阶梯图扣合拼接进度（0 为展开，1 为完全扣合成长方形）",
    importance: "core",
    marks: [
      { value: 0, label: "0 (展开)", labelFormula: "0" },
      { value: 0.5, label: "0.5 (对齐)", labelFormula: "0.5" },
      { value: 1, label: "1 (扣合)", labelFormula: "1" },
    ],
  },
  N: {
    key: "N",
    label: "展示项数 N",
    labelFormula: "N",
    defaultValue: 8,
    min: 4,
    max: 12,
    step: 1,
    description: "数列展现的前 N 项项数",
    importance: "advanced",
    marks: [
      { value: 6, label: "N=6", labelFormula: "6" },
      { value: 8, label: "N=8", labelFormula: "8" },
      { value: 10, label: "N=10", labelFormula: "10" },
    ],
  },
  p_rec: {
    key: "p_rec",
    label: "递推系数 p",
    labelFormula: `\\color{${MATH_COLORS.paramPrimary}}{p}`,
    defaultValue: 2,
    min: -3,
    max: 3,
    step: 0.5,
    description: "递推关系式 a_{n+1} = p * a_n + q 中的系数 p",
    descriptionFormula: `a_{n+1} = \\color{${MATH_COLORS.paramPrimary}}{p} a_n + q`,
    importance: "core",
    marks: [
      {
        value: 1,
        label: "等差 (p=1)",
        labelFormula: "\\color{#DC2626}{p=1}",
        variant: "critical",
      },
      { value: -1, label: "-1", labelFormula: "-1" },
      { value: 2, label: "2", labelFormula: "2" },
    ],
  },
  q_rec: {
    key: "q_rec",
    label: "递推常数 q",
    labelFormula: `\\color{${MATH_COLORS.paramSecondary}}{q}`,
    defaultValue: 1,
    min: -5,
    max: 5,
    step: 1,
    description:
      "递推关系式 a_{n+1} = p * a_n + q 中的常数项 q (q=0 时退化为纯等比)",
    descriptionFormula: `a_{n+1} = p a_n + \\color{${MATH_COLORS.paramSecondary}}{q}`,
    importance: "core",
    marks: [
      {
        value: 0,
        label: "纯等比 (q=0)",
        labelFormula: "\\color{#DC2626}{q=0}",
        variant: "critical",
      },
      { value: 1, label: "1", labelFormula: "1" },
    ],
  },
  r_rec: {
    key: "r_rec",
    label: "非齐次指数底数 r",
    labelFormula: `\\color{${MATH_COLORS.paramTertiary}}{r}`,
    defaultValue: 3,
    min: 1,
    max: 5,
    step: 1,
    description: "非齐次项 a_{n+1} = p*a_n + q*r^n 中的指数底数 r",
    descriptionFormula: `a_{n+1} = p a_n + q \\cdot \\color{${MATH_COLORS.paramTertiary}}{r}^n`,
    importance: "core",
    marks: [
      { value: 2, label: "r=2", labelFormula: "2" },
      { value: 3, label: "r=3", labelFormula: "3" },
    ],
  },
  stepParam: {
    key: "stepParam",
    label: "增量参数 d/q",
    labelFormula: `\\color{${MATH_COLORS.paramSecondary}}{\\Delta}`,
    defaultValue: 2,
    min: 1,
    max: 5,
    step: 0.5,
    description: "累加法增量函数 f(n) 的参数（等差步长或等比公比）",
    importance: "core",
    marks: [
      { value: 1, label: "1", labelFormula: "1" },
      { value: 2, label: "2", labelFormula: "2" },
      { value: 3, label: "3", labelFormula: "3" },
    ],
  },
  a2: {
    key: "a2",
    label: "第二项 a₂",
    labelFormula: `\\color{${MATH_COLORS.paramSecondary}}{a_2}`,
    defaultValue: 2,
    min: -5,
    max: 10,
    step: 1,
    description: "二阶递推数列第二项 a_2",
    importance: "core",
  },
  coefA: {
    key: "coefA",
    label: "分子系数 A",
    labelFormula: `\\color{${MATH_COLORS.paramPrimary}}{A}`,
    defaultValue: 2,
    min: 0.5,
    max: 5,
    step: 0.5,
    description: "分式递推 a_{n+1} = A*a_n / (B*a_n + C) 的分子系数 A",
    importance: "core",
  },
  coefB: {
    key: "coefB",
    label: "分母二次项 B",
    labelFormula: `\\color{${MATH_COLORS.paramSecondary}}{B}`,
    defaultValue: 1,
    min: -3,
    max: 3,
    step: 0.5,
    description:
      "分式递推 a_{n+1} = A*a_n / (B*a_n + C) 的分母系数 B (B=0 时退化为纯比例)",
    importance: "core",
    marks: [
      {
        value: 0,
        label: "纯比例 (B=0)",
        labelFormula: "\\color{#DC2626}{B=0}",
        variant: "critical",
      },
    ],
  },
  coefC: {
    key: "coefC",
    label: "分母常数 C",
    labelFormula: `\\color{${MATH_COLORS.paramTertiary}}{C}`,
    defaultValue: 1,
    min: 0.5,
    max: 5,
    step: 0.5,
    description: "分式递推 a_{n+1} = A*a_n / (B*a_n + C) 的分母常数 C",
    importance: "core",
  },
};
