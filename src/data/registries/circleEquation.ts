import { MATH_COLORS } from "@/theme";
import type { ParamMeta } from "../types";

export interface CircleEquationParams {
  // 模式 1: standard (标准方程与点圆关系)
  a: number; // 圆心 x
  b: number; // 圆心 y
  r: number; // 半径
  px: number; // 探究点 P x
  py: number; // 探究点 P y

  // 模式 2: general (一般方程与配方互化)
  D: number;
  E: number;
  F: number;

  // 模式 3: threePoints (待定系数法求圆)
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  x3: number;
  y3: number;
}

export const circleEquationDefaultParams: CircleEquationParams = {
  a: 0.0,
  b: 0.0,
  r: 3.0,
  px: 4.0,
  py: 3.0,

  D: -4.0,
  E: 6.0,
  F: -3.0,

  x1: 2.0,
  y1: 1.0,
  x2: -2.0,
  y2: 3.0,
  x3: 0.0,
  y3: -3.0,
};

export const circleEquationParamMeta: Record<string, ParamMeta> = {
  a: {
    key: "a",
    label: "圆心横坐标 $a$",
    labelFormula: `\\text{圆心 } \\color{${MATH_COLORS.paramPrimary}}{a}`,
    min: -5.0,
    max: 5.0,
    step: 0.5,
    defaultValue: 0.0,
    importance: "core",
    group: "圆心位置",
  },
  b: {
    key: "b",
    label: "圆心纵坐标 $b$",
    labelFormula: `\\text{圆心 } \\color{${MATH_COLORS.paramSecondary}}{b}`,
    min: -5.0,
    max: 5.0,
    step: 0.5,
    defaultValue: 0.0,
    importance: "core",
    group: "圆心位置",
  },
  r: {
    key: "r",
    label: "圆半径 $r$",
    labelFormula: `\\text{半径 } \\color{${MATH_COLORS.paramTertiary}}{r}`,
    min: 0.5,
    max: 5.0,
    step: 0.5,
    defaultValue: 3.0,
    importance: "core",
    group: "半径尺度",
  },
  px: {
    key: "px",
    label: "探究点横坐标 $x_P$",
    labelFormula: `\\text{点 } P \\text{ 横坐标 } \\color{${MATH_COLORS.paramSecondary}}{x_P}`,
    min: -6.0,
    max: 6.0,
    step: 0.5,
    defaultValue: 4.0,
    importance: "display",
    group: "动点探索",
  },
  py: {
    key: "py",
    label: "探究点纵坐标 $y_P$",
    labelFormula: `\\text{点 } P \\text{ 纵坐标 } \\color{${MATH_COLORS.paramSecondary}}{y_P}`,
    min: -6.0,
    max: 6.0,
    step: 0.5,
    defaultValue: 3.0,
    importance: "display",
    group: "动点探索",
  },

  D: {
    key: "D",
    label: "一次项系数 $D$",
    labelFormula: `\\text{系数 } \\color{${MATH_COLORS.paramPrimary}}{D}`,
    min: -8.0,
    max: 8.0,
    step: 1.0,
    defaultValue: -4.0,
    importance: "core",
    group: "一般式系数",
  },
  E: {
    key: "E",
    label: "一次项系数 $E$",
    labelFormula: `\\text{系数 } \\color{${MATH_COLORS.paramSecondary}}{E}`,
    min: -8.0,
    max: 8.0,
    step: 1.0,
    defaultValue: 6.0,
    importance: "core",
    group: "一般式系数",
  },
  F: {
    key: "F",
    label: "常数项 $F$",
    labelFormula: `\\text{常数项 } \\color{${MATH_COLORS.paramTertiary}}{F}`,
    min: -20.0,
    max: 25.0,
    step: 1.0,
    defaultValue: -3.0,
    importance: "core",
    group: "一般式系数",
  },

  x1: {
    key: "x1",
    label: "顶点 $A$ 横坐标 $x_1$",
    labelFormula: `\\text{点 } A \\text{ 横坐标 } \\color{${MATH_COLORS.paramPrimary}}{x_1}`,
    min: -5.0,
    max: 5.0,
    step: 0.5,
    defaultValue: 2.0,
    importance: "core",
    group: "三角形顶点",
  },
  y1: {
    key: "y1",
    label: "顶点 $A$ 纵坐标 $y_1$",
    labelFormula: `\\text{点 } A \\text{ 纵坐标 } \\color{${MATH_COLORS.paramPrimary}}{y_1}`,
    min: -5.0,
    max: 5.0,
    step: 0.5,
    defaultValue: 1.0,
    importance: "core",
    group: "三角形顶点",
  },
  x2: {
    key: "x2",
    label: "顶点 $B$ 横坐标 $x_2$",
    labelFormula: `\\text{点 } B \\text{ 横坐标 } \\color{${MATH_COLORS.paramSecondary}}{x_2}`,
    min: -5.0,
    max: 5.0,
    step: 0.5,
    defaultValue: -2.0,
    importance: "core",
    group: "三角形顶点",
  },
  y2: {
    key: "y2",
    label: "顶点 $B$ 纵坐标 $y_2$",
    labelFormula: `\\text{点 } B \\text{ 纵坐标 } \\color{${MATH_COLORS.paramSecondary}}{y_2}`,
    min: -5.0,
    max: 5.0,
    step: 0.5,
    defaultValue: 3.0,
    importance: "core",
    group: "三角形顶点",
  },
  x3: {
    key: "x3",
    label: "顶点 $C$ 横坐标 $x_3$",
    labelFormula: `\\text{点 } C \\text{ 横坐标 } \\color{${MATH_COLORS.paramTertiary}}{x_3}`,
    min: -5.0,
    max: 5.0,
    step: 0.5,
    defaultValue: 0.0,
    importance: "core",
    group: "三角形顶点",
  },
  y3: {
    key: "y3",
    label: "顶点 $C$ 纵坐标 $y_3$",
    labelFormula: `\\text{点 } C \\text{ 纵坐标 } \\color{${MATH_COLORS.paramTertiary}}{y_3}`,
    min: -5.0,
    max: 5.0,
    step: 0.5,
    defaultValue: -3.0,
    importance: "core",
    group: "三角形顶点",
  },
};

