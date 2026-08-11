import type { ParamMeta } from "@/data/types";

export const defaultParams = {
  xa: 4,
  ya: 0,
  xb: 2,
  yb: 3,
};

export const paramMeta: Record<string, ParamMeta> = {
  xa: {
    key: "xa",
    label: "向量 a 的 x 坐标 (xa)",
    labelFormula: "x_a",
    defaultValue: 4,
    min: -6,
    max: 6,
    step: 0.5,
    description: "调整向量 a 在 X 轴上的分量",
    importance: "core",
  },
  ya: {
    key: "ya",
    label: "向量 a 的 y 坐标 (ya)",
    labelFormula: "y_a",
    defaultValue: 0,
    min: -6,
    max: 6,
    step: 0.5,
    description: "调整向量 a 在 Y 轴上的分量",
    importance: "core",
  },
  xb: {
    key: "xb",
    label: "向量 b 的 x 坐标 (xb)",
    labelFormula: "x_b",
    defaultValue: 2,
    min: -6,
    max: 6,
    step: 0.5,
    description: "调整向量 b 在 X 轴上的分量",
    importance: "core",
  },
  yb: {
    key: "yb",
    label: "向量 b 的 y 坐标 (yb)",
    labelFormula: "y_b",
    defaultValue: 3,
    min: -6,
    max: 6,
    step: 0.5,
    description: "调整向量 b 在 Y 轴上的分量",
    importance: "core",
  },
};
