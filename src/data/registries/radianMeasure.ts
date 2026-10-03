import type { ParamMeta } from "../types";
import { MATH_COLORS } from "@/theme";

export const defaultParams = {
  alphaRad: Math.PI / 3,
  radius: 1.5,
} as const;

/**
 * 「弧度定义」模式下的中屏单位半径。
 *
 * 为什么固定为 1：弧度的定义是「弧长与半径之比」$|\alpha| = l / r$。
 * 若该模式下半径仍可拖动，学生极易把「弧度数随圆的大小变化」误当成结论；
 * 固定 $r = 1$ 后弧长 $l$ 的读数**就是**弧度数，比值与半径无关这一核心结论一眼可见。
 */
export const DEFINITION_MODE_RADIUS = 1;

/**
 * 按研究模式解析实际参与作画与计算的半径 —— 单一真源。
 *
 * Scene（画布）、Animation（悬浮公式）与 builder（右屏看板）必须都调用它，
 * 严禁任何一处再自行写死「definition 就用 1」的判断，否则三处读数会互相打架。
 */
export function resolveSceneRadius(studyMode: string, radius: number): number {
  return studyMode === "definition" ? DEFINITION_MODE_RADIUS : radius;
}

export const paramMeta: Record<string, ParamMeta> = {
  alphaRad: {
    key: "alphaRad",
    label: "圆心角 α (弧度)",
    labelFormula: `\\text{圆心角 }\\color{${MATH_COLORS.paramPrimary}}{\\alpha}`,
    min: 0,
    max: 6.2832,
    step: 0.01,
    defaultValue: Math.PI / 3,
    importance: "core",
    description: "弧长与半径之比，即弧度制下的圆心角 α = l / r",
    descriptionFormula: "\\alpha = \\dfrac{l}{r} \\in (0, 2\\pi]",
    marks: [
      { value: 0, label: "0", labelFormula: "0" },
      { value: Math.PI / 6, label: "π/6", labelFormula: "\\frac{\\pi}{6}" },
      { value: Math.PI / 4, label: "π/4", labelFormula: "\\frac{\\pi}{4}" },
      {
        value: 1,
        label: "1 rad",
        labelFormula: "1\\,\\text{rad}",
        variant: "critical",
      },
      { value: Math.PI / 3, label: "π/3", labelFormula: "\\frac{\\pi}{3}" },
      { value: Math.PI / 2, label: "π/2", labelFormula: "\\frac{\\pi}{2}" },
      { value: Math.PI, label: "π", labelFormula: "\\pi" },
      {
        value: (3 * Math.PI) / 2,
        label: "3π/2",
        labelFormula: "\\frac{3\\pi}{2}",
      },
      { value: 2 * Math.PI, label: "2π", labelFormula: "2\\pi" },
    ],
  },
  radius: {
    key: "radius",
    label: "半径 r",
    labelFormula: `\\text{半径 }\\color{${MATH_COLORS.paramSecondary}}{r}`,
    min: 0.5,
    max: 3,
    step: 0.1,
    defaultValue: 1.5,
    importance: "core",
    description:
      "圆的半径，决定弧长与扇形面积的尺度（1 弧度 = 弧长恰等于半径）",
    descriptionFormula: "r > 0, \\quad l = |\\alpha|\\,r",
  },
};
