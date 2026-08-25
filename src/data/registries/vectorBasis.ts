import type { ParamMeta } from "../types";
import { MATH_COLORS } from "@/theme";

export const defaultParams = {
  // 模式一：基底 e1, e2 与 目标向量 a
  e1x: 2.5,
  e1y: 0.5,
  e2x: 0.5,
  e2y: 2.0,
  ax: 3.5,
  ay: 3.0,

  // 模式二：正交基底角度
  thetaDeg: 30,

  // 模式三：三点共线系数
  xCoeff: 0.4,
  yCoeff: 0.6,

  // 模式四：三角形分割比率
  ratioT: 0.5,
};

export interface BasisPreset {
  key: string;
  label: string;
  description: string;
  params: Partial<typeof defaultParams>;
}

export const presetsByMode: Record<string, BasisPreset[]> = {
  basisDecomp: [
    {
      key: "free",
      label: "自由探究",
      description: "全参数开放",
      params: {},
    },
    {
      key: "standard",
      label: "锐角基底",
      description: "60° 典型分解",
      params: { e1x: 3.0, e1y: 0.0, e2x: 1.5, e2y: 2.6, ax: 3.5, ay: 3.0 },
    },
    {
      key: "obtuse",
      label: "钝角基底",
      description: "120° 投影分解",
      params: { e1x: 3.0, e1y: 0.0, e2x: -1.5, e2y: 2.6, ax: 1.0, ay: 3.0 },
    },
    {
      key: "collinear_deg",
      label: "共线退化",
      description: "D=0 临界警示",
      params: { e1x: 2.0, e1y: 1.0, e2x: 4.0, e2y: 2.0, ax: 3.0, ay: 3.0 },
    },
  ],
  orthogonal: [
    {
      key: "free",
      label: "自由探究",
      description: "全参数开放",
      params: {},
    },
    {
      key: "deg0",
      label: "标准直角",
      description: "θ=0° 笛卡尔系",
      params: { thetaDeg: 0, ax: 3.5, ay: 2.5 },
    },
    {
      key: "deg30",
      label: "30° 斜面",
      description: "θ=30° 旋转坐标",
      params: { thetaDeg: 30, ax: 3.5, ay: 3.0 },
    },
    {
      key: "deg45",
      label: "45° 对称",
      description: "θ=45° 对称基底",
      params: { thetaDeg: 45, ax: 3.0, ay: 3.0 },
    },
  ],
  collinear: [
    {
      key: "free",
      label: "自由探究",
      description: "全参数开放",
      params: {},
    },
    {
      key: "midpoint",
      label: "中点共线",
      description: "x=0.5, y=0.5",
      params: { xCoeff: 0.5, yCoeff: 0.5 },
    },
    {
      key: "outer",
      label: "外分点",
      description: "x=1.5, y=-0.5",
      params: { xCoeff: 1.5, yCoeff: -0.5 },
    },
    {
      key: "isocline2",
      label: "等和线 k=2",
      description: "x+y=2 偏离直线",
      params: { xCoeff: 1.0, yCoeff: 1.0 },
    },
  ],
  triangleGeom: [
    {
      key: "free",
      label: "自由探究",
      description: "全参数开放",
      params: {},
    },
    {
      key: "midpoint",
      label: "中点位置",
      description: "t=0.5 (中线OM)",
      params: { ratioT: 0.5 },
    },
    {
      key: "trisection",
      label: "三等分点",
      description: "t=1/3 (靠近A)",
      params: { ratioT: 0.33 },
    },
    {
      key: "vertexB",
      label: "顶点临界",
      description: "t=1.0 (重合B)",
      params: { ratioT: 1.0 },
    },
  ],
};

