import type { ParamMeta } from "../types";
import { MATH_COLORS } from "@/theme";

export const defaultParams = {
  a: 1.0,
  b: 4.0,
  x0: 3.0,
  h: 0.0,
  c: 0.0,
} as const;

export const paramMeta: Record<string, ParamMeta> = {
  a: {
    key: "a",
    label: "斜率 / 系数 a",
    labelFormula: `\\text{斜率 } \\color{${MATH_COLORS.paramPrimary}}{a}`,
    min: -3.0,
    max: 3.0,
    step: 0.1,
    defaultValue: 1.0,
    group: "函数系数",
    importance: "core",
    marks: [
      {
        value: 0,
        variant: "critical",
        label: "退化为反比例",
        labelFormula: "a = 0",
      },
    ],
  },
  b: {
    key: "b",
    label: "分子系数 b",
    labelFormula: `\\text{分子 } \\color{${MATH_COLORS.paramSecondary}}{b}`,
    min: -9.0,
    max: 9.0,
    step: 0.5,
    defaultValue: 4.0,
    group: "函数系数",
    importance: "core",
    marks: [
      {
        value: 0,
        variant: "critical",
        label: "退化为一次线",
        labelFormula: "b = 0",
      },
    ],
  },
  h: {
    key: "h",
    label: "水平平移 h",
    labelFormula: `\\text{水平平移 } \\color{${MATH_COLORS.paramTertiary}}{h}`,
    min: -4.0,
    max: 4.0,
    step: 0.5,
    defaultValue: 0.0,
    group: "平移中心 (h, c)",
    importance: "advanced",
    marks: [
      {
        value: 0,
        variant: "critical",
        label: "标准型无平移",
        labelFormula: "h = 0",
      },
    ],
  },
  c: {
    key: "c",
    label: "垂直平移 c",
    labelFormula: `\\text{垂直平移 } \\color{${MATH_COLORS.paramTertiary}}{c}`,
    min: -4.0,
    max: 4.0,
    step: 0.5,
    defaultValue: 0.0,
    group: "平移中心 (h, c)",
    importance: "advanced",
    marks: [
      {
        value: 0,
        variant: "critical",
        label: "标准型无平移",
        labelFormula: "c = 0",
      },
    ],
  },
  x0: {
    key: "x0",
    label: "动点横坐标 x0",
    labelFormula: `\\text{动点 } \\color{${MATH_COLORS.paramTertiary}}{x_0}`,
    min: -6.0,
    max: 6.0,
    step: 0.1,
    defaultValue: 3.0,
    group: "探针动点",
    importance: "advanced",
  },
};
