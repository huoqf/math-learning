import type { ParamMeta } from "../types";
import { MATH_COLORS } from "@/theme";

export interface ParabolaArchimedesParams {
  p: number;
  yQ: number;
  thetaDeg: number;
}

export const defaultParams: ParabolaArchimedesParams = {
  p: 2.0,
  yQ: 1.5,
  thetaDeg: 60.0,
};

export interface ParabolaArchimedesPresetItem {
  key: string;
  label: string;
  params: Partial<ParabolaArchimedesParams>;
}

export const PARABOLA_ARCHIMEDES_PRESETS: Record<
  "archimedesTriangle" | "focalChordProperties" | "orthogonalChords",
  ParabolaArchimedesPresetItem[]
> = {
  archimedesTriangle: [
    {
      key: "free",
      label: "自由探索",
      params: { p: 2.0, yQ: 1.5 },
    },
    {
      key: "min_area",
      label: "通径正交切线(极小)",
      params: { p: 2.0, yQ: 0.0 },
    },
    {
      key: "symmetric_tangent",
      label: "对称正交切线",
      params: { p: 2.0, yQ: 2.0 },
    },
    {
      key: "high_aspect",
      label: "高偏心切点",
      params: { p: 2.0, yQ: 3.5 },
    },
  ],
  focalChordProperties: [
    {
      key: "free",
      label: "自由探索",
      params: { p: 2.0, thetaDeg: 60.0 },
    },
    {
      key: "latus_rectum",
      label: "通径极值(2p)",
      params: { p: 2.0, thetaDeg: 90.0 },
    },
    {
      key: "ratio_3to1",
      label: "3:1分割弦(60°)",
      params: { p: 2.0, thetaDeg: 60.0 },
    },
    {
      key: "chord_45deg",
      label: "45°倾斜弦(4p)",
      params: { p: 2.0, thetaDeg: 45.0 },
    },
  ],
  orthogonalChords: [
    {
      key: "free",
      label: "自由探索",
      params: { p: 2.0, thetaDeg: 45.0 },
    },
    {
      key: "symmetric_45",
      label: "45°对角极小(8p)",
      params: { p: 2.0, thetaDeg: 45.0 },
    },
    {
      key: "skew_30",
      label: "30°/120°双垂直弦",
      params: { p: 2.0, thetaDeg: 30.0 },
    },
    {
      key: "skew_60",
      label: "60°/150°双垂直弦",
      params: { p: 2.0, thetaDeg: 60.0 },
    },
  ],
};

export const paramMeta: Record<string, ParamMeta> = {
  p: {
    key: "p",
    label: "焦准距 p",
    labelFormula: `\\text{焦准距 } \\color{${MATH_COLORS.paramPrimary}}{p}`,
    min: 0.5,
    max: 4.0,
    step: 0.1,
    defaultValue: 2.0,
    importance: "core",
    group: "抛物线母体",
    marks: [
      {
        value: 2.0,
        variant: "recommended",
        label: "标准状态",
        labelFormula: "p = 2",
      },
    ],
  },
  yQ: {
    key: "yQ",
    label: "外点纵标 y_Q",
    labelFormula: `\\text{准线外点 } \\color{${MATH_COLORS.paramSecondary}}{y_Q}`,
    min: -5.0,
    max: 5.0,
    step: 0.1,
    defaultValue: 1.5,
    importance: "core",
    group: "阿基米德切线",
    marks: [
      {
        value: 0.0,
        variant: "critical",
        label: "通径临界",
        labelFormula: "y_Q = 0",
      },
    ],
  },
  thetaDeg: {
    key: "thetaDeg",
    label: "弦倾斜角 θ",
    labelFormula: `\\text{焦点弦倾角 } \\color{${MATH_COLORS.paramSecondary}}{\\theta}`,
    min: 20.0,
    max: 160.0,
    step: 1.0,
    defaultValue: 60.0,
    importance: "core",
    group: "割线旋转",
    marks: [
      {
        value: 90.0,
        variant: "critical",
        label: "通径(垂直)",
        labelFormula: "\\theta = 90^\\circ",
      },
    ],
  },
};