export const paramMeta: Record<string, ParamMeta> = {
  e1x: {
    key: "e1x",
    label: "基底 e1 的 x 坐标",
    labelFormula: `\\color{${MATH_COLORS.paramPrimary}}{e_{1x}}`,
    defaultValue: 2.5,
    min: -5,
    max: 5,
    step: 0.5,
    description: "基底向量 e1 的横坐标",
    importance: "core",
    group: "基底向量 e₁",
  },
  e1y: {
    key: "e1y",
    label: "基底 e1 的 y 坐标",
    labelFormula: `\\color{${MATH_COLORS.paramPrimary}}{e_{1y}}`,
    defaultValue: 0.5,
    min: -5,
    max: 5,
    step: 0.5,
    description: "基底向量 e1 的纵坐标",
    importance: "core",
    group: "基底向量 e₁",
  },
  e2x: {
    key: "e2x",
    label: "基底 e2 的 x 坐标",
    labelFormula: `\\color{${MATH_COLORS.paramSecondary}}{e_{2x}}`,
    defaultValue: 0.5,
    min: -5,
    max: 5,
    step: 0.5,
    description: "基底向量 e2 的横坐标",
    importance: "core",
    group: "基底向量 e₂",
  },
  e2y: {
    key: "e2y",
    label: "基底 e2 的 y 坐标",
    labelFormula: `\\color{${MATH_COLORS.paramSecondary}}{e_{2y}}`,
    defaultValue: 2.0,
    min: -5,
    max: 5,
    step: 0.5,
    description: "基底向量 e2 的纵坐标",
    importance: "core",
    group: "基底向量 e₂",
  },
  ax: {
    key: "ax",
    label: "目标向量 a 的 x 坐标",
    labelFormula: "a_x",
    defaultValue: 3.5,
    min: -5,
    max: 5,
    step: 0.5,
    description: "待分解目标向量 a 的横坐标",
    importance: "core",
    group: "待分解向量 a",
  },
  ay: {
    key: "ay",
    label: "目标向量 a 的 y 坐标",
    labelFormula: "a_y",
    defaultValue: 3.0,
    min: -5,
    max: 5,
    step: 0.5,
    description: "待分解目标向量 a 的纵坐标",
    importance: "core",
    group: "待分解向量 a",
  },
  thetaDeg: {
    key: "thetaDeg",
    label: "正交基底旋转角 θ",
    labelFormula: "\\theta",
    defaultValue: 30,
    min: 0,
    max: 180,
    step: 5,
    description: "旋转正交基底 [i', j'] 的倾斜角度 (°)",
    importance: "core",
    group: "旋转基底参数",
    marks: [
      { value: 0, label: "0° (标准正交)", variant: "critical" },
      { value: 45, label: "45°" },
      { value: 90, label: "90°" },
    ],
  },
  xCoeff: {
    key: "xCoeff",
    label: "基底向量 e1 的权重 x",
    labelFormula: `\\color{${MATH_COLORS.paramPrimary}}{x}`,
    defaultValue: 0.4,
    min: -1.5,
    max: 2.5,
    step: 0.05,
    description: "P = x*e1 + y*e2 中 e1 的分解系数",
    importance: "core",
    group: "基底线性权重",
    marks: [
      { value: 0, label: "x=0 (点在e2轴)", variant: "critical" },
      { value: 0.5, label: "x=0.5" },
      { value: 1, label: "x=1", variant: "critical" },
    ],
  },
  yCoeff: {
    key: "yCoeff",
    label: "基底向量 e2 的权重 y",
    labelFormula: `\\color{${MATH_COLORS.paramSecondary}}{y}`,
    defaultValue: 0.6,
    min: -1.5,
    max: 2.5,
    step: 0.05,
    description: "P = x*e1 + y*e2 中 e2 的分解系数",
    importance: "core",
    group: "基底线性权重",
    marks: [
      { value: 0, label: "y=0 (点在e1轴)", variant: "critical" },
      { value: 0.6, label: "y=0.6" },
      { value: 1, label: "y=1", variant: "critical" },
    ],
  },
  ratioT: {
    key: "ratioT",
    label: "线段 AB 分点比率 t",
    labelFormula: "t",
    defaultValue: 0.5,
    min: 0,
    max: 1,
    step: 0.05,
    description: "P 点在线段 AB 上的位置比率 (0 为 A, 1 为 B)",
    importance: "core",
    group: "分点比率",
    marks: [
      { value: 0, label: "0 (点 A)", variant: "critical" },
      { value: 0.5, label: "0.5 (中点 M)" },
      { value: 1, label: "1 (点 B)", variant: "critical" },
    ],
  },
};
