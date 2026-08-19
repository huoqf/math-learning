import type { ParamMeta } from "../types";
import { MATH_COLORS } from "@/theme";

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
    labelFormula: `\\color{${MATH_COLORS.paramPrimary}}{x}`,
    min: -2,
    max: 3,
    step: 0.1,
    defaultValue: 1.5,
    importance: "core",
    description: "向量 OP 在基底 a 上的分解系数 x",
    descriptionFormula: `\\text{向量 } \\vec{OP} = \\color{${MATH_COLORS.paramPrimary}}{x}\\vec{a} + \\color{${MATH_COLORS.paramSecondary}}{y}\\vec{b} + \\color{${MATH_COLORS.paramTertiary}}{z}\\vec{c} \\text{ 中的系数 } \\color{${MATH_COLORS.paramPrimary}}{x}`,
    marks: [
      { value: 0, label: "0", labelFormula: "0" },
      { value: 0.33, label: "1/3(重心)", labelFormula: "\\frac{1}{3}" },
      { value: 1, label: "1", labelFormula: "1" },
    ],
  },
  {
    key: "y",
    label: "基底 b 的系数 y",
    labelFormula: `\\color{${MATH_COLORS.paramSecondary}}{y}`,
    min: -2,
    max: 3,
    step: 0.1,
    defaultValue: 1.2,
    importance: "core",
    description: "向量 OP 在基底 b 上的分解系数 y",
    descriptionFormula: `\\text{向量 } \\vec{OP} = \\color{${MATH_COLORS.paramPrimary}}{x}\\vec{a} + \\color{${MATH_COLORS.paramSecondary}}{y}\\vec{b} + \\color{${MATH_COLORS.paramTertiary}}{z}\\vec{c} \\text{ 中的系数 } \\color{${MATH_COLORS.paramSecondary}}{y}`,
    marks: [
      { value: 0, label: "0", labelFormula: "0" },
      { value: 0.33, label: "1/3(重心)", labelFormula: "\\frac{1}{3}" },
      { value: 1, label: "1", labelFormula: "1" },
    ],
  },
  {
    key: "z",
    label: "基底 c 的系数 z",
    labelFormula: `\\color{${MATH_COLORS.paramTertiary}}{z}`,
    min: -2,
    max: 3,
    step: 0.1,
    defaultValue: 1.8,
    importance: "core",
    description: "向量 OP 在基底 c 上的分解系数 z",
    descriptionFormula: `\\text{向量 } \\vec{OP} = \\color{${MATH_COLORS.paramPrimary}}{x}\\vec{a} + \\color{${MATH_COLORS.paramSecondary}}{y}\\vec{b} + \\color{${MATH_COLORS.paramTertiary}}{z}\\vec{c} \\text{ 中的系数 } \\color{${MATH_COLORS.paramTertiary}}{z}`,
    marks: [
      { value: 0, label: "0(面退化)", labelFormula: "0", variant: "critical" },
      { value: 0.33, label: "1/3(重心)", labelFormula: "\\frac{1}{3}" },
      { value: 1, label: "1", labelFormula: "1" },
    ],
  },
  {
    key: "cz",
    label: "基底 c 偏离高度",
    labelFormula: "c_z",
    min: 0,
    max: 3,
    step: 0.1,
    defaultValue: 2.0,
    importance: "advanced",
    description: "基向量 c 偏离 (ab) 平面的垂直高度（cz=0 时基底共面失效）",
    descriptionFormula:
      "\\text{基向量 } \\vec{c} \\text{ 偏离 } (ab) \\text{ 平面的垂直高度}",
    marks: [
      {
        value: 0,
        label: "0 (共面失效)",
        labelFormula: "0",
        variant: "critical",
      },
      { value: 2, label: "2.0 (标准)", labelFormula: "2.0" },
    ],
  },
];

/** 目标向量自身空间坐标参数（直接调节目标向量 p） */
export const vector3dTargetMeta: ParamMeta[] = [
  {
    key: "px",
    label: "目标向量 X 坐标",
    labelFormula: "P_x",
    min: -3,
    max: 5,
    step: 0.1,
    defaultValue: 3.5,
    importance: "core",
    description: "目标向量 P 在空间直角坐标系中的 X 坐标",
    descriptionFormula: "\\text{目标点 } P \\text{ 的空间 } X \\text{ 坐标}",
    marks: [{ value: 0, label: "0", labelFormula: "0" }],
  },
  {
    key: "py",
    label: "目标向量 Y 坐标",
    labelFormula: "P_y",
    min: -3,
    max: 5,
    step: 0.1,
    defaultValue: 3.0,
    importance: "core",
    description: "目标向量 P 在空间直角坐标系中的 Y 坐标",
    descriptionFormula: "\\text{目标点 } P \\text{ 的空间 } Y \\text{ 坐标}",
    marks: [{ value: 0, label: "0", labelFormula: "0" }],
  },
  {
    key: "pz",
    label: "目标向量 Z 坐标",
    labelFormula: "P_z",
    min: -2,
    max: 5,
    step: 0.1,
    defaultValue: 3.6,
    importance: "core",
    description: "目标向量 P 在空间直角坐标系中的 Z 坐标",
    descriptionFormula: "\\text{目标点 } P \\text{ 的空间 } Z \\text{ 坐标}",
    marks: [{ value: 0, label: "0", labelFormula: "0" }],
  },
];
