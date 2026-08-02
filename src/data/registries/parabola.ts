import type { ParamMeta } from "../types";

export const defaultParams = {
  p: 2.0,
  tP: 2.5,
  thetaDeg: 60.0,
  yQ: 2.0,
} as const;

export const paramMeta: Record<string, ParamMeta> = {
  p: {
    key: "p",
    label: "焦参数 p",
    labelFormula: "\\color{#EF4444}{p}",
    min: 0.5,
    max: 5.0,
    step: 0.1,
    defaultValue: 2.0,
    importance: "core",
    description: "焦点到准线的距离 (p > 0)，决定抛物线的张口大小",
    descriptionFormula:
      "焦点到准线的距离 $\\color{#EF4444}{p} > 0$，决定抛物线张口",
    marks: [
      {
        value: 0.5,
        variant: "critical",
        label: "极窄张口",
        labelFormula: "p = 0.5",
      },
      {
        value: 2.0,
        variant: "recommended",
        label: "标准状态",
        labelFormula: "p = 2",
      },
    ],
  },
  tP: {
    key: "tP",
    label: "动点参数 t_P",
    labelFormula: "\\color{#D97706}{t_P}",
    min: -5.0,
    max: 5.0,
    step: 0.1,
    defaultValue: 2.5,
    importance: "core",
    description: "控制抛物线上动点 P 的坐标位置",
    descriptionFormula: "抛物线上动点 $P$ 沿曲线滑动的自由参数",
  },
  thetaDeg: {
    key: "thetaDeg",
    label: "焦点弦倾斜角 θ",
    labelFormula: "\\color{#D97706}{\\theta}",
    min: 15.0,
    max: 165.0,
    step: 1.0,
    defaultValue: 60.0,
    importance: "core",
    description: "过焦点 F 的焦点弦与对称轴的正向夹角",
    descriptionFormula: "焦点弦 $AB$ 绕焦点 $F$ 旋转的倾斜角 $\\theta$",
    marks: [
      {
        value: 90.0,
        variant: "recommended",
        label: "通径(垂直)",
        labelFormula: "\\theta = 90^\\circ",
      },
    ],
  },
  yQ: {
    key: "yQ",
    label: "准线点坐标 y_Q",
    labelFormula: "\\color{#059669}{y_Q}",
    min: -5.0,
    max: 5.0,
    step: 0.1,
    defaultValue: 2.0,
    importance: "core",
    description: "准线上动点 Q 的垂直坐标，引两条互相垂直的切线",
    descriptionFormula: "准线上点 $Q$ 的位置，引抛物线垂直切线对",
  },
};
