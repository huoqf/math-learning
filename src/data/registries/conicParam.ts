import type { ParamMeta } from "../types";
import { MATH_COLORS } from "@/theme";

export const defaultParams = {
  a: 4,
  b: 3,
  x0: 1,
  y0: 0.5,
  alpha: 45,
  theta: 45,
  t: 2,
};

export interface ConicParamPreset {
  key: string;
  label: string;
  description: string;
  params: Partial<Record<string, number>>;
}

export const presetsByMode: Record<string, ConicParamPreset[]> = {
  lineParam: [
    {
      key: "free",
      label: "自由探究",
      description: "全参数开放",
      params: {},
    },
    {
      key: "focus_secant",
      label: "过焦点割线",
      description: "P₀置于焦点",
      params: { x0: 2.65, y0: 0, alpha: 60 },
    },
    {
      key: "center_secant",
      label: "对称中心割线",
      description: "过原点最长弦",
      params: { x0: 0, y0: 0, alpha: 45 },
    },
    {
      key: "vertical_line",
      label: "垂直割线",
      description: "α=90°免斜率",
      params: { alpha: 90, x0: 1, y0: 0 },
    },
  ],
  ellipseParam: [
    {
      key: "free",
      label: "自由探究",
      description: "全参数开放",
      params: {},
    },
    {
      key: "vertex_right",
      label: "长轴右顶点",
      description: "θ=0° 极值点",
      params: { theta: 0 },
    },
    {
      key: "vertex_top",
      label: "短轴上顶点",
      description: "θ=90° 极值点",
      params: { theta: 90 },
    },
    {
      key: "diag_45",
      label: "45°经典方位",
      description: "对称第一象限",
      params: { theta: 45 },
    },
  ],
  tSimplify: [
    {
      key: "free",
      label: "自由探究",
      description: "全参数开放",
      params: {},
    },
    {
      key: "focus_chord",
      label: "焦点弦线段积",
      description: "|PA|·|PB|",
      params: { x0: 2.65, y0: 0, alpha: 45 },
    },
    {
      key: "center_chord",
      label: "中点弦 t₁+t₂=0",
      description: "原点为弦中点",
      params: { x0: 0, y0: 0, alpha: 30 },
    },
    {
      key: "tangent_limit",
      label: "相切极限 Δ=0",
      description: "t₁=t₂ 重根",
      params: { x0: 4, y0: 0, alpha: 90 },
    },
  ],
};

export const paramMeta: Record<string, ParamMeta> = {
  alpha: {
    key: "alpha",
    label: "倾斜角 α",
    labelFormula: `\\color{${MATH_COLORS.paramTertiary}}{\\alpha}`,
    defaultValue: 45,
    min: 0,
    max: 180,
    step: 1,
    description: "直线 l 的倾斜角 (0° ~ 180°)",
    descriptionFormula: `\\vec{e} = (\\cos\\color{${MATH_COLORS.paramTertiary}}{\\alpha}, \\sin\\color{${MATH_COLORS.paramTertiary}}{\\alpha})`,
    importance: "core",
    marks: [
      { value: 0, label: "0°", labelFormula: "0^\\circ" },
      { value: 45, label: "45°", labelFormula: "45^\\circ" },
      {
        value: 90,
        label: "90° (垂直)",
        labelFormula: "90^\\circ",
        variant: "critical",
      },
      { value: 135, label: "135°", labelFormula: "135^\\circ" },
      { value: 180, label: "180°", labelFormula: "180^\\circ" },
    ],
  },
  t: {
    key: "t",
    label: "参数 t",
    labelFormula: `\\color{${MATH_COLORS.paramSecondary}}{t}`,
    defaultValue: 2,
    min: -6,
    max: 6,
    step: 0.1,
    description: "动点 P 到定点 P₀ 的有向距离",
    descriptionFormula: `|\\color{${MATH_COLORS.paramSecondary}}{t}| = |P_0 P|, \\vec{P_0 P} = \\color{${MATH_COLORS.paramSecondary}}{t}\\vec{e}`,
    importance: "core",
    marks: [
      { value: 0, label: "P₀ (t=0)", labelFormula: "t=0", variant: "critical" },
    ],
  },
  theta: {
    key: "theta",
    label: "参数角 θ",
    labelFormula: `\\color{${MATH_COLORS.paramTertiary}}{\\theta}`,
    defaultValue: 45,
    min: 0,
    max: 360,
    step: 1,
    description: "椭圆离心圆参数角 θ",
    descriptionFormula: `\\begin{cases} x = a\\cos\\color{${MATH_COLORS.paramTertiary}}{\\theta} \\\\ y = b\\sin\\color{${MATH_COLORS.paramTertiary}}{\\theta} \\end{cases}`,
    importance: "core",
    marks: [
      { value: 0, label: "0°", labelFormula: "0^\\circ" },
      { value: 90, label: "90°", labelFormula: "90^\\circ" },
      { value: 180, label: "180°", labelFormula: "180^\\circ" },
      { value: 270, label: "270°", labelFormula: "270^\\circ" },
    ],
  },
  x0: {
    key: "x0",
    label: "定点横坐标 x₀",
    labelFormula: `\\color{${MATH_COLORS.paramPrimary}}{x_0}`,
    defaultValue: 1,
    min: -5,
    max: 5,
    step: 0.1,
    description: "直线过定点 P₀ 的横坐标",
    importance: "core",
    marks: [
      { value: 0, label: "0", labelFormula: "x_0=0", variant: "critical" },
    ],
  },
  y0: {
    key: "y0",
    label: "定点纵坐标 y₀",
    labelFormula: `\\color{${MATH_COLORS.paramSecondary}}{y_0}`,
    defaultValue: 0.5,
    min: -4,
    max: 4,
    step: 0.1,
    description: "直线过定点 P₀ 的纵坐标",
    importance: "core",
    marks: [
      { value: 0, label: "0", labelFormula: "y_0=0", variant: "critical" },
    ],
  },
  a: {
    key: "a",
    label: "长半轴 a",
    labelFormula: `\\color{${MATH_COLORS.paramPrimary}}{a}`,
    defaultValue: 4,
    min: 1.5,
    max: 6,
    step: 0.1,
    description: "椭圆焦点在 x 轴时的长半轴 a",
    importance: "advanced",
  },
  b: {
    key: "b",
    label: "短半轴 b",
    labelFormula: `\\color{${MATH_COLORS.paramSecondary}}{b}`,
    defaultValue: 3,
    min: 1,
    max: 5,
    step: 0.1,
    description: "椭圆短半轴 b",
    importance: "advanced",
  },
};
