import type { ParamMeta } from "../types";

export const defaultParams = {
  A: 1.5,
  omega: 2,
  phi: Math.PI / 3,
  k: 0,
};

export const paramMeta: Record<string, ParamMeta> = {
  A: {
    key: "A",
    label: "振幅 A",
    labelFormula: "A",
    defaultValue: 1.5,
    min: 0.1,
    max: 4,
    step: 0.1,
    description: "控制波峰与波谷高度，纵向伸缩",
    descriptionFormula: "纵向伸缩 A 倍，值域 [k-A, k+A]",
    importance: "core",
    marks: [
      { value: 1, label: "A=1", labelFormula: "A=1" },
      { value: 2, label: "A=2", labelFormula: "A=2" },
    ],
  },
  omega: {
    key: "omega",
    label: "角频率 ω",
    labelFormula: "\\omega",
    defaultValue: 2,
    min: 0.2,
    max: 4,
    step: 0.1,
    description: "控制函数周期 T = 2π/ω，横向伸缩",
    descriptionFormula:
      "决定周期 $T = \\frac{2\\pi}{\\omega}$，横向伸缩 $\\frac{1}{\\omega}$",
    importance: "core",
    marks: [
      { value: 0.5, label: "ω=0.5", labelFormula: "\\omega=0.5" },
      {
        value: 1,
        label: "ω=1 (基准周期)",
        labelFormula: "\\omega=1",
      },
      { value: 2, label: "ω=2", labelFormula: "\\omega=2" },
    ],
  },
  phi: {
    key: "phi",
    label: "初相 φ",
    labelFormula: "\\varphi",
    defaultValue: Math.PI / 3,
    min: -Math.PI,
    max: Math.PI,
    step: Math.PI / 12,
    description: "相位左右平移量",
    descriptionFormula:
      "决定相位平移，先平移移动 $|\\varphi|$，先伸缩移动 $\\frac{|\\varphi|}{\\omega}$",
    importance: "advanced",
    marks: [
      { value: -Math.PI / 2, label: "-π/2", labelFormula: "-\\frac{\\pi}{2}" },
      { value: 0, label: "0", labelFormula: "0" },
      { value: Math.PI / 3, label: "π/3", labelFormula: "\\frac{\\pi}{3}" },
      { value: Math.PI / 2, label: "π/2", labelFormula: "\\frac{\\pi}{2}" },
    ],
  },
  k: {
    key: "k",
    label: "偏置 k",
    labelFormula: "k",
    defaultValue: 0,
    min: -3,
    max: 3,
    step: 0.5,
    description: "平衡位置 y = k 垂直平移",
    descriptionFormula: "平衡位置 $y = k$，沿 y 轴平移",
    importance: "advanced",
    marks: [
      { value: -1, label: "k=-1", labelFormula: "k=-1" },
      { value: 0, label: "k=0", labelFormula: "k=0" },
      { value: 1, label: "k=1", labelFormula: "k=1" },
    ],
  },
};
