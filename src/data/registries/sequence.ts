/**
 * src/data/registries/sequence.ts
 * 数列实验室声明式参数注册表
 */
import { MATH_COLORS } from "@/theme";
import type { ParamImportance } from "@/data/types";

export interface SequenceParams {
  a1: number;
  d: number;
  q: number;
  N: number;
}

export const defaultParams: SequenceParams = {
  a1: 3,
  d: -1,
  q: 0.5,
  N: 8,
};

export const paramMeta: Record<
  string,
  {
    label: string;
    labelFormula?: string;
    defaultValue: number;
    min: number;
    max: number;
    step: number;
    description: string;
    descriptionFormula?: string;
    importance?: ParamImportance;
    marks?: Array<{ value: number; label: string; labelFormula?: string }>;
  }
> = {
  a1: {
    label: "首项 a₁",
    labelFormula: `\\color{${MATH_COLORS.paramPrimary}}{a_1}`,
    defaultValue: 3,
    min: -5,
    max: 10,
    step: 0.5,
    description: "数列首项值",
    importance: "core",
    marks: [{ value: 0, label: "0", labelFormula: "0" }],
  },
  d: {
    label: "公差 d",
    labelFormula: `\\color{${MATH_COLORS.paramSecondary}}{d}`,
    defaultValue: -1,
    min: -4,
    max: 4,
    step: 0.5,
    description: "等差数列公差 d（对应通项直线斜率与求和抛物线二次项系数）",
    importance: "core",
    marks: [
      {
        value: 0,
        label: "常数列 (d=0)",
        labelFormula: "\\color{#DC2626}{d=0}",
      },
    ],
  },
  q: {
    label: "公比 q",
    labelFormula: `\\color{${MATH_COLORS.paramTertiary}}{q}`,
    defaultValue: 0.5,
    min: -2,
    max: 2,
    step: 0.1,
    description: "等比数列公比 q（决定指数增长、衰减或符号交替震荡）",
    importance: "core",
    marks: [
      { value: -1, label: "-1", labelFormula: "-1" },
      { value: 0, label: "0", labelFormula: "\\color{#DC2626}{q=0}" },
      { value: 0.5, label: "1/2", labelFormula: "1/2" },
      { value: 1, label: "1", labelFormula: "\\color{#DC2626}{q=1}" },
    ],
  },
  N: {
    label: "展示项数 N",
    labelFormula: "N",
    defaultValue: 8,
    min: 3,
    max: 15,
    step: 1,
    description: "数列展现的前 N 项数量",
    descriptionFormula: "可视化前 N 项",
    importance: "advanced",
  },
};
