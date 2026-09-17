/**
 * src/features/derivativeShift/scenePalette.ts
 * 极值点偏移与隐零点实验室 —— 中屏调色板（图例与画布的唯一颜色 / 线型来源）
 *
 * 每个模式一张表，键 = 数学对象，值 = 颜色 + 线型（+ 图例文案）。
 * 图例由 buildLegendItems(palette) 生成，画布从 palette 取色取线型，
 * 两侧不再各写一份，因此不可能再出现「图例说橙、画布画蓝」。
 *
 * 配色依据库内令牌既有语义（src/theme/math/colors.ts）逐项落定：
 *  - 对称曲线是「变换后函数 f(2x₀−x)」→ functionTransformed 粉（令牌注释原文即此义）
 *  - 导函数曲线与导数零点同属导数族 → derivative 橙
 *  - 消元轨迹曲线与其上的轨迹点同族 → trace 紫
 *  - 切点 T 与平行切线同族 → tangentLine 红
 */

import { MATH_COLORS } from "@/theme";
import { buildLegendItems } from "@/components/Math/scenePalette";
import type { ScenePalette } from "@/components/Math/scenePalette";
import type { ShiftMode, ShiftSubModel } from "./constants";

const ctxOf = (subModel: string) => ({ subModel });

/* ------------------------------------------------------------------ *
 * 模式一：隐零点设而不求与极值消元
 * ------------------------------------------------------------------ */
const IMPLICIT_ZERO: ScenePalette = {
  fn: {
    color: MATH_COLORS.function,
    kind: "line",
    dash: "solid",
    width: 2.5,
    label: "原函数",
    formula: (c) =>
      c.subModel === "x_ln_x"
        ? "f(x) = x\\ln x + \\frac{1}{2}x^2 - ax"
        : "f(x) = e^x - \\frac{1}{2}x^2 - ax",
  },
  dfn: {
    color: MATH_COLORS.derivative,
    kind: "line",
    dash: "dash",
    width: 1.8,
    label: "导函数",
    formula: (c) =>
      c.subModel === "x_ln_x"
        ? "f'(x) = \\ln x + x + 1 - a"
        : "f'(x) = e^x - x - a",
  },
  trace: {
    color: MATH_COLORS.trace,
    kind: "line",
    dash: "dash",
    width: 2,
    label: "消元轨迹",
    formula: (c) =>
      c.subModel === "x_ln_x"
        ? "h(x) = -\\frac{1}{2}x^2 - x"
        : "h(x) = e^x(1 - x) + \\frac{1}{2}x^2",
  },
  extremumPt: {
    color: MATH_COLORS.paramPrimary,
    kind: "point",
    label: "极值消元点",
    formula: "P(x_0, f(x_0))",
  },
  zeroPt: {
    color: MATH_COLORS.derivative,
    kind: "hollow-point",
    label: "导数零点",
    formula: "x_0",
  },
  x0Guide: {
    color: MATH_COLORS.paramPrimary,
    kind: "line",
    dash: "dash",
    width: 1.5,
    note: "x = x₀ 隐零点竖线是 P 到 x 轴的几何投影，与 P 同色同族，画布自带文字标注，不单列",
  },
  tracePt: {
    color: MATH_COLORS.trace,
    kind: "point",
    note: "消元轨迹点 (x₀, h(x₀)) 落在消元轨迹曲线上，与其同色同族，不单列",
  },
};

/* ------------------------------------------------------------------ *
 * 模式二：极值点偏移与对称构造法
 * ------------------------------------------------------------------ */
