import type { ParamMeta } from "../types";
import { MATH_COLORS } from "@/theme";

export const defaultParams: Record<string, number> = {
  conicTypeIdx: 0, // 0: ellipse, 1: hyperbola, 2: parabola
  studyModeIdx: 0, // 0: general, 1: focus, 2: midpoint, 3: polePolar
  a: 3,
  b: 2,
  p: 2,
  k: 0.5,
  m: 0.5,
  theta: 0.785, // PI/4 ≈ 0.785 (45 deg)
  midpointX: 1,
  midpointY: 1,
  poleX: 4.0,
  poleY: 3.0,
};

export interface ConicLinePreset {
  key: string;
  label: string;
  description: string;
  params: Partial<Record<string, number>>;
}

export const presetsByConicAndMode: Record<
  string,
  Record<string, ConicLinePreset[]>
> = {
  ellipse: {
    general: [
      {
        key: "free",
        label: "自由探究",
        description: "全参数开放",
        params: { a: 3, b: 2, k: 0.5, m: 0.5 },
      },
      {
        key: "tangent",
        label: "临界相切",
        description: "Δ=0 唯一切点",
        params: { k: 0.5, m: 2.5 },
      },
      {
        key: "axis_secant",
        label: "长轴对称弦",
        description: "过原点最长弦 (2a)",
        params: { k: 0, m: 0 },
      },
      {
        key: "minor_secant",
        label: "倾斜正交弦",
        description: "对称正割线",
        params: { k: 1, m: 0 },
      },
    ],
    focus: [
      {
        key: "free",
        label: "自由探究",
        description: "全参数开放",
        params: { a: 3, b: 2, theta: Math.PI / 4 },
      },
      {
        key: "latus_rectum",
        label: "通径极值",
        description: "θ=90° 最短焦点弦",
        params: { theta: Math.PI / 2 },
      },
      {
        key: "inclined_45",
        label: "45°倾斜弦",
        description: "经典倾斜角",
        params: { theta: Math.PI / 4 },
      },
      {
        key: "inclined_60",
        label: "60°倾斜弦",
        description: "特殊角焦点弦",
        params: { theta: Math.PI / 3 },
      },
    ],
    midpoint: [
      {
        key: "free",
        label: "自由探究",
        description: "全参数开放",
        params: { a: 3, b: 2, midpointX: 1, midpointY: 1 },
      },
      {
        key: "quadrant_1",
        label: "第一象限中点",
        description: "M(1, 1) 在内部",
        params: { midpointX: 1, midpointY: 1 },
      },
      {
        key: "axis_midpoint",
        label: "长轴侧中点",
        description: "M(1.5, 0.2)",
        params: { midpointX: 1.5, midpointY: 0.2 },
      },
      {
        key: "steep_midpoint",
        label: "短轴侧中点",
        description: "M(0.5, 1.2)",
        params: { midpointX: 0.5, midpointY: 1.2 },
      },
    ],
    polePolar: [
      {
        key: "free",
        label: "自由探究",
        description: "全参数开放",
        params: { a: 3, b: 2, poleX: 4, poleY: 3 },
      },
      {
        key: "external_4_3",
        label: "经典外部点",
        description: "P(4, 3)",
        params: { poleX: 4, poleY: 3 },
      },
      {
        key: "axis_pole",
        label: "x轴外部极点",
        description: "P(5, 0.5)",
        params: { poleX: 5, poleY: 0.5 },
      },
      {
        key: "diagonal_pole",
        label: "对角极点",
        description: "P(4, 4)",
        params: { poleX: 4, poleY: 4 },
      },
    ],
  },
  hyperbola: {
    general: [
      {
        key: "free",
        label: "自由探究",
        description: "全参数开放",
        params: { a: 3, b: 2, k: 0.2, m: 0 },
      },
      {
        key: "asymptote_parallel",
        label: "渐近线平行",
        description: "降阶一元一次 (仅1交点)",
        params: { k: 0.67, m: 1 },
      },
      {
        key: "double_branch_secant",
        label: "两支割线",
        description: "穿透双支对称弦",
        params: { k: 0.2, m: 0 },
      },
      {
        key: "single_branch_secant",
        label: "单支割线",
        description: "k > b/a 交于右支",
        params: { k: 1.2, m: 1 },
      },
    ],
    focus: [
      {
        key: "free",
        label: "自由探究",
        description: "全参数开放",
        params: { a: 3, b: 2, theta: Math.PI / 3 },
      },
      {
        key: "latus_rectum",
        label: "通径极值",
        description: "θ=90° 最短焦点弦",
        params: { theta: Math.PI / 2 },
      },
      {
        key: "inclined_45",
        label: "45°倾斜弦",
        description: "经典倾斜角",
        params: { theta: Math.PI / 4 },
      },
      {
        key: "inclined_60",
        label: "60°倾斜弦",
        description: "特殊角焦点弦",
        params: { theta: Math.PI / 3 },
      },
    ],
    midpoint: [
      {
        key: "free",
        label: "自由探究",
        description: "全参数开放",
        params: { a: 3, b: 2, midpointX: 1, midpointY: 2 },
      },
      {
        key: "quadrant_1",
        label: "两支弦中点",
        description: "M(1, 2) 存在实弦",
        params: { midpointX: 1, midpointY: 2 },
      },
      {
        key: "axis_midpoint",
        label: "近原点中点",
        description: "M(0.5, 1.5)",
        params: { midpointX: 0.5, midpointY: 1.5 },
      },
      {
        key: "steep_midpoint",
        label: "大斜率中点",
        description: "M(1, 3)",
        params: { midpointX: 1, midpointY: 3 },
      },
    ],
    polePolar: [
      {
        key: "free",
        label: "自由探究",
        description: "全参数开放",
        params: { a: 3, b: 2, poleX: 1, poleY: 2 },
      },
      {
        key: "symmetric_pole",
        label: "虚轴对称极点",
        description: "P(0, 3) 切线对称",
        params: { poleX: 0, poleY: 3 },
      },
      {
        key: "axis_pole",
        label: "两支间极点",
        description: "P(1, 2) 分切两支",
        params: { poleX: 1, poleY: 2 },
      },
      {
        key: "diagonal_pole",
        label: "近渐近线极点",
        description: "P(2, 1)",
        params: { poleX: 2, poleY: 1 },
      },
    ],
  },
  parabola: {
    general: [
      {
        key: "free",
        label: "自由探究",
        description: "全参数开放",
        params: { p: 2, k: 1, m: 0 },
      },
      {
        key: "tangent",
        label: "临界相切",
        description: "Δ=0 唯一切点 (4, 4)",
        params: { k: 0.5, m: 2.0 },
      },
      {
        key: "axis_parallel",
        label: "平行对称轴",
        description: "k=0 降阶仅1交点",
        params: { k: 0, m: 2.0 },
      },
      {
        key: "standard_secant",
        label: "标准割线",
        description: "斜交于上下两支",
        params: { k: 1, m: 1 },
      },
    ],
    focus: [
      {
        key: "free",
        label: "自由探究",
        description: "全参数开放",
        params: { p: 2, theta: Math.PI / 4 },
      },
      {
        key: "latus_rectum",
        label: "通径极值",
        description: "θ=90° 最短弦长 2p",
        params: { theta: Math.PI / 2 },
      },
      {
        key: "inclined_45",
        label: "45°倾斜弦",
        description: "经典倾斜角",
        params: { theta: Math.PI / 4 },
      },
      {
        key: "inclined_60",
        label: "60°倾斜弦",
        description: "特殊角焦点弦",
        params: { theta: Math.PI / 3 },
      },
    ],
    midpoint: [
      {
        key: "free",
        label: "自由探究",
        description: "全参数开放",
        params: { p: 2, midpointX: 2, midpointY: 1 },
      },
      {
        key: "quadrant_1",
        label: "内部弦中点",
        description: "M(2, 1) y₀² < 2px₀",
        params: { midpointX: 2, midpointY: 1 },
      },
      {
        key: "axis_midpoint",
        label: "深部中点",
        description: "M(3, 2)",
        params: { midpointX: 3, midpointY: 2 },
      },
      {
        key: "steep_midpoint",
        label: "开口中点",
        description: "M(1.5, 1)",
        params: { midpointX: 1.5, midpointY: 1 },
      },
    ],
    polePolar: [
      {
        key: "free",
        label: "自由探究",
        description: "全参数开放",
        params: { p: 2, poleX: -1, poleY: 2 },
      },
      {
        key: "axis_pole",
        label: "准线极点 (正交)",
        description: "P(-1, 2) 准线切线垂直",
        params: { poleX: -1, poleY: 2 },
      },
      {
        key: "external_neg_x",
        label: "外部极点",
        description: "P(-2, 2)",
        params: { poleX: -2, poleY: 2 },
      },
      {
        key: "diagonal_pole",
        label: "远端极点",
        description: "P(-1, 3)",
        params: { poleX: -1, poleY: 3 },
      },
    ],
  },
};

