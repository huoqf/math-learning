/**
 * src/features/second-derivative/scenePalette.ts
 * 二阶导数 · 拐点 · 琴生不等式 —— 中屏调色板（图例与画布的唯一颜色 / 线型来源）
 *
 * 本页原先「图例一份、画布一份」，两侧各自漂移，实证出三类缺陷：
 *  1. **色相不一致**（本页最重的一处，P1-F）：图例把「切线在下方区间 f''>0」记为
 *     `paramTertiary`、「切线在上方区间 f''<0」记为 `paramSecondary`，而画布实际用的是
 *     `function`（蓝）与 `paramPrimary`（红），且叠加 6% alpha —— 学生按图例对色必然认错；
 *  2. **同色撞车**：琴生模式下「弧中点 P」与「割线右端点 S₂」同为 `paramTertiary`，
 *     两个不同的点对象同色；同时 S₁ / S₂ 是一对对称的可拖拽端点，却被画成两种颜色；
 *  3. **面积填充过淡**：区块用 6% alpha，几乎不可见（报告 §五.7）。
 * 现由本文件统一裁定：颜色取自库内令牌既有语义，图例由 palette 生成，画布从 palette 取用。
 *
 * ⚠ 面积类条目的 `color` 必须是**裸十六进制令牌**，不能预先调淡：
 *   `SceneLegend` 的 `area` 色块是按 `${color}33`（≈20%）自叠加透明度的，
 *   若这里传 `rgba(...)` 会拼出非法 CSS 而让色块失效。
 *   画布填充则在调用点用 `withAlpha(entry.color, AREA_FILL_ALPHA)` 调淡 ——
 *   色块只有 14×10px、填充区动辄数百像素宽，同一 alpha 下二者的可辨度并不等价。
 */

import { MATH_COLORS } from "@/theme";
import { buildLegendItems } from "@/components/Math/scenePalette";
import type {
  PaletteEntry,
  ScenePalette,
} from "@/components/Math/scenePalette";

export type SecondDerivativeMode = "concavity" | "inflection" | "jensen";

/**
 * 画布上 f'' 符号分区填充的透明度。
 * 原值 0.06 在白色画布上几乎不可见（报告 §五.7）；0.12 在「可辨」与「不喧宾夺主」之间取值。
 */
export const AREA_FILL_ALPHA = 0.12;

/**
 * f''(x) 曲线（凹凸性与拐点两个模式的判定主体）在 CONCAVITY / INFLECTION 之间共用同一取值。
 *
 * 为什么取 functionSecondary（紫）而不能沿用库内的 derivative（#D97706 暖橙）：
 * derivative 与 paramSecondary 同值，而 paramSecondary 在本页两个模式里都已被占用
 * （concavity 模式是「切线在上方区间」的区块填色，inflection 模式是极值点），
 * 同屏出现一条橙线 + 一片橙区块 / 一排橙点，按图例对色必然认错。
 * functionSecondary 在 concavity / inflection 两个模式下均无既有占用，且语义上
 * 正是「由原函数派生出的对比曲线」，与本页「拿 f'' 对照 f」的教学动作一致。
 *
 * 画布附加说明（不单列进图例的部分）：f'' 与 x 轴的交点（即 f'' 的零点）用同色空心点标注，
 * 它属于 f'' 这一对象的组成部分而非独立图元，故并入本条目不另列。
 */
const FPP_ENTRY: PaletteEntry = {
  color: MATH_COLORS.functionSecondary,
  kind: "line",
  dash: "dash",
  width: 1.8,
  label: "二阶导数",
  formula: "f''(x)",
};

/* ------------------------------------------------------------------ *
 * 模式一：凹凸性与切线（f'' 符号分区 + 探针切线）
 * ------------------------------------------------------------------ */
