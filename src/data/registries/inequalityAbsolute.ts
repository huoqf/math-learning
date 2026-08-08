/**
 * src/data/registries/inequalityAbsolute.ts
 * 绝对值不等式参数注册表
 */

import type { ParamMeta } from "@/data/types";

export const defaultParams: Record<string, number> = {
  a: 1.0,
  b: 4.0,
  c: 2.5,
  m: 5.0,
  x: 2.5,
};

export const paramMeta: Record<string, ParamMeta> = {
  a: {
    key: "a",
    label: "点 A 坐标 (a)",
    labelFormula: "\\color{#EF4444}{a}",
    defaultValue: 1.0,
    min: -5.0,
    max: 5.0,
    step: 0.5,
    description: "数轴上基准定点 A 的坐标",
    descriptionFormula: "\\text{数轴基准定点 } A(\\color{#EF4444}{a})",
    importance: "core",
    marks: [{ value: 0, label: "原点 (0)", labelFormula: "a = 0" }],
  },
  b: {
    key: "b",
    label: "点 B 坐标 (b)",
    labelFormula: "\\color{#D97706}{b}",
    defaultValue: 4.0,
    min: -5.0,
    max: 5.0,
    step: 0.5,
    description: "数轴上第二个基准定点 B 的坐标",
    descriptionFormula: "\\text{数轴基准定点 } B(\\color{#D97706}{b})",
    importance: "core",
    marks: [{ value: 0, label: "原点 (0)", labelFormula: "b = 0" }],
  },
  c: {
    key: "c",
    label: "单绝对值半径 (c)",
    labelFormula: "\\color{#059669}{c}",
    defaultValue: 2.5,
    min: 0.0,
    max: 6.0,
    step: 0.5,
    description: "单绝对值不等式距离阈值",
    descriptionFormula: "\\text{距离阈值 } \\color{#059669}{c} \\ge 0",
    importance: "core",
    marks: [
      {
        value: 0,
        label: "临界点 (0)",
        labelFormula: "c = 0",
        variant: "critical",
      },
    ],
  },
  m: {
    key: "m",
    label: "常数线阈值 (m)",
    labelFormula: "\\color{#059669}{m}",
    defaultValue: 5.0,
    min: -2.0,
    max: 8.0,
    step: 0.5,
    description: "双绝对值组合的目标比较常数",
    descriptionFormula: "\\text{目标水平线 } y = \\color{#059669}{m}",
    importance: "core",
    marks: [
      { value: 0, label: "0", labelFormula: "m = 0", variant: "critical" },
    ],
  },
  x: {
    key: "x",
    label: "试探动点 (x)",
    labelFormula: "\\color{#059669}{x}",
    defaultValue: 2.5,
    min: -6.0,
    max: 6.0,
    step: 0.1,
    description: "数轴上实时动点 P 的位置",
    descriptionFormula: "\\text{数轴动点 } P(\\color{#059669}{x})",
    importance: "advanced",
  },
};
