import type { ParamMeta } from "../types";
import { MATH_COLORS } from "@/theme";

export const defaultParams: Record<string, number> = {
  x0: 1.5,
  x1: -1.0,
  x2: 2.0,
  axisA: 0.0,
  axisB: 2.0,
  centerX: 0.0,
  centerY: 0.0,
};

export const paramMeta: Record<string, ParamMeta> = {
  x0: {
    key: "x0",
    label: "主测试点 x0",
    labelFormula: `\\text{测试点 } \\color{${MATH_COLORS.paramPrimary}}{x_0}`,
    min: -4.0,
    max: 4.0,
    step: 0.1,
    defaultValue: 1.5,
    importance: "core",
    marks: [
      { value: 0, variant: "critical", label: "原点", labelFormula: "x_0 = 0" },
    ],
  },
  x1: {
    key: "x1",
    label: "割线端点 x1",
    labelFormula: `\\text{割线端点 } \\color{${MATH_COLORS.paramSecondary}}{x_1}`,
    min: -4.0,
    max: 4.0,
    step: 0.1,
    defaultValue: -1.0,
    importance: "core",
    marks: [
      { value: 0, variant: "critical", label: "原点", labelFormula: "x_1 = 0" },
    ],
  },
  x2: {
    key: "x2",
    label: "割线端点 x2",
    labelFormula: `\\text{割线端点 } \\color{${MATH_COLORS.paramTertiary}}{x_2}`,
    min: -4.0,
    max: 4.0,
    step: 0.1,
    defaultValue: 2.0,
    importance: "core",
    marks: [
      { value: 0, variant: "critical", label: "原点", labelFormula: "x_2 = 0" },
    ],
  },
  axisA: {
    key: "axisA",
    label: "第一对称特征 a",
    labelFormula: `\\text{对称特征一 } \\color{${MATH_COLORS.paramPrimary}}{a}`,
    min: -3.0,
    max: 3.0,
    step: 0.1,
    defaultValue: 0.0,
    importance: "core",
    marks: [
      { value: 0, variant: "critical", label: "y轴", labelFormula: "a = 0" },
    ],
  },
  axisB: {
    key: "axisB",
    label: "第二对称特征 b",
    labelFormula: `\\text{对称特征二 } \\color{${MATH_COLORS.paramSecondary}}{b}`,
    min: -3.0,
    max: 3.0,
    step: 0.1,
    defaultValue: 2.0,
    importance: "core",
    marks: [
      { value: 0, variant: "critical", label: "y轴", labelFormula: "b = 0" },
    ],
  },
  centerX: {
    key: "centerX",
    label: "中心横坐标 xc",
    labelFormula: `\\text{对称中心 } \\color{${MATH_COLORS.paramPrimary}}{x_c}`,
    min: -3.0,
    max: 3.0,
    step: 0.1,
    defaultValue: 0.0,
    importance: "core",
    marks: [
      { value: 0, variant: "critical", label: "原点", labelFormula: "x_c = 0" },
    ],
  },
  centerY: {
    key: "centerY",
    label: "中心纵坐标 yc",
    labelFormula: `\\text{对称中心 } \\color{${MATH_COLORS.paramSecondary}}{y_c}`,
    min: -3.0,
    max: 3.0,
    step: 0.1,
    defaultValue: 0.0,
    importance: "core",
    marks: [
      { value: 0, variant: "critical", label: "x轴", labelFormula: "y_c = 0" },
    ],
  },
};