export function getConicLinePresets(
  conicType: string = "ellipse",
  studyMode: string = "general",
): ConicLinePreset[] {
  return (
    presetsByConicAndMode[conicType]?.[studyMode] ??
    presetsByConicAndMode.ellipse[studyMode] ??
    []
  );
}

export const presetsByMode: Record<string, ConicLinePreset[]> = {
  general: presetsByConicAndMode.ellipse.general,
  focus: presetsByConicAndMode.ellipse.focus,
  midpoint: presetsByConicAndMode.ellipse.midpoint,
  polePolar: presetsByConicAndMode.ellipse.polePolar,
};

export const paramMeta: Record<string, ParamMeta> = {
  a: {
    key: "a",
    label: "长半轴 a / 实半轴 a",
    labelFormula: `\\color{${MATH_COLORS.paramPrimary}}{a}`,
    defaultValue: 3,
    min: 1,
    max: 5,
    step: 0.1,
    description: "控制椭圆/双曲线的半轴长度",
    descriptionFormula: `\\color{${MATH_COLORS.paramPrimary}}{a} \\in [1, 5]`,
    importance: "core",
  },
  b: {
    key: "b",
    label: "短半轴 b / 虚半轴 b",
    labelFormula: `\\color{${MATH_COLORS.paramSecondary}}{b}`,
    defaultValue: 2,
    min: 0.5,
    max: 4,
    step: 0.1,
    description: "控制椭圆/双曲线的短轴或虚轴",
    descriptionFormula: `\\color{${MATH_COLORS.paramSecondary}}{b} \\in [0.5, 4]`,
    importance: "core",
  },
  p: {
    key: "p",
    label: "抛物线焦准距 p",
    labelFormula: `\\color{${MATH_COLORS.paramPrimary}}{p}`,
    defaultValue: 2,
    min: 0.5,
    max: 4,
    step: 0.1,
    description: "抛物线焦点到准线的距离",
    descriptionFormula: `\\color{${MATH_COLORS.paramPrimary}}{p} > 0`,
    importance: "core",
  },
  k: {
    key: "k",
    label: "直线斜率 k",
    labelFormula: `\\color{${MATH_COLORS.paramSecondary}}{k}`,
    defaultValue: 0.5,
    min: -3,
    max: 3,
    step: 0.05,
    description: "直线 y = kx + m 的斜率",
    descriptionFormula: `\\color{${MATH_COLORS.paramSecondary}}{k} = \\tan \\alpha`,
    importance: "core",
    marks: [
      {
        value: 0,
        label: "0 (水平线)",
        labelFormula: "k=0",
        variant: "critical",
      },
      {
        value: 0.667,
        label: "渐近线斜率 b/a",
        labelFormula: "k=\\frac{b}{a}",
        variant: "critical",
      },
      {
        value: -0.667,
        label: "-b/a",
        labelFormula: "k=-\\frac{b}{a}",
        variant: "critical",
      },
    ],
  },
  m: {
    key: "m",
    label: "直线截距 m",
    labelFormula: `\\color{${MATH_COLORS.paramTertiary}}{m}`,
    defaultValue: 0.5,
    min: -4,
    max: 4,
    step: 0.1,
    description: "直线在 y 轴上的截距",
    descriptionFormula: `y = kx + \\color{${MATH_COLORS.paramTertiary}}{m}`,
    importance: "advanced",
    marks: [
      {
        value: 0,
        label: "0 (过原点)",
        labelFormula: "m=0",
        variant: "critical",
      },
    ],
  },
  theta: {
    key: "theta",
    label: "焦点弦倾斜角 θ",
    labelFormula: `\\color{${MATH_COLORS.paramTertiary}}{\\theta}`,
    defaultValue: 0.785,
    min: 0.1,
    max: 3.04,
    step: 0.02,
    description: "过焦点直线的倾斜角 (弧度)",
    descriptionFormula: `\\color{${MATH_COLORS.paramTertiary}}{\\theta} \\in (0, \\pi)`,
    importance: "core",
    marks: [
      {
        value: 1.571,
        label: "π/2 (通径)",
        labelFormula: "\\theta=\\frac{\\pi}{2}",
        variant: "critical",
      },
    ],
  },
  midpointX: {
    key: "midpointX",
    label: "弦中点 x0",
    labelFormula: `\\color{${MATH_COLORS.paramPrimary}}{x_0}`,
    defaultValue: 1,
    min: -3,
    max: 3,
    step: 0.1,
    description: "目标弦 AB 的中点 X 坐标",
    importance: "core",
  },
  midpointY: {
    key: "midpointY",
    label: "弦中点 y0",
    labelFormula: `\\color{${MATH_COLORS.paramSecondary}}{y_0}`,
    defaultValue: 1,
    min: -3,
    max: 3,
    step: 0.1,
    description: "目标弦 AB 的中点 Y 坐标",
    importance: "core",
  },
  poleX: {
    key: "poleX",
    label: "极点 P x 坐标",
    labelFormula: `\\color{${MATH_COLORS.paramPrimary}}{x_P}`,
    defaultValue: 4.0,
    min: -6,
    max: 6,
    step: 0.1,
    description: "曲线外极点 P 的横坐标",
    importance: "core",
  },
  poleY: {
    key: "poleY",
    label: "极点 P y 坐标",
    labelFormula: `\\color{${MATH_COLORS.paramSecondary}}{y_P}`,
    defaultValue: 3.0,
    min: -5,
    max: 5,
    step: 0.1,
    description: "曲线外极点 P 的纵坐标",
    importance: "core",
  },
};
