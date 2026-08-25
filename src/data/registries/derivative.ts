import type { ParamMeta } from "../types";

export const paramMeta: Record<string, ParamMeta> = {
  x0: {
    key: "x0",
    label: "切点横坐标 x₀",
    labelFormula: "x_0",
    group: "切点与割线参数",
    min: -4,
    max: 4,
    step: 0.05,
    defaultValue: 1,
    description:
      "切点 P 的横坐标【绑定主色-红】，决定切线所在位置。可直接在图上拖拽该点。",
    importance: "core",
    marks: [
      { value: -2, label: "-2" },
      { value: 0, label: "0", variant: "zero" },
      { value: 1, label: "1" },
      { value: 2, label: "2" },
    ],
  },
  dx: {
    key: "dx",
    label: "割线步长 Δx",
    labelFormula: "\\Delta x",
    group: "切点与割线参数",
    min: 0.01,
    max: 2.0,
    step: 0.01,
    defaultValue: 1.0,
    description:
      "割线动点 Q 与切点 P 横坐标之差【绑定次色-橙】。调节该值趋近于 0 观察割线以直代曲逼近切线。",
    importance: "advanced",
    marks: [
      { value: 0.01, label: "0.01 (极小)", variant: "critical" },
      { value: 0.5, label: "0.5" },
      { value: 1.0, label: "1.0" },
      { value: 2.0, label: "2.0" },
    ],
  },
};

export const defaultParams = {
  x0: 1.0,
  dx: 1.0,
};
