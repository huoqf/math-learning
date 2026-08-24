import type { ParamMeta } from "../types";
import { MATH_COLORS } from "@/theme";

export interface ParabolaParams {
  p: number;
  tP: number;
  thetaDeg: number;
  yQ: number;
}

export const defaultParams: ParabolaParams = {
  p: 2.0,
  tP: 2.0,
  thetaDeg: 60.0,
  yQ: 2.0,
};

export interface ParabolaPresetItem {
  key: string;
  label: string;
  description: string;
  params: Partial<ParabolaParams>;
}

export const PARABOLA_PRESETS: Record<
  "definition" | "focalChord" | "tangentOptical",
  ParabolaPresetItem[]
> = {
  definition: [
    {
      key: "free",
      label: "自由探究",
      description: "全参数开放",
      params: { p: 2.0, tP: 2.0 },
    },
    {
      key: "latus_endpoint",
      label: "通径端点",
      description: "焦半径为p",
      params: { p: 2.0, tP: 2.0 },
    },
    {
      key: "vertex_near",
      label: "逼近顶点",
      description: "焦半径p/2",
      params: { p: 2.0, tP: 0.2 },
    },
    {
      key: "wide_aperture",
      label: "大张口型",
      description: "p=4.0态",
      params: { p: 4.0, tP: 3.5 },
    },
  ],
  focalChord: [
    {
      key: "free",
      label: "自由探究",
      description: "全参数开放",
      params: { p: 2.0, thetaDeg: 60.0 },
    },
    {
      key: "latus_rectum",
      label: "垂直通径",
      description: "最小弦长2p",
      params: { p: 2.0, thetaDeg: 90.0 },
    },
    {
      key: "chord_45deg",
      label: "45°倾斜弦",
      description: "弦长4p倍数",
      params: { p: 2.0, thetaDeg: 45.0 },
    },
    {
      key: "chord_135deg",
      label: "135°对称弦",
      description: "与45°等长",
      params: { p: 2.0, thetaDeg: 135.0 },
    },
  ],
  tangentOptical: [
    {
      key: "free",
      label: "自由探究",
      description: "全参数开放",
      params: { p: 2.0, tP: 2.0, yQ: 2.0 },
    },
    {
      key: "monge_symmetric",
      label: "对称切线",
      description: "yQ=0准轴交",
      params: { p: 2.0, tP: 2.0, yQ: 0.0 },
    },
    {
      key: "latus_tangent",
      label: "通径处切线",
      description: "倾角45度",
      params: { p: 2.0, tP: 2.0, yQ: 2.0 },
    },
    {
      key: "high_aspect",
      label: "大高差切点",
      description: "切点弦平缓",
      params: { p: 2.0, tP: 3.5, yQ: 4.0 },
    },
  ],
};

export const paramMeta: Record<string, ParamMeta> = {
  p: {
    key: "p",
    label: "焦参数 p",
    labelFormula: `\\color{${MATH_COLORS.paramPrimary}}{p}`,
    min: 0.5,
    max: 5.0,
    step: 0.1,
    defaultValue: 2.0,
    importance: "core",
    description: "焦点到准线的距离 (p > 0)，决定抛物线的张口大小",
    descriptionFormula: `焦点到准线的距离 $\\color{${MATH_COLORS.paramPrimary}}{p} > 0$，决定抛物线张口`,
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
    labelFormula: `\\color{${MATH_COLORS.paramSecondary}}{t_P}`,
    min: -5.0,
    max: 5.0,
    step: 0.1,
    defaultValue: 2.0,
    importance: "core",
    description: "控制抛物线上动点 P 的坐标位置",
    descriptionFormula: `抛物线上动点 $P$ 沿曲线滑动的自由参数`,
  },
  thetaDeg: {
    key: "thetaDeg",
    label: "焦点弦倾斜角 θ",
    labelFormula: `\\color{${MATH_COLORS.paramSecondary}}{\\theta}`,
    min: 15.0,
    max: 165.0,
    step: 1.0,
    defaultValue: 60.0,
    importance: "core",
    description: "过焦点 F 的焦点弦与对称轴的正向夹角",
    descriptionFormula: `焦点弦 $AB$ 绕焦点 $F$ 旋转的倾斜角 $\\theta$`,
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
    labelFormula: `\\color{${MATH_COLORS.paramTertiary}}{y_Q}`,
    min: -5.0,
    max: 5.0,
    step: 0.1,
    defaultValue: 2.0,
    importance: "core",
    description: "准线上动点 Q 的垂直坐标，引两条互相垂直的切线",
    descriptionFormula: `准线上点 $Q$ 的位置，引抛物线垂直切线对`,
  },
};
