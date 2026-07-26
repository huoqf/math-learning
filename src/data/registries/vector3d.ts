import type { ParamMeta } from "../types";

export const defaultParams = {
  vector3dBasis: {
    x: 1.5,
    y: 1.2,
    z: 1.8,
  },
} as const;

export const vector3dBasisMeta: ParamMeta[] = [
  {
    key: "x",
    label: "基底 a 的系数 x",
    labelFormula: "x",
    min: -2,
    max: 3,
    step: 0.1,
    defaultValue: 1.5,
    importance: "core",
    description: "向量 OP 在基底 a 上的分解系数 x",
    descriptionFormula:
      "\\text{向量 } \\vec{OP} = x\\vec{a} + y\\vec{b} + z\\vec{c} \\text{ 中的系数 } x",
  },
  {
    key: "y",
    label: "基底 b 的系数 y",
    labelFormula: "y",
    min: -2,
    max: 3,
    step: 0.1,
    defaultValue: 1.2,
    importance: "core",
    description: "向量 OP 在基底 b 上的分解系数 y",
    descriptionFormula:
      "\\text{向量 } \\vec{OP} = x\\vec{a} + y\\vec{b} + z\\vec{c} \\text{ 中的系数 } y",
  },
  {
    key: "z",
    label: "基底 c 的系数 z",
    labelFormula: "z",
    min: -2,
    max: 3,
    step: 0.1,
    defaultValue: 1.8,
    importance: "core",
    description: "向量 OP 在基底 c 上的分解系数 z",
    descriptionFormula:
      "\\text{向量 } \\vec{OP} = x\\vec{a} + y\\vec{b} + z\\vec{c} \\text{ 中的系数 } z",
    marks: [{ value: 0, label: "z=0 (共面)", labelFormula: "z=0" }],
  },
];
