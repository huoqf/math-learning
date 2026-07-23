import type { ParamMeta } from "../types";

export const defaultParams: Record<string, number> = {
  x0: 0.0, // 指数/对数切点横坐标
  a: 1.0, // 高考恒成立参数 a
};

export const paramMeta: Record<string, ParamMeta> = {
  x0: {
    key: "x0",
    label: "切点横坐标 x₀",
    labelFormula: "x_0",
    min: -2.0,
    max: 3.0,
    step: 0.1,
    defaultValue: 0.0,
    importance: "core",
    description: "控制超越函数切线的切点位置 (e^x 基准 x₀=0，ln x 基准 x₀=1)",
    descriptionFormula:
      "控制超越函数切线的切点位置 ($e^x$ 基准 $x_0=0$，$\\ln x$ 基准 $x_0=1$)",
    marks: [
      {
        value: 0,
        variant: "critical",
        label: "e^x 基准",
        labelFormula: "x_0=0",
      },
      {
        value: 1,
        variant: "critical",
        label: "ln x 基准",
        labelFormula: "x_0=1",
      },
    ],
  },
  a: {
    key: "a",
    label: "放缩/放缩斜率 a",
    labelFormula: "a",
    min: -1.0,
    max: 4.0,
    step: 0.1,
    defaultValue: 1.0,
    importance: "core",
    description:
      "控制直线 y = ax + 1 或 y = ax 的斜率，观察相切临界与恒成立范围",
    descriptionFormula:
      "控制直线 $y = ax + 1$ 或 $y = ax$ 的斜率，观察相切临界与恒成立范围",
    marks: [
      { value: 0, variant: "critical", label: "水平线", labelFormula: "a = 0" },
      {
        value: 1,
        variant: "critical",
        label: "基准切线临界",
        labelFormula: "a = 1",
      },
      {
        value: 2.7,
        variant: "critical",
        label: "过原点切线",
        labelFormula: "a = e",
      },
    ],
  },
};
