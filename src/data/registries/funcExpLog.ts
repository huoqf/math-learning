import type { ParamMeta } from "../types";

export const defaultParams: Record<string, number> = {
  x0: 1.5,
  baseA: 2.0,
  powerAlpha: 2.0,
};

export const paramMeta: Record<string, ParamMeta> = {
  x0: {
    key: "x0",
    label: "采样点 x0",
    labelFormula: "x_0",
    min: -4.0,
    max: 4.0,
    step: 0.1,
    defaultValue: 1.5,
    importance: "core",
    description: "控制研究函数奇偶对称性、反函数对应点的自变量位置 x0",
  },
  baseA: {
    key: "baseA",
    label: "指对数底数 a",
    labelFormula: "a",
    min: 0.1,
    max: 4.0,
    step: 0.1,
    defaultValue: 2.0,
    importance: "core",
    description:
      "控制指数函数 y = a^x 与对数函数 y = log_a(x) 的底数，a = 1 时退化",
    descriptionFormula:
      "控制指数函数 $y = a^x$ 与对数函数 $y = \\log_a(x)$ 的底数，$a = 1$ 时退化",
    marks: [
      {
        value: 1.0,
        variant: "critical",
        label: "退化 (a=1)",
        labelFormula: "a = 1",
      },
    ],
  },
  powerAlpha: {
    key: "powerAlpha",
    label: "幂函数指数 α",
    labelFormula: "\\alpha",
    min: -2.0,
    max: 3.0,
    step: 0.5,
    defaultValue: 2.0,
    importance: "core",
    description: "控制幂函数 y = x^α 的指数形状 (如 -1, 0.5, 1, 2, 3)",
    descriptionFormula: "控制幂函数 $y = x^{\\alpha}$ 的指数形状",
  },
};
