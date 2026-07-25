import type { ParamMeta } from "../types";

export const defaultParams = {
  linePlaneRelation: {
    a: 3,
    lineParam: 0.5,
  },
  spatialAngle: {
    a: 3,
    b: 2,
    c: 2,
    ex: 1.2,
  },
  circumInSphere: {
    a: 3,
    b: 2,
    c: 2,
  },
} as const;

export const linePlaneRelationMeta: ParamMeta[] = [
  {
    key: "a",
    label: "棱长 a",
    min: 1,
    max: 5,
    step: 0.1,
    defaultValue: 3,
    importance: "core",
    description: "控制长方体 x 方向棱长",
  },
  {
    key: "lineParam",
    label: "直线方向参数 t",
    min: -2,
    max: 2,
    step: 0.05,
    defaultValue: 0.5,
    importance: "core",
    description: "控制空间直线的方向向量",
  },
];

export const spatialAngleMeta: ParamMeta[] = [
  {
    key: "a",
    label: "长 a",
    min: 1,
    max: 5,
    step: 0.1,
    defaultValue: 3,
    importance: "core",
    description: "长方体 x 方向棱长",
  },
  {
    key: "b",
    label: "宽 b",
    min: 1,
    max: 5,
    step: 0.1,
    defaultValue: 2,
    importance: "core",
    description: "长方体 y 方向棱长",
  },
  {
    key: "c",
    label: "高 c",
    min: 1,
    max: 5,
    step: 0.1,
    defaultValue: 2,
    importance: "core",
    description: "长方体 z 方向棱长（竖直）",
  },
  {
    key: "ex",
    label: "截面点 E 高度",
    min: 0.3,
    max: 5,
    step: 0.05,
    defaultValue: 1.2,
    importance: "advanced",
    description: "点 E 在 z 轴上的高度，控制截面二面角大小",
  },
];

export const circumInSphereMeta: ParamMeta[] = [
  {
    key: "a",
    label: "参数 a",
    min: 1,
    max: 6,
    step: 0.1,
    defaultValue: 3,
    importance: "core",
  },
  {
    key: "b",
    label: "参数 b",
    min: 1,
    max: 6,
    step: 0.1,
    defaultValue: 2,
    importance: "core",
  },
  {
    key: "c",
    label: "参数 c / 高",
    min: 1,
    max: 6,
    step: 0.1,
    defaultValue: 2,
    importance: "core",
  },
];
