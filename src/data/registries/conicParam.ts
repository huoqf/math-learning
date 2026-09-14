import type { ParamMeta } from "../types";
import { MATH_COLORS } from "@/theme";

export const defaultParams = {
  // 椭圆模式基础参数
  a: 4,
  b: 3,
  theta: 45,
  // 抛物线纵坐标单参数模型
  p: 2,
  y1: 3,
  y2: -1.5,
  // 设线降维 x = my + n 模型
  m: 0.8,
  n: 1,
};

export interface ConicParamPreset {
  key: string;
  label: string;
  description: string;
  params: Partial<Record<string, number>>;
}

export const presetsByMode: Record<string, ConicParamPreset[]> = {
  ellipseTrig: [
    {
      key: "free",
      label: "自由探究",
      description: "全参数开放探索",
      params: {},
    },
    {
      key: "diag_45",
      label: "45° 切线极值",
      description: "截距面积最小",
      params: { theta: 45 },
    },
    {
      key: "vertex_right",
      label: "长轴端点",
      description: "θ=0° 坐标极值",
      params: { theta: 0 },
    },
    {
      key: "vertex_top",
      label: "短轴端点",
      description: "θ=90° 坐标极值",
      params: { theta: 90 },
    },
  ],
  parabolaYParam: [
    {
      key: "free",
      label: "自由探究",
      description: "全参数开放探索",
      params: {},
    },
    {
      key: "focus_chord",
      label: "过焦点弦",
      description: "y₁y₂ = -p² 定值",
      params: { p: 2, y1: 4, y2: -1 },
    },
    {
      key: "perp_latus",
      label: "垂直通径",
      description: "y₁=-y₂=p 弦长2p",
      params: { p: 2, y1: 2, y2: -2 },
    },
    {
      key: "midpoint_axis",
      label: "轴对称中点",
      description: "y₁+y₂=0 割线垂直",
      params: { p: 2, y1: 3, y2: -3 },
    },
  ],
  lineYForm: [
    {
      key: "free",
      label: "自由探究",
      description: "全参数开放探索",
      params: {},
    },
    {
      key: "vertical_secant",
      label: "铅垂割线",
      description: "m=0 免分类讨论",
      params: { m: 0, n: 1 },
    },
    {
      key: "center_chord",
      label: "对称中心弦",
      description: "n=0 原点平分弦",
      params: { m: 1, n: 0 },
    },
    {
      key: "tangent_limit",
      label: "相切临界",
      description: "Δ=0 重根边界",
      params: { m: 1, n: 5 },
    },
  ],
};

export const paramMeta: Record<string, ParamMeta> = {
  theta: {
    key: "theta",
    label: "离心角 θ",
    labelFormula: `\\color{${MATH_COLORS.paramTertiary}}{\\theta}`,
    defaultValue: 45,
    min: 0,
    max: 360,
    step: 1,
    description: "椭圆参数动点的离心角",
    descriptionFormula: `P(a\\cos\\color{${MATH_COLORS.paramTertiary}}{\\theta}, b\\sin\\color{${MATH_COLORS.paramTertiary}}{\\theta})`,
    importance: "core",
    marks: [
      { value: 0, label: "0°", labelFormula: "0^\\circ" },
      { value: 45, label: "45°", labelFormula: "45^\\circ" },
      { value: 90, label: "90°", labelFormula: "90^\\circ" },
      { value: 180, label: "180°", labelFormula: "180^\\circ" },
    ],
  },
  a: {
    key: "a",
    label: "长半轴 a",
    labelFormula: `\\color{${MATH_COLORS.paramPrimary}}{a}`,
    defaultValue: 4,
    min: 2,
    max: 6,
    step: 0.1,
    description: "椭圆焦点在 x 轴时的长半轴",
    importance: "advanced",
  },
  b: {
    key: "b",
    label: "短半轴 b",
    labelFormula: `\\color{${MATH_COLORS.paramSecondary}}{b}`,
    defaultValue: 3,
    min: 1.2,
    max: 5,
    step: 0.1,
    description: "椭圆短半轴",
    importance: "advanced",
  },
  p: {
    key: "p",
    label: "焦准距 p",
    labelFormula: `\\color{${MATH_COLORS.paramPrimary}}{p}`,
    defaultValue: 2,
    min: 1,
    max: 4,
    step: 0.2,
    description: "抛物线方程 y² = 2px 的参数",
    importance: "core",
    marks: [
      { value: 2, label: "p=2", labelFormula: "p=2", variant: "critical" },
    ],
  },
  y1: {
    key: "y1",
    label: "动点 A 纵坐标 y₁",
    labelFormula: `\\color{${MATH_COLORS.paramSecondary}}{y_1}`,
    defaultValue: 3,
    min: -5,
    max: 5,
    step: 0.1,
    description: "抛物线上动点 A 的单个参数",
    descriptionFormula: `A\\left(\\frac{\\color{${MATH_COLORS.paramSecondary}}{y_1}^2}{2p}, \\color{${MATH_COLORS.paramSecondary}}{y_1}\\right)`,
    importance: "core",
  },
  y2: {
    key: "y2",
    label: "动点 B 纵坐标 y₂",
    labelFormula: `\\color{${MATH_COLORS.paramTertiary}}{y_2}`,
    defaultValue: -1.5,
    min: -5,
    max: 5,
    step: 0.1,
    description: "抛物线上动点 B 的单个参数",
    descriptionFormula: `B\\left(\\frac{\\color{${MATH_COLORS.paramTertiary}}{y_2}^2}{2p}, \\color{${MATH_COLORS.paramTertiary}}{y_2}\\right)`,
    importance: "core",
  },
  m: {
    key: "m",
    label: "斜率倒数 m",
    labelFormula: `\\color{${MATH_COLORS.paramSecondary}}{m}`,
    defaultValue: 0.8,
    min: -3,
    max: 3,
    step: 0.1,
    description: "割线方程 x = my + n 的斜率倒数参数",
    importance: "core",
    marks: [
      {
        value: 0,
        label: "m=0 (铅垂)",
        labelFormula: "m=0",
        variant: "critical",
      },
    ],
  },
  n: {
    key: "n",
    label: "横截距 n",
    labelFormula: `\\color{${MATH_COLORS.paramPrimary}}{n}`,
    defaultValue: 1,
    min: -5,
    max: 5,
    step: 0.1,
    description: "割线与 x 轴交点横坐标",
    importance: "core",
    marks: [
      {
        value: 0,
        label: "n=0 (过原点)",
        labelFormula: "n=0",
        variant: "critical",
      },
    ],
  },
};