const SHIFT_SYMMETRIC: ScenePalette = {
  fn: {
    color: MATH_COLORS.function,
    kind: "line",
    dash: "solid",
    width: 2.5,
    label: "原函数",
    formula: (c) =>
      c.subModel === "xe_neg_x" ? "f(x) = xe^{-x}" : "f(x) = \\frac{\\ln x}{x}",
  },
  mirrorFn: {
    color: MATH_COLORS.functionTransformed,
    kind: "line",
    dash: "dash",
    width: 2,
    label: "对称曲线",
    formula: "y = f(2x_0 - x)",
    note: "「变换后函数」令牌的既有语义即此对象（强对比粉红）",
  },
  secant: {
    color: MATH_COLORS.secantLine,
    kind: "line",
    dash: "dash",
    width: 1.5,
    label: "水平割线",
    formula: "y = k",
  },
  p1: {
    color: MATH_COLORS.function,
    kind: "point",
    label: "割线左交点",
    formula: "P_1(x_1, k)",
    note: "P₁ 就是原函数与割线的交点，故与原函数同色",
  },
  p2: {
    color: MATH_COLORS.functionSecondary,
    kind: "point",
    label: "割线右交点",
    formula: "P_2(x_2, k)",
  },
  mirrorPt: {
    color: MATH_COLORS.functionTransformed,
    kind: "hollow-point",
    label: "对称构造点",
    formula: "P'_1(2x_0 - x_1, k)",
    note: "P'₁ 落在对称曲线上，故与其同色；空心点形态区分于点本身",
  },
  midPt: {
    color: MATH_COLORS.paramSecondary,
    kind: "point",
    label: "弦中点",
    formula: "M\\left(\\frac{x_1+x_2}{2}, k\\right)",
  },
  diffSeg: {
    color: MATH_COLORS.paramTertiary,
    kind: "line",
    dash: "dash",
    width: 1.8,
    label: "差值",
    formula: "F(x_1) = f(x_1) - f(2x_0 - x_1)",
  },
  offsetZone: {
    color: MATH_COLORS.paramTertiary,
    kind: "area",
    note: "偏移区间 [x₀, M] 的高亮阴影，与差值线段同色同族（都在说明「偏移了多少」），不单列",
  },
  axis: {
    color: MATH_COLORS.paramPrimary,
    kind: "line",
    dash: "dash",
    width: 1.5,
    note: "对称轴 x = x₀ 在画布上自带「对称轴 x = x₀」文字标注，不单列",
  },
  secantHandle: {
    color: MATH_COLORS.secantLine,
    kind: "point",
    note: "水平割线上的可拖拽控制点（拖动改变 k），与割线同色同族，不单列",
  },
};

/* ------------------------------------------------------------------ *
 * 模式三：对数均值不等式与齐次化
 * ------------------------------------------------------------------ */
const LOG_MEAN: ScenePalette = {
  ln: {
    color: MATH_COLORS.function,
    kind: "line",
    dash: "solid",
    width: 2.5,
    label: "对数曲线",
    formula: "f(x) = \\ln x",
  },
  secant: {
    color: MATH_COLORS.secantLine,
    kind: "line",
    dash: "dash",
    width: 1.8,
    label: "割线",
    formula: "P_1P_2",
  },
  tangentLine: {
    color: MATH_COLORS.tangentLine,
    kind: "line",
    dash: "solid",
    width: 2,
    label: "平行切线",
    formula: "y = \\frac{x}{L} + \\ln L - 1",
  },
  tangentPt: {
    color: MATH_COLORS.tangentLine,
    kind: "point",
    label: "切点",
    formula: "T(L, \\ln L)",
    note: "T 是平行切线在曲线上的切点，与其同色同族",
  },
  geoMean: {
    color: MATH_COLORS.paramTertiary,
    kind: "point",
    label: "几何均值",
    formula: "G = \\sqrt{x_1 x_2}",
    note: "三大均值须三色互斥：G 绿 / L 红 / A 橙，改画布对齐图例（原画布误用原函数蓝）",
  },
  logMean: {
    color: MATH_COLORS.paramPrimary,
    kind: "point",
    label: "对数均值",
    formula: "L = L(x_1, x_2)",
  },
  ariMean: {
    color: MATH_COLORS.paramSecondary,
    kind: "point",
    label: "算术均值",
    formula: "A = \\frac{x_1 + x_2}{2}",
  },
  tangentFoot: {
    color: MATH_COLORS.paramPrimary,
    kind: "line",
    dash: "dash",
    width: 1.5,
    note: "切点到 x 轴的垂足线是 L 的位置指示，与 L 同色同族，不单列",
  },
  p1: {
    color: MATH_COLORS.function,
    kind: "point",
    note: "可拖拽端点 x₁（画布自带 P₁ 标注），在曲线上故与原函数同色，不单列",
  },
  p2: {
    color: MATH_COLORS.functionSecondary,
    kind: "point",
    note: "可拖拽端点 x₂（画布自带 P₂ 标注），不单列",
  },
};

const PALETTES: Record<ShiftMode, ScenePalette> = {
  implicit_zero: IMPLICIT_ZERO,
  shift_symmetric: SHIFT_SYMMETRIC,
  log_mean: LOG_MEAN,
};

/** 取当前模式的调色板。未知模式按首屏默认模式处理（模式集合是封闭枚举） */
export function getShiftPalette(activeMode: string): ScenePalette {
  return PALETTES[activeMode as ShiftMode] ?? IMPLICIT_ZERO;
}

/** 图例（由 palette 生成，颜色与线型与画布天然同源） */
export function getDerivativeShiftLegendItems(
  activeMode: ShiftMode,
  subModel: ShiftSubModel,
) {
  return buildLegendItems(getShiftPalette(activeMode), ctxOf(subModel));
}
