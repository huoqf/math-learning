import type { ParamMeta } from "../types";

export const defaultParams = {
  vector3dBasis: {
    x: 1.5,
    y: 1.2,
    z: 1.8,
    cz: 2.0, // 基向量 c 的 z 分量，用于退化探究
  },
} as const;

export const vector3dBasisMeta: ParamMeta[] = [
  {
    key: "x",
    label: "基底 a 的系数 x",
    labelFormula: "\\color{#EF4444}{x}",
    min: -2,
    max: 3,
    step: 0.1,
    defaultValue: 1.5,
    importance: "core",
    description: "向量 OP 在基底 a 上的分解系数 x",
    descriptionFormula:
      "\\text{向量 } \\vec{OP} = \\color{#EF4444}{x}\\vec{a} + \\color{#D97706}{y}\\vec{b} + \\color{#059669}{z}\\vec{c} \\text{ 中的系数 } \\color{#EF4444}{x}",
  },
  {
    key: "y",
    label: "基底 b 的系数 y",
    labelFormula: "\\color{#D97706}{y}",
    min: -2,
    max: 3,
    step: 0.1,
    defaultValue: 1.2,
    importance: "core",
    description: "向量 OP 在基底 b 上的分解系数 y",
    descriptionFormula:
      "\\text{向量 } \\vec{OP} = \\color{#EF4444}{x}\\vec{a} + \\color{#D97706}{y}\\vec{b} + \\color{#059669}{z}\\vec{c} \\text{ 中的系数 } \\color{#D97706}{y}",
  },
  {
    key: "z",
    label: "基底 c 的系数 z",
    labelFormula: "\\color{#059669}{z}",
    min: -2,
    max: 3,
    step: 0.1,
    defaultValue: 1.8,
    importance: "core",
    description: "向量 OP 在基底 c 上的分解系数 z",
    descriptionFormula:
      "\\text{向量 } \\vec{OP} = \\color{#EF4444}{x}\\vec{a} + \\color{#D97706}{y}\\vec{b} + \\color{#059669}{z}\\vec{c} \\text{ 中的系数 } \\color{#059669}{z}",
    marks: [{ value: 0, label: "0", labelFormula: "0" }],
  },
  {
    key: "cz",
    label: "基底 c 的竖直高度",
    labelFormula: "c_z",
    min: 0,
    max: 3,
    step: 0.1,
    defaultValue: 2.0,
    importance: "advanced",
    description: "基向量 c 的竖直高度分量（调节至 0 时基底退化共面）",
    descriptionFormula:
      "\\text{基向量 } \\vec{c} \\text{ 偏离 } (ab) \\text{ 平面的垂直高度}",
    marks: [{ value: 0, label: "0", labelFormula: "0" }],
  },
];
