import type { ParamMeta } from "../types";

export const paramMeta: Record<string, ParamMeta> = {
  x0: {
    key: "x0",
    label: "切点 x₀",
    min: -4,
    max: 4,
    step: 0.1,
    defaultValue: 1,
    description:
      "切点的横坐标【绑定主色-红】，决定切线所在位置。可直接在图上拖拽该点。",
    importance: "core",
    marks: [{ value: 0, label: "0", variant: "zero" }],
  },
  dx: {
    key: "dx",
    label: "步长 Δx",
    min: 0.01,
    max: 2.0,
    step: 0.01,
    defaultValue: 1.0,
    description:
      "割线第二点与切点横坐标之差【绑定次色-橙】。调节该值趋近于0以观察割线逼近切线。",
    importance: "advanced",
    marks: [
      { value: 0.01, label: "0.01 (极小)", variant: "zero" },
      { value: 1.0, label: "1.0" },
      { value: 2.0, label: "2.0" },
    ],
  },
};

export const defaultParams = {
  x0: 1.0,
  dx: 1.0,
};
