import type { ParamMeta, ParamMark } from "../types";
import { MATH_COLORS } from "@/theme";

/**
 * 降幂后角度 α 的整数刻度（−90° / 0° / +90°）。
 *
 * 为什么提取为工厂、而不内联在 Animation.tsx：
 * `left/param-label-format` 门禁以「`marks:` 与 `[` 是否同行」判定刻度作用域，
 * 而覆盖刻度只能写成 `marks: isAlphaOnCurve ? [...] : meta.marks` 的三元形式，
 * 命中不了该模式；一旦 Prettier 按 printWidth 把刻度项折成多行，`labelFormula`
 * 就会独占一行、被误判成「参数未绑定色彩 Token」。工厂写法（与 buildSideAMarks /
 * buildAngleBMarks 同构）是该门禁显式支持的第二种载体。
 */
export function buildAngleDegreeMarks(): ParamMark[] {
  return [
    { value: -90, label: "-90°", labelFormula: "-90^\\circ" },
    { value: 0, label: "0°", labelFormula: "0^\\circ", variant: "critical" },
    { value: 90, label: "90°", labelFormula: "90^\\circ" },
  ];
}

export const defaultParams = {
  alphaDeg: 45,
  betaDeg: 30,
  coeffA: 1.0,
  coeffB: 1.73,
} as const;

export const paramMeta: Record<string, ParamMeta> = {
  alphaDeg: {
    key: "alphaDeg",
    label: "角 α (°)",
    labelFormula: `\\color{${MATH_COLORS.paramPrimary}}{\\alpha}`,
    min: -360,
    max: 360,
    step: 1,
    defaultValue: 45,
    importance: "core",
    group: "动角参数 (α, β)",
    description: "主控动角 α，决定向量 A(cos α, sin α) 或单角 x 的终边位置",
    descriptionFormula: `主控动角 $\\color{${MATH_COLORS.paramPrimary}}{\\alpha}$，决定向量 $A(\\cos\\alpha, \\sin\\alpha)$ 的终边`,
    marks: [
      {
        value: 0,
        variant: "zero",
        label: "0°",
        labelFormula: "0^\\circ",
      },
      {
        value: 30,
        label: "30°",
        labelFormula: "30^\\circ",
      },
      {
        value: 45,
        label: "45°",
        labelFormula: "45^\\circ",
      },
      {
        value: 60,
        label: "60°",
        labelFormula: "60^\\circ",
      },
      {
        value: 90,
        variant: "critical",
        label: "90°",
        labelFormula: "90^\\circ",
      },
      {
        value: 120,
        label: "120°",
        labelFormula: "120^\\circ",
      },
      {
        value: 180,
        variant: "zero",
        label: "180°",
        labelFormula: "180^\\circ",
      },
    ],
  },
  betaDeg: {
    key: "betaDeg",
    label: "角 β (°)",
    labelFormula: `\\color{${MATH_COLORS.paramSecondary}}{\\beta}`,
    min: -360,
    max: 360,
    step: 1,
    defaultValue: 30,
    importance: "core",
    group: "动角参数 (α, β)",
    description: "次要动角 β，决定向量 B(cos β, sin β) 的终边位置",
    descriptionFormula: `次要动角 $\\color{${MATH_COLORS.paramSecondary}}{\\beta}$，决定向量 $B(\\cos\\beta, \\sin\\beta)$ 的终边`,
    marks: [
      {
        value: 0,
        variant: "zero",
        label: "0°",
        labelFormula: "0^\\circ",
      },
      {
        value: 30,
        label: "30°",
        labelFormula: "30^\\circ",
      },
      {
        value: 45,
        label: "45°",
        labelFormula: "45^\\circ",
      },
      {
        value: 60,
        label: "60°",
        labelFormula: "60^\\circ",
      },
      {
        value: 90,
        variant: "critical",
        label: "90°",
        labelFormula: "90^\\circ",
      },
    ],
  },
  coeffA: {
    key: "coeffA",
    label: "正弦系数 a",
    labelFormula: `\\color{${MATH_COLORS.paramPrimary}}{a}`,
    min: -5.0,
    max: 5.0,
    step: 0.1,
    defaultValue: 1.0,
    importance: "core",
    group: "辅助角线性系数 (a, b)",
    description: "辅助角公式 a sin x + b cos x 中的正弦前系数 a",
    descriptionFormula: `辅助角化简 $\\color{${MATH_COLORS.paramPrimary}}{a}\\sin x + \\color{${MATH_COLORS.paramSecondary}}{b}\\cos x$ 中正弦系数 $a$`,
    marks: [
      {
        value: -1.73,
        label: "-√3",
        labelFormula: "-\\sqrt{3}",
      },
      {
        value: -1,
        label: "-1",
        labelFormula: "-1",
      },
      {
        value: 0,
        variant: "critical",
        label: "0",
        labelFormula: "0",
      },
      {
        value: 1,
        label: "1",
        labelFormula: "1",
      },
      {
        value: 1.73,
        label: "√3",
        labelFormula: "\\sqrt{3}",
      },
    ],
  },
  coeffB: {
    key: "coeffB",
    label: "余弦系数 b",
    labelFormula: `\\color{${MATH_COLORS.paramSecondary}}{b}`,
    min: -5.0,
    max: 5.0,
    step: 0.1,
    defaultValue: 1.73,
    importance: "core",
    group: "辅助角线性系数 (a, b)",
    description: "辅助角公式 a sin x + b cos x 中的余弦前系数 b",
    descriptionFormula: `辅助角化简 $\\color{${MATH_COLORS.paramPrimary}}{a}\\sin x + \\color{${MATH_COLORS.paramSecondary}}{b}\\cos x$ 中余弦系数 $b$`,
    marks: [
      {
        value: -1.73,
        label: "-√3",
        labelFormula: "-\\sqrt{3}",
      },
      {
        value: -1,
        label: "-1",
        labelFormula: "-1",
      },
      {
        value: 0,
        variant: "critical",
        label: "0",
        labelFormula: "0",
      },
      {
        value: 1,
        label: "1",
        labelFormula: "1",
      },
      {
        value: 1.73,
        label: "√3",
        labelFormula: "\\sqrt{3}",
      },
    ],
  },
};
