import type { ParamMeta } from "../types";
import { MATH_COLORS } from "@/theme";

export const defaultParams = {
  // 模式 1: 条件概率
  pA: 0.5,
  pB: 0.4,
  pAB: 0.2,

  // 模式 2: 全概率划分
  pA1: 0.4,
  pA2: 0.35,
  pB_A1: 0.6,
  pB_A2: 0.3,
  pB_A3: 0.8,
  pCard: 0.8,
  pReportYes: 0.36,

  // 模式 3: 贝叶斯诊断
  pPriorD: 0.02,
  pSensitivity: 0.95,
  pFalsePositive: 0.05,
} as const;

export const paramMeta: Record<string, ParamMeta> = {
  // ---------------- 条件概率 ----------------
  pA: {
    key: "pA",
    label: "条件事件 A",
    labelFormula: `\\text{条件事件 } \\color{${MATH_COLORS.paramPrimary}}{P(A)}`,
    min: 0.0,
    max: 0.9,
    step: 0.05,
    defaultValue: 0.5,
    importance: "core",
    marks: [
      {
        value: 0,
        variant: "critical",
        label: "退化",
      },
    ],
  },
  pB: {
    key: "pB",
    label: "目标事件 B",
    labelFormula: `\\text{边缘事件 } \\color{${MATH_COLORS.paramSecondary}}{P(B)}`,
    min: 0.1,
    max: 0.9,
    step: 0.05,
    defaultValue: 0.4,
    importance: "core",
  },
  pAB: {
    key: "pAB",
    label: "联合概率",
    labelFormula: `\\text{交集概率 } \\color{${MATH_COLORS.paramTertiary}}{P(AB)}`,
    min: 0.0,
    max: 0.5,
    step: 0.02,
    defaultValue: 0.2,
    importance: "core",
    marks: [
      {
        value: 0,
        variant: "critical",
        label: "互斥",
      },
    ],
  },

  // ---------------- 全概率划分 ----------------
  pA1: {
    key: "pA1",
    label: "划分块 A₁",
    labelFormula: `\\text{划分 } \\color{${MATH_COLORS.paramPrimary}}{P(A_1)}`,
    min: 0.05,
    max: 0.7,
    step: 0.05,
    defaultValue: 0.4,
    importance: "core",
  },
  pA2: {
    key: "pA2",
    label: "划分块 A₂",
    labelFormula: `\\text{划分 } \\color{${MATH_COLORS.paramSecondary}}{P(A_2)}`,
    min: 0.05,
    max: 0.7,
    step: 0.05,
    defaultValue: 0.35,
    importance: "core",
  },
  pB_A1: {
    key: "pB_A1",
    label: "分支条件概率 1",
    labelFormula: `\\text{分支 } \\color{${MATH_COLORS.paramPrimary}}{P(B|A_1)}`,
    min: 0.0,
    max: 1.0,
    step: 0.05,
    defaultValue: 0.6,
    importance: "advanced",
  },
  pB_A2: {
    key: "pB_A2",
    label: "分支条件概率 2",
    labelFormula: `\\text{分支 } \\color{${MATH_COLORS.paramSecondary}}{P(B|A_2)}`,
    min: 0.0,
    max: 1.0,
    step: 0.05,
    defaultValue: 0.3,
    importance: "advanced",
  },
  pB_A3: {
    key: "pB_A3",
    label: "分支条件概率 3",
    labelFormula: `\\text{分支 } \\color{${MATH_COLORS.paramTertiary}}{P(B|A_3)}`,
    min: 0.0,
    max: 1.0,
    step: 0.05,
    defaultValue: 0.8,
    importance: "advanced",
  },
  pCard: {
    key: "pCard",
    label: "正面抽卡概率",
    labelFormula: `\\text{正面卡概率 } \\color{${MATH_COLORS.paramPrimary}}{P(C_1)}`,
    min: 0.1,
    max: 0.9,
    step: 0.05,
    defaultValue: 0.8,
    importance: "core",
    marks: [
      {
        value: 0.5,
        variant: "critical",
        label: "退化",
      },
    ],
  },
  pReportYes: {
    key: "pReportYes",
    label: "统计回答Yes比例",
    labelFormula: `\\text{调查回答率 } \\color{${MATH_COLORS.paramSecondary}}{P(\\text{Yes})}`,
    min: 0.05,
    max: 0.95,
    step: 0.01,
    defaultValue: 0.36,
    importance: "core",
  },

  // ---------------- 贝叶斯诊断 ----------------
  pPriorD: {
    key: "pPriorD",
    label: "先验患病率",
    labelFormula: `\\text{先验基率 } \\color{${MATH_COLORS.paramPrimary}}{P(D)}`,
    min: 0.005,
    max: 0.2,
    step: 0.005,
    defaultValue: 0.02,
    importance: "core",
    marks: [
      {
        value: 0.02,
        variant: "critical",
        label: "2%罕见",
      },
    ],
  },
  pSensitivity: {
    key: "pSensitivity",
    label: "真阳性率",
    labelFormula: `\\text{真阳检出 } \\color{${MATH_COLORS.paramSecondary}}{P(+|D)}`,
    min: 0.7,
    max: 0.999,
    step: 0.01,
    defaultValue: 0.95,
    importance: "advanced",
  },
  pFalsePositive: {
    key: "pFalsePositive",
    label: "假阳性率",
    labelFormula: `\\text{假阳误报 } \\color{${MATH_COLORS.paramTertiary}}{P(+|\\bar{D})}`,
    min: 0.005,
    max: 0.2,
    step: 0.005,
    defaultValue: 0.05,
    importance: "advanced",
  },
};
