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
    labelFormula: `\\text{基向量 } \\vec{a} \\text{ 分解系数 } \\color{${MATH_COLORS.paramPrimary}}{x}`,
    min: -2,
    max: 3,
    step: 0.1,
    defaultValue: 1.5,
    importance: "core",
    marks: [
      {
        value: 0.33,
        label: "重心(1/3)",
        labelFormula: "\\frac{1}{3}",
        variant: "critical",
      },
    ],
  },
  {
    key: "y",
    label: "基底 b 的系数 y",
    labelFormula: `\\text{基向量 } \\vec{b} \\text{ 分解系数 } \\color{${MATH_COLORS.paramSecondary}}{y}`,
    min: -2,
    max: 3,
    step: 0.1,
    defaultValue: 1.2,
    importance: "core",
    marks: [
      {
        value: 0.33,
        label: "重心(1/3)",
        labelFormula: "\\frac{1}{3}",
        variant: "critical",
      },
    ],
  },
  {
    key: "z",
    label: "基底 c 的系数 z",
    labelFormula: `\\text{基向量 } \\vec{c} \\text{ 分解系数 } \\color{${MATH_COLORS.paramTertiary}}{z}`,
    min: -2,
    max: 3,
    step: 0.1,
    defaultValue: 1.8,
    importance: "core",
    marks: [
      { value: 0, label: "面退化", labelFormula: "0", variant: "critical" },
      {
        value: 0.33,
        label: "重心(1/3)",
        labelFormula: "\\frac{1}{3}",
        variant: "critical",
      },
    ],
  },
  {
    key: "cz",
    label: "基底 c 偏离高度",
    labelFormula: `\\text{基向量 } \\vec{c} \\text{ 偏离高 } \\color{${MATH_COLORS.paramTertiary}}{c_z}`,
    min: 0,
    max: 3,
    step: 0.1,
    defaultValue: 2.0,
    importance: "advanced",
    marks: [
      {
        value: 0,
        label: "共面失效",
        labelFormula: "0",
        variant: "critical",
      },
    ],
  },
];

/** 目标向量自身空间坐标参数（直接调节目标向量 p） */
export const vector3dTargetMeta: ParamMeta[] = [
  {
    key: "px",
    label: "目标向量 X 坐标",
    labelFormula: `\\text{向量 } \\vec{OP} \\text{ 坐标 } \\color{${MATH_COLORS.paramPrimary}}{P_x}`,
    min: -3,
    max: 5,
    step: 0.1,
    defaultValue: 3.5,
    importance: "core",
  },
  {
    key: "py",
    label: "目标向量 Y 坐标",
    labelFormula: `\\text{向量 } \\vec{OP} \\text{ 坐标 } \\color{${MATH_COLORS.paramSecondary}}{P_y}`,
    min: -3,
    max: 5,
    step: 0.1,
    defaultValue: 3.0,
    importance: "core",
  },
  {
    key: "pz",
    label: "目标向量 Z 坐标",
    labelFormula: `\\text{向量 } \\vec{OP} \\text{ 坐标 } \\color{${MATH_COLORS.paramTertiary}}{P_z}`,
    min: -2,
    max: 5,
    step: 0.1,
    defaultValue: 3.6,
    importance: "core",
  },
];

/** 空间向量坐标运算参数（调节向量 a 与向量 b 的分量） */
export const vector3dOperationsMeta: ParamMeta[] = [
  {
    key: "ax",
    label: "向量 a 的 x 分量",
    labelFormula: `\\vec{a} \\text{ 坐标 } \\color{${MATH_COLORS.paramPrimary}}{a_x}`,
    min: -3,
    max: 4,
    step: 0.2,
    defaultValue: 2,
    importance: "core",
  },
  {
    key: "ay",
    label: "向量 a 的 y 分量",
    labelFormula: `\\vec{a} \\text{ 坐标 } \\color{${MATH_COLORS.paramPrimary}}{a_y}`,
    min: -3,
    max: 4,
    step: 0.2,
    defaultValue: 1,
    importance: "core",
  },
  {
    key: "az",
    label: "向量 a 的 z 分量",
    labelFormula: `\\vec{a} \\text{ 坐标 } \\color{${MATH_COLORS.paramPrimary}}{a_z}`,
    min: -3,
    max: 4,
    step: 0.2,
    defaultValue: 0,
    importance: "core",
  },
  {
    key: "bx",
    label: "向量 b 的 x 分量",
    labelFormula: `\\vec{b} \\text{ 坐标 } \\color{${MATH_COLORS.paramSecondary}}{b_x}`,
    min: -3,
    max: 4,
    step: 0.2,
    defaultValue: 1,
    importance: "core",
  },
  {
    key: "by",
    label: "向量 b 的 y 分量",
    labelFormula: `\\vec{b} \\text{ 坐标 } \\color{${MATH_COLORS.paramSecondary}}{b_y}`,
    min: -3,
    max: 4,
    step: 0.2,
    defaultValue: 2,
    importance: "core",
  },
  {
    key: "bz",
    label: "向量 b 的 z 分量",
    labelFormula: `\\vec{b} \\text{ 坐标 } \\color{${MATH_COLORS.paramSecondary}}{b_z}`,
    min: -3,
    max: 4,
    step: 0.2,
    defaultValue: 2,
    importance: "core",
  },
];
