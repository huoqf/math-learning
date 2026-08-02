import type { ParamMeta } from "../types";

export const defaultParams = {
  theta: Math.PI / 4, // 0.7854
  A: 1.0,
  omega: 1.0,
  phi: 0.0,
  C: 0.0,
} as const;

export const paramMeta: Record<string, ParamMeta> = {
  theta: {
    key: "theta",
    label: "角 θ (弧度)",
    labelFormula: "\\theta",
    min: -Math.PI / 2 + 0.08,
    max: Math.PI / 2 - 0.08,
    step: 0.02,
    defaultValue: Math.PI / 4,
    importance: "core",
    description: "单位圆终边旋转角，对应正切线 AT = tan θ",
    descriptionFormula: "单位圆终边旋转角 $\\theta$，对应正切线 $AT = \\tan \\theta$",
  },
  A: {
    key: "A",
    label: "振幅/伸缩因子 A",
    labelFormula: "A",
    min: -3.0,
    max: 3.0,
    step: 0.1,
    defaultValue: 1.0,
    importance: "core",
    description: "控制正切曲线在 y 轴方向上的伸缩与翻转",
    marks: [
      {
        value: 0,
        variant: "critical",
        label: "退化为水平线",
        labelFormula: "A = 0",
      },
    ],
  },
  omega: {
    key: "omega",
    label: "周期因子 ω",
    labelFormula: "\\omega",
    min: 0.1,
    max: 3.0,
    step: 0.1,
    defaultValue: 1.0,
    importance: "core",
    description: "决定正切函数的最小正周期 T = π / |ω|",
    descriptionFormula: "决定正切函数的最小正周期 $T = \\frac{\\pi}{|\\omega|}$",
    marks: [
      {
        value: 0,
        variant: "critical",
        label: "无意义/退化",
        labelFormula: "\\omega = 0",
      },
    ],
  },
  phi: {
    key: "phi",
    label: "初相 φ",
    labelFormula: "\\varphi",
    min: -Math.PI,
    max: Math.PI,
    step: Math.PI / 12,
    defaultValue: 0.0,
    importance: "core",
    description: "控制正切曲线沿着 x 轴方向的平移量 -φ/ω",
    descriptionFormula: "控制正切曲线沿着 $x$ 轴方向的平移量 $-\\frac{\\varphi}{\\omega}$",
  },
  C: {
    key: "C",
    label: "垂直平移 C",
    labelFormula: "C",
    min: -3.0,
    max: 3.0,
    step: 0.5,
    defaultValue: 0.0,
    importance: "core",
    description: "控制正切曲线上下平移，对称中心向上平移 C",
  },
};