const CONCAVITY: ScenePalette = {
  fn: {
    color: MATH_COLORS.function,
    kind: "line",
    dash: "solid",
    width: 2.8,
    label: "原函数",
    formula: "f(x)",
  },
  fpp: { ...FPP_ENTRY },
  tangent: {
    color: MATH_COLORS.tangentLine,
    kind: "line",
    dash: "solid",
    width: 2,
    label: "切线",
    formula: "y = f'(x_0)(x - x_0) + f(x_0)",
  },
  probe: {
    color: MATH_COLORS.paramPrimary,
    kind: "point",
    label: "探针切点",
    formula: "P_0(x_0, f(x_0))",
    note:
      "探针切点由参数 x₀ 直接控制（可拖拽），故取「参数主色」paramPrimary；" +
      "图例原先记为 focusPoint，与画布不一致，现统一到画布语义",
  },
  zoneConvex: {
    color: MATH_COLORS.paramTertiary,
    kind: "area",
    label: "切线在下方区间",
    formula: "f''(x) > 0",
    note: `画布填充用 withAlpha(color, ${AREA_FILL_ALPHA})；色块由 SceneLegend 自叠加透明度`,
  },
  zoneConcave: {
    color: MATH_COLORS.paramSecondary,
    kind: "area",
    label: "切线在上方区间",
    formula: "f''(x) < 0",
    note: `画布填充用 withAlpha(color, ${AREA_FILL_ALPHA})；色块由 SceneLegend 自叠加透明度`,
  },
};

/* ------------------------------------------------------------------ *
 * 模式二：拐点与极值点
 * ------------------------------------------------------------------ */
const INFLECTION: ScenePalette = {
  fn: {
    color: MATH_COLORS.function,
    kind: "line",
    dash: "solid",
    width: 2.8,
    label: "原函数",
    formula: "f(x)",
  },
  fpp: { ...FPP_ENTRY },
  inflection: {
    color: MATH_COLORS.vectorResult,
    kind: "point",
    label: "拐点",
    formula: "I(x_{\\text{inf}}, y_{\\text{inf}})",
  },
  inflectTangent: {
    color: MATH_COLORS.vectorResult,
    kind: "line",
    dash: "dash",
    width: 1.5,
    note: "拐点切线是拐点处的几何指示，与拐点同色同族；画布已标注 I，不单列",
  },
  extrema: {
    color: MATH_COLORS.paramSecondary,
    kind: "point",
    label: "极值点",
    formula: "E(x_{\\text{ext}}, y_{\\text{ext}})",
  },
};

/* ------------------------------------------------------------------ *
 * 模式三：琴生不等式（弦 / 弧中点与割线端点）
 * ------------------------------------------------------------------ */
const JENSEN: ScenePalette = {
  fn: {
    color: MATH_COLORS.function,
    kind: "line",
    dash: "solid",
    width: 2.8,
    label: "原函数",
    formula: "f(x)",
  },
  chord: {
    color: MATH_COLORS.paramSecondary,
    kind: "line",
    dash: "solid",
    width: 2.5,
    label: "割线段",
    formula: "S_1S_2",
  },
  chordMid: {
    color: MATH_COLORS.paramSecondary,
    kind: "point",
    label: "弦中点",
    formula: "M",
    note: "弦中点落在割线段上，与割线同色同族",
  },
  curveMid: {
    color: MATH_COLORS.paramTertiary,
    kind: "point",
    label: "弧中点",
    formula: "P",
    note: "弧中点落在曲线上、与弦中点不同族；原先它与割线右端点 S₂ 同为 paramTertiary，两个点对象撞色",
  },
  connector: {
    color: MATH_COLORS.vectorResult,
    kind: "line",
    dash: "dash",
    width: 2,
    note: "弦中点到弧中点的竖直连线是「弦弧差」的量度，画布自带 M / P 点标，不单列",
  },
  probeS1: {
    color: MATH_COLORS.function,
    kind: "point",
    note: "割线左端点 S₁ 是可拖拽探针，且落在原函数曲线上，故与原函数同色（同极值点偏移页 P₁ 的口径）",
  },
  probeS2: {
    color: MATH_COLORS.functionSecondary,
    kind: "point",
    note:
      "割线右端点 S₂ 是可拖拽探针，取「次对比函数」紫与 S₁ 明确分开；" +
      "原先 S₁ 用 paramSecondary、S₂ 用 paramTertiary，一对对称端点却配色不对称",
  },
};

const PALETTES: Record<SecondDerivativeMode, ScenePalette> = {
  concavity: CONCAVITY,
  inflection: INFLECTION,
  jensen: JENSEN,
};

/** 取当前模式的调色板。未知模式按首屏默认模式处理（模式集合是封闭枚举） */
export function getSecondDerivativePalette(mode: string): ScenePalette {
  return PALETTES[mode as SecondDerivativeMode] ?? CONCAVITY;
}

/** 图例（由 palette 生成，颜色与线型与画布天然同源） */
export function getSecondDerivativeLegendItems(mode: SecondDerivativeMode) {
  return buildLegendItems(getSecondDerivativePalette(mode));
}
