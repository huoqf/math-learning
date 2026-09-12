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
      description: "全参数开放探索",
      params: { p: 2.0, tP: 2.0 },
    },
    {
      key: "latus_endpoint",
      label: "通径端点",
      description: "焦半径恰等于p",
      params: { p: 2.0, tP: 2.0 },
    },
    {
      key: "vertex_near",
      label: "逼近顶点",
      description: "焦半径趋近半距",
      params: { p: 2.0, tP: 0.2 },
    },
    {
      key: "wide_aperture",
      label: "张口增大",
      description: "考察大张口形态",
      params: { p: 4.0, tP: 3.5 },
    },
  ],
  focalChord: [
    {
      key: "free",
      label: "自由探究",
      description: "全参数开放探索",
      params: { p: 2.0, thetaDeg: 60.0 },
    },
    {
      key: "latus_rectum",
      label: "垂直通径",
      description: "取得极小弦长2p",
      params: { p: 2.0, thetaDeg: 90.0 },
    },
    {
      key: "chord_45deg",
      label: "45°倾斜弦",
      description: "弦长扩大至4p",
      params: { p: 2.0, thetaDeg: 45.0 },
    },
    {
      key: "chord_135deg",
      label: "135°对称弦",
      description: "关于对称轴等长",
      params: { p: 2.0, thetaDeg: 135.0 },
    },
  ],
  tangentOptical: [
    {
      key: "free",
      label: "自由探究",
      description: "全参数开放探索",
      params: { p: 2.0, tP: 2.0, yQ: 2.0 },
    },
    {
      key: "monge_symmetric",
      label: "通径切线",
      description: "准轴交点引对称双切",
      params: { p: 2.0, tP: 2.0, yQ: 0.0 },
    },
    {
      key: "latus_tangent",
      label: "动点光路",
      description: "平行轴向反射聚焦",
      params: { p: 2.0, tP: 2.0, yQ: 2.0 },
    },
    {
      key: "high_aspect",
      label: "大偏位切线",
      description: "准线大偏位切点弦",
      params: { p: 2.0, tP: 3.5, yQ: 4.0 },
    },
  ],
};

export const paramMeta: Record<string, ParamMeta> = {
  p: {
    key: "p",
    label: "焦准距 p",
    labelFormula: `\\text{焦准距 } \\color{${MATH_COLORS.paramPrimary}}{p}`,
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
    labelFormula: `\\text{动点位置 } \\color{${MATH_COLORS.paramSecondary}}{t_P}`,
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
    label: "焦点弦夹角 θ",
    labelFormula: `\\text{对称轴夹角 } \\color{${MATH_COLORS.paramSecondary}}{\\theta}`,
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
        label: "垂直通径",
        labelFormula: "\\theta = 90^\\circ",
      },
    ],
  },
  yQ: {
    key: "yQ",
    label: "准线点参数 y_Q",
    labelFormula: `\\text{准线点位置 } \\color{${MATH_COLORS.paramTertiary}}{y_Q}`,
    min: -5.0,
    max: 5.0,
    step: 0.1,
    defaultValue: 2.0,
    importance: "core",
    description: "准线上动点 Q 的垂直坐标，引两条互相垂直的切线",
    descriptionFormula: `准线上点 $Q$ 的位置，引抛物线垂直切线对`,
  },
};
