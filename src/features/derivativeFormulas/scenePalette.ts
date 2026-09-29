/**
 * src/features/derivativeFormulas/scenePalette.ts
 * 导数公式表与定义式（平均变化率 → 瞬时变化率）—— 中屏调色板
 *
 * 本页原先把「数学对象 → 颜色」写了两份：图例写在 Animation、画布写在 Scene。
 * 现统一到本文件，图例由 palette 生成、画布从 palette 取色。
 *
 * 配色依据库内令牌既有语义：
 *  - 原函数 f(x) → function；导函数 f'(x) → derivative（库内导数族专用令牌）
 *  - 瞬时切线 PT → tangentLine；割线 PQ 与其 Δx/Δy 变化三角形同族 → secantLine
 *  - 切点 P 由参数 x₀ 直接控制（可拖拽）→ paramPrimary；割点 Q → paramSecondary
 *
 * ⚠ 导函数曲线是**可开关图层**：未勾选「显示导函数」时画布不绘制它，
 *   图例也必须同步不列出（否则图例会指向一条画布上不存在的曲线）。
 *   故图例走带 ctx 的 `getFormulasLegendItems`，而不是无参 `buildLegendItems`。
 */

import { MATH_COLORS } from "@/theme";
import { buildLegendItems } from "@/components/Math/scenePalette";
import type { ScenePalette } from "@/components/Math/scenePalette";

const FORMULAS: ScenePalette = {
  fn: {
    color: MATH_COLORS.function,
    kind: "line",
    dash: "solid",
    width: 3,
    label: "原函数 $f(x)$",
  },
  derivFn: {
    color: MATH_COLORS.derivative,
    kind: "line",
    dash: "dash",
    width: 2,
    label: "导函数 $f'(x)$",
    note: "可开关图层：仅在勾选「显示导函数」时绘制并列入图例",
  },
  tangent: {
    color: MATH_COLORS.tangentLine,
    kind: "line",
    dash: "solid",
    width: 2.5,
    label: "瞬时切线 $PT$ (斜率 $f'(x_0)$)",
  },
  secant: {
    color: MATH_COLORS.secantLine,
    kind: "line",
    dash: "dash",
    width: 2,
    label: "割线 $PQ$ (斜率 $\\frac{\\Delta y}{\\Delta x}$)",
  },
  deltaTriangle: {
    color: MATH_COLORS.secantLine,
    kind: "area",
    note: "Δx / Δy 变化三角形是割线斜率的几何解释，与割线同色同族（画布用 10% 填充 + 50% 描边两级 alpha），不单列",
  },
  pointP: {
    color: MATH_COLORS.paramPrimary,
    kind: "point",
    note: "切点 P 由参数 x₀ 控制、可拖拽，画布自带 $P(\\cdot,\\cdot)$ 坐标点标，不单列",
  },
  pointQ: {
    color: MATH_COLORS.paramSecondary,
    kind: "point",
    note: "割点 Q 画布自带 $Q(\\cdot,\\cdot)$ 坐标点标，不单列",
  },
};

/** 本页配色不随 `funcType` 变化，故只有一个调色板 */
export function getFormulasPalette(): ScenePalette {
  return FORMULAS;
}

/**
 * 图例：颜色与线型与画布同源。
 * `showDerivativeGraph === false` 时剔除导函数条目 —— 图例绝不指向未绘制的曲线。
 */
export function getFormulasLegendItems(ctx: { showDerivativeGraph: boolean }) {
  const entries: ScenePalette = { ...FORMULAS };
  if (!ctx.showDerivativeGraph) delete entries.derivFn;
  return buildLegendItems(entries);
}
