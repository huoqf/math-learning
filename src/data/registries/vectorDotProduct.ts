import type { ParamMeta } from "@/data/types";
import { MATH_COLORS } from "@/theme";

export const defaultParams = {
  xa: 4,
  ya: 0,
  xb: 2,
  yb: 3,
};

export const paramMeta: Record<string, ParamMeta> = {
  xa: {
    key: "xa",
    label: "向量 a 的横坐标 x₁",
    labelFormula: `\\color{${MATH_COLORS.paramPrimary}}{x_1}`,
    defaultValue: 4,
    min: -6,
    max: 6,
    step: 0.5,
    description: "向量 a 在 x 轴上的坐标分量",
    descriptionFormula: `\\vec{a} = (\\color{${MATH_COLORS.paramPrimary}}{x_1}, y_1)`,
    importance: "core",
    group: `\\text{向量 } \\vec{a} = (x_1, y_1)`,
  },
  ya: {
    key: "ya",
    label: "向量 a 的纵坐标 y₁",
    labelFormula: `\\color{${MATH_COLORS.paramPrimary}}{y_1}`,
    defaultValue: 0,
    min: -6,
    max: 6,
    step: 0.5,
    description: "向量 a 在 y 轴上的坐标分量",
    descriptionFormula: `\\vec{a} = (x_1, \\color{${MATH_COLORS.paramPrimary}}{y_1})`,
    importance: "core",
    group: `\\text{向量 } \\vec{a} = (x_1, y_1)`,
  },
  xb: {
    key: "xb",
    label: "向量 b 的横坐标 x₂",
    labelFormula: `\\color{${MATH_COLORS.paramSecondary}}{x_2}`,
    defaultValue: 2,
    min: -6,
    max: 6,
    step: 0.5,
    description: "向量 b 在 x 轴上的坐标分量",
    descriptionFormula: `\\vec{b} = (\\color{${MATH_COLORS.paramSecondary}}{x_2}, y_2)`,
    importance: "core",
    group: `\\text{向量 } \\vec{b} = (x_2, y_2)`,
  },
  yb: {
    key: "yb",
    label: "向量 b 的纵坐标 y₂",
    labelFormula: `\\color{${MATH_COLORS.paramSecondary}}{y_2}`,
    defaultValue: 3,
    min: -6,
    max: 6,
    step: 0.5,
    description: "向量 b 在 y 轴上的坐标分量",
    descriptionFormula: `\\vec{b} = (x_2, \\color{${MATH_COLORS.paramSecondary}}{y_2})`,
    importance: "core",
    group: `\\text{向量 } \\vec{b} = (x_2, y_2)`,
  },
};
