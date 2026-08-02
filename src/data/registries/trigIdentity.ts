import type { ParamMeta } from "../types";

export const defaultParams = {
  alphaDeg: 30,
  homoA: 1.0,
  homoB: 1.0,
} as const;

export const paramMeta: Record<string, ParamMeta> = {
  alphaDeg: {
    key: "alphaDeg",
    label: "任意角 α (°)",
    labelFormula: "\\alpha",
    min: -360,
    max: 360,
    step: 1,
    defaultValue: 30,
    importance: "core",
    description: "单位圆上的动角 α，决定点 P(cos α, sin α) 的位置",
    descriptionFormula:
      "单位圆上的动角 $\\alpha$，决定点 $P(\\cos\\alpha, \\sin\\alpha)$ 的位置",
    marks: [
      {
        value: -180,
        variant: "zero",
        label: "-180°",
        labelFormula: "-180^\\circ",
      },
      {
        value: 0,
        variant: "zero",
        label: "0°",
        labelFormula: "0^\\circ",
      },
      {
        value: 180,
        variant: "zero",
        label: "180°",
        labelFormula: "180^\\circ",
      },
    ],
  },
  homoA: {
    key: "homoA",
    label: "系数 A",
    labelFormula: "A",
    min: -3.0,
    max: 3.0,
    step: 0.5,
    defaultValue: 1.0,
    importance: "advanced",
    description: "高考齐次式化切或知一求二中的组合系数 A",
    descriptionFormula:
      "高考齐次式 $\\frac{A\\sin\\alpha + B\\cos\\alpha}{\\sin\\alpha - \\cos\\alpha}$ 中的系数 $A$",
  },
  homoB: {
    key: "homoB",
    label: "系数 B",
    labelFormula: "B",
    min: -3.0,
    max: 3.0,
    step: 0.5,
    defaultValue: 1.0,
    importance: "advanced",
    description: "高考齐次式化切或知一求二中的组合系数 B",
    descriptionFormula:
      "高考齐次式 $\\frac{A\\sin\\alpha + B\\cos\\alpha}{\\sin\\alpha - \\cos\\alpha}$ 中的系数 $B$",
  },
};
