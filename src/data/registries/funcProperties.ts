import type { ParamMeta } from "../types";

export const defaultParams: Record<string, number> = {
  x0: 1.5,
  x1: -1.0,
  x2: 2.0,
  axisA: 0.0,
  axisB: 2.0,
};

export const paramMeta: Record<string, ParamMeta> = {
  x0: {
    key: "x0",
    label: "主测试点 x0",
    labelFormula: "x_0",
    min: -4.0,
    max: 4.0,
    step: 0.1,
    defaultValue: 1.5,
    importance: "core",
    description:
      "拖动观察点 $P_0(x_0, f(x_0))$ 及其奇偶对称点 $P'(-x_0, f(-x_0))$ 的坐标对应关系",
    descriptionFormula:
      "拖动观察点 $P_0(x_0, f(x_0))$ 及其奇偶对称点 $P'(-x_0, f(-x_0))$ 的坐标对应关系",
    marks: [
      { value: 0, variant: "critical", label: "原点", labelFormula: "x_0 = 0" },
    ],
  },
  x1: {
    key: "x1",
    label: "割线端点 x1",
    labelFormula: "x_1",
    min: -4.0,
    max: 4.0,
    step: 0.1,
    defaultValue: -1.0,
    importance: "core",
    description: "单调性测试：割线 $P_1P_2$ 的左侧自变量端点 $x_1$",
    descriptionFormula: "单调性测试：割线 $P_1P_2$ 的左侧自变量端点 $x_1$",
    marks: [
      { value: 0, variant: "critical", label: "原点", labelFormula: "x_1 = 0" },
    ],
  },
  x2: {
    key: "x2",
    label: "割线端点 x2",
    labelFormula: "x_2",
    min: -4.0,
    max: 4.0,
    step: 0.1,
    defaultValue: 2.0,
    importance: "core",
    description:
      "单调性测试：割线 $P_1P_2$ 的右侧自变量端点 $x_2$，用于计算割线斜率 $k = \\frac{\\Delta y}{\\Delta x}$",
    descriptionFormula:
      "单调性测试：割线 $P_1P_2$ 的右侧自变量端点 $x_2$，用于计算割线斜率 $k = \\frac{\\Delta y}{\\Delta x}$",
    marks: [
      { value: 0, variant: "critical", label: "原点", labelFormula: "x_2 = 0" },
    ],
  },
  axisA: {
    key: "axisA",
    label: "对称轴 a",
    labelFormula: "a",
    min: -3.0,
    max: 3.0,
    step: 0.1,
    defaultValue: 0.0,
    importance: "core",
    description: "移动第一条对称轴 $x = a$ 的位置（红虚线）",
    descriptionFormula: "移动第一条对称轴 $x = a$ 的位置（红虚线）",
    marks: [
      { value: 0, variant: "critical", label: "y轴", labelFormula: "a = 0" },
    ],
  },
  axisB: {
    key: "axisB",
    label: "对称轴 b",
    labelFormula: "b",
    min: -3.0,
    max: 3.0,
    step: 0.1,
    defaultValue: 2.0,
    importance: "core",
    description:
      "移动第二条对称轴 $x = b$ 的位置（橙虚线），观察两轴导出周期 $T = 2|a - b|$",
    descriptionFormula:
      "移动第二条对称轴 $x = b$ 的位置（橙虚线），观察两轴导出周期 $T = 2|a - b|$",
    marks: [
      {
        value: 2.0,
        variant: "recommended",
        label: "默认",
        labelFormula: "b = 2",
      },
      { value: 0.0, variant: "critical", label: "y轴", labelFormula: "b = 0" },
    ],
  },
};
