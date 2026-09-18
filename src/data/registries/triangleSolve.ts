import type { ParamMeta, ParamMark } from "@/data/types";
import { MATH_COLORS } from "@/theme";

/**
 * 对边 a 的动态临界标记：h = b·sinA（相切/单解临界点）与 a = b（SSA 解个数分界），
 * 二者都随 b、A 变化。静态写死 4.33 / 5 只在默认 (b = 5, A = 60°) 下成立 ——
 * 例如 b = 8 时「a = b」应标在 8。故运行时必须由本函数按当前 b、A 重新计算。
 */
export function buildSideAMarks(b: number, angleA: number): ParamMark[] {
  return [
    {
      value: Number((b * Math.sin((angleA * Math.PI) / 180)).toFixed(4)),
      label: "h=b·sinA",
      labelFormula: "h=b\\sin A",
      variant: "critical",
    },
    { value: b, label: "a=b", labelFormula: "a=b", variant: "critical" },
  ];
}

export const defaultParams: Record<string, number> = {
  angleA: 60,
  b: 5,
  c: 6,
  a: 4.5,
};

export const paramMeta: Record<string, ParamMeta> = {
  angleA: {
    key: "angleA",
    label: "内角 A (角A)",
    labelFormula: `\\text{内角 }\\color{${MATH_COLORS.paramPrimary}}{A}`,
    group: "角与邻边底模",
    defaultValue: 60,
    min: 15,
    max: 150,
    step: 1,
    unit: "°",
    description: "顶点 A 的夹角大小",
    descriptionFormula: "A \\in (0^\\circ, 180^\\circ)",
    importance: "core",
    marks: [
      { value: 30, label: "30°", labelFormula: "30^\\circ" },
      { value: 60, label: "60°", labelFormula: "60^\\circ" },
      {
        value: 90,
        label: "90°",
        labelFormula: "90^\\circ",
        variant: "critical",
      },
      { value: 120, label: "120°", labelFormula: "120^\\circ" },
    ],
  },
  b: {
    key: "b",
    label: "边长 b (AC)",
    labelFormula: `\\text{边长 }\\color{${MATH_COLORS.paramSecondary}}{b}`,
    group: "角与邻边底模",
    defaultValue: 5,
    min: 1,
    max: 10,
    step: 0.1,
    description: "顶点 B 的对边 AC 长度",
    descriptionFormula: "b = |AC|",
    importance: "core",
  },
  c: {
    key: "c",
    label: "边长 c (AB)",
    labelFormula: `\\text{边长 }\\color{${MATH_COLORS.paramTertiary}}{c}`,
    group: "角与邻边底模",
    defaultValue: 6,
    min: 1,
    max: 10,
    step: 0.1,
    description: "顶点 C 的对边 AB 长度",
    descriptionFormula: "c = |AB|",
    importance: "advanced",
  },
  a: {
    key: "a",
    label: "对边 a (BC)",
    labelFormula: `\\text{对边 }\\color{${MATH_COLORS.paramPrimary}}{a}`,
    group: "SSA 动圆半径 a",
    defaultValue: 4.5,
    min: 0.5,
    max: 12,
    // 步长取 0.01：SSA 的「相切单解」临界点 a = h = b·sinA 通常不是 0.1 的整数倍
    // （默认 b = 5, A = 60° → h = 4.330127…），步长过粗时读值与实际状态相差可达 0.03。
    step: 0.01,
    description: "SSA 探究中顶点 A 的对边 BC 长度",
    descriptionFormula: "a = |BC|",
    importance: "core",
    marks: buildSideAMarks(5, 60),
  },
};