export interface CircleEquationPresetItem {
  key: string;
  label: string;
  params: Partial<CircleEquationParams>;
}

export const CIRCLE_EQUATION_PRESETS: Record<
  "standard" | "general" | "threePoints",
  CircleEquationPresetItem[]
> = {
  standard: [
    {
      key: "standard_origin",
      label: "原点对称圆",
      params: { a: 0.0, b: 0.0, r: 3.0, px: 3.0, py: 0.0 },
    },
    {
      key: "point_inside",
      label: "点在圆内典型",
      params: { a: 1.0, b: 1.0, r: 3.0, px: 2.0, py: 2.0 },
    },
    {
      key: "point_on",
      label: "勾股点在圆上",
      params: { a: 0.0, b: 0.0, r: 5.0, px: 3.0, py: 4.0 },
    },
    {
      key: "point_outside",
      label: "点在圆外典型",
      params: { a: -1.0, b: 2.0, r: 2.5, px: 4.0, py: 3.0 },
    },
  ],
  general: [
    {
      key: "general_real_circle",
      label: "典型实圆(Δ>0)",
      params: { D: -4.0, E: 6.0, F: -3.0 },
    },
    {
      key: "general_unit_circle",
      label: "标准单位圆",
      params: { D: 0.0, E: 0.0, F: -1.0 },
    },
    {
      key: "general_point",
      label: "退化为单点(Δ=0)",
      params: { D: 4.0, E: -6.0, F: 13.0 },
    },
    {
      key: "general_no_graph",
      label: "无实数轨迹(Δ<0)",
      params: { D: 2.0, E: 2.0, F: 10.0 },
    },
    // 分数系数预设（2026-10-01 补）：教材「一般方程配方」题型的真实难点是系数为分数时
    // 的通分与配方。滑块 step=1 无法手调出分数，故以定值预设直接给到。
    // 右屏 D/E/F、判别式、圆心、半径的显示已切到「分数优先」（formatMathRationalOrNumber），
    // 因此这里印出的是 \frac{2}{3} 而非 0.67。
    {
      // x² + y² + (2/3)x − (4/3)y + 1/9 = 0 ⇒ Δ_c = 16/9，圆心 (−1/3, 2/3)，r = 2/3
      key: "general_frac_coeff",
      label: "分数系数·配方典型",
      params: { D: 2 / 3, E: -4 / 3, F: 1 / 9 },
    },
    {
      // x² + y² − (4/3)x + (2/3)y − 4/9 = 0 ⇒ Δ_c = 4，圆心 (2/3, −1/3)，r = 1
      key: "general_frac_integer_radius",
      label: "分数系数·整半径",
      params: { D: -4 / 3, E: 2 / 3, F: -4 / 9 },
    },
  ],
  threePoints: [
    {
      key: "three_unit",
      label: "单位圆三点",
      params: { x1: 1.0, y1: 0.0, x2: 0.0, y2: 1.0, x3: -1.0, y3: 0.0 },
    },
    {
      key: "three_rt_triangle",
      label: "直角三角形外接圆",
      params: { x1: -3.0, y1: 0.0, x2: 3.0, y2: 0.0, x3: 0.0, y3: 3.0 },
    },
    {
      key: "three_general",
      label: "高考真题一般三点",
      params: { x1: 2.0, y1: 2.0, x2: 5.0, y2: 3.0, x3: 3.0, y3: -1.0 },
    },
  ],
};
