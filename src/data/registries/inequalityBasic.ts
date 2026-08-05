import type { ParamMeta } from "../types";

export interface InequalityBasicParams {
  a: number;
  b: number;
  k: number;
}

export const defaultParams: InequalityBasicParams = {
  a: 4.0,
  b: 2.0,
  k: 4.0,
};

export const paramMeta: Record<string, ParamMeta> = {
  a: {
    key: "a",
    label: "正数 a",
    labelFormula: "a",
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
        label: "a=b (取等)",
        labelFormula: "a=b",
        variant: "critical",
      },
    ],
  },
  b: {
    key: "b",
    label: "正数 b",
    labelFormula: "b",
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
        label: "a=b (取等)",
        labelFormula: "a=b",
        variant: "critical",
      },
    ],
  },
  k: {
    key: "k",
    label: "积定值 k",
    labelFormula: "k",
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
