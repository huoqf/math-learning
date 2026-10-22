import type { ParamMeta } from "../types";
import { MATH_COLORS } from "@/theme";

export interface InequalityBasicParams {
  a: number;
  b: number;
  k: number;
  /** 不等式性质模式（必修一 2.1）：参与比较的两数 a、b 与同加/同乘的数 c，量程各自独立，允许负数 */
  pA: number;
  pB: number;
  pC: number;
}

export const defaultParams: InequalityBasicParams = {
  a: 4.0,
  b: 2.0,
  k: 4.0,
  // 性质模式默认取「一正一负」，让乘负变向的现象一入场就成立
  pA: 3.0,
  pB: -1.0,
  pC: -2.0,
};

export const paramMeta: Record<string, ParamMeta> = {
  pA: {
    key: "pA",
    label: "参与比较的实数 a",
    labelFormula: `\\color{${MATH_COLORS.paramPrimary}}{a}`,
    defaultValue: 3,
    min: -6,
    max: 6,
    step: 0.5,
    description: "作差比较法中的被减数；允许负值以覆盖完整的实数比较",
    importance: "core",
    group: "作差比较的两数",
  },
  pB: {
    key: "pB",
    label: "参与比较的实数 b",
    labelFormula: `\\color{${MATH_COLORS.paramSecondary}}{b}`,
    defaultValue: -1,
    min: -6,
    max: 6,
    step: 0.5,
    description: "作差比较法中的减数；拖动使 a = b 可观察差为零的临界情形",
    importance: "core",
    group: "作差比较的两数",
  },
  pC: {
    key: "pC",
    label: "同加 / 同乘的数 c",
    labelFormula: `\\color{${MATH_COLORS.paramTertiary}}{c}`,
    defaultValue: -2,
    min: -5,
    max: 5,
    step: 0.5,
    description:
      "同加时不变向；同乘时按 c 的正负决定是否变向，c = 0 退化为等式",
    importance: "core",
    group: "性质验证的算子",
    marks: [
      { value: -2, label: "-2 (乘负变向)", variant: "critical" },
      { value: 0, label: "0 (退化为等式)", variant: "critical" },
      { value: 2, label: "2 (乘正不变)" },
    ],
  },
  a: {
    key: "a",
    label: "正数 a",
    labelFormula: `\\text{正数 }\\color{${MATH_COLORS.paramPrimary}}{a}`,
    defaultValue: 4.0,
    min: 0.1,
    max: 10.0,
    step: 0.1,
    description: "基本不等式中的正数变量 a",
    descriptionFormula: "a > 0",
    importance: "core",
    marks: [
      {
        value: 2.0,
        label: "默认 a=b",
        labelFormula: "a=b",
        variant: "critical",
      },
    ],
  },
  b: {
    key: "b",
    label: "正数 b",
    labelFormula: `\\text{正数 }\\color{${MATH_COLORS.paramSecondary}}{b}`,
    defaultValue: 2.0,
    min: 0.1,
    max: 10.0,
    step: 0.1,
    description: "基本不等式中的正数变量 b",
    descriptionFormula: "b > 0",
    importance: "core",
    marks: [
      {
        value: 4.0,
        label: "默认 a=b",
        labelFormula: "a=b",
        variant: "critical",
      },
    ],
  },
  k: {
    key: "k",
    label: "积定值 k",
    labelFormula: `\\text{积定值 }\\color{${MATH_COLORS.paramTertiary}}{k}`,
    defaultValue: 4.0,
    min: 0.5,
    max: 16.0,
    step: 0.5,
    description: "对勾函数 y = x + k/x 的积定值",
    descriptionFormula: "y = x + \\frac{k}{x}",
    importance: "advanced",
    marks: [
      {
        value: 4.0,
        label: "k=4",
        labelFormula: "k=4",
      },
    ],
  },
};
