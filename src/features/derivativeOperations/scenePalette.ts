/**
 * src/features/derivativeOperations/scenePalette.ts
 * 导数四则运算法则（和 / 积 / 商）—— 中屏调色板（图例与画布的唯一颜色 / 线型来源）
 *
 * 本页原先把「数学对象 → 颜色」写了两份：图例写在 Animation、画布写在 Scene。
 * 现统一到本文件，图例由 palette 生成、画布从 palette 取色。
 *
 * 配色依据库内令牌既有语义：
 *  - 两个对照基函数 f(x)=x / g(x)=sin x → function / derivative，画布整体降到 70% 弱化
 *  - 运算结果曲线 H(x) 是「变换后函数」→ functionTransformed
 *  - 运算切线 → tangentLine；核心动点 H 落在结果曲线上 → 与曲线同色同族
 */

import { MATH_COLORS } from "@/theme";
import { buildLegendItems } from "@/components/Math/scenePalette";
import type { ScenePalette } from "@/components/Math/scenePalette";

const OPERATIONS: ScenePalette = {
  f: {
    color: MATH_COLORS.function,
    kind: "line",
    dash: "dash",
    width: 1.8,
    label: "基函数 $f(x)=x$",
    note: "对照基函数，画布在 <g> 上整体降到 70% 透明度弱化",
  },
  g: {
    color: MATH_COLORS.derivative,
    kind: "line",
    dash: "dash",
    width: 1.8,
    label: "基函数 $g(x)=\\sin x$",
    note: "对照基函数，画布在 <g> 上整体降到 70% 透明度弱化",
  },
  h: {
    color: MATH_COLORS.functionTransformed,
    kind: "line",
    dash: "solid",
    width: 3,
    label: "运算结果曲线 $H(x)$",
  },
  tangent: {
    color: MATH_COLORS.tangentLine,
    kind: "line",
    dash: "solid",
    width: 2.2,
    label: "瞬时切线 $H'(x_0)$",
  },
  pointH: {
    color: MATH_COLORS.functionTransformed,
    kind: "point",
    note: "核心动点 H 落在运算结果曲线上，与曲线同色同族（库内既有口径：曲线与其上的点同色）；画布自带 $H(\\cdot,\\cdot)$ 点标，不单列",
  },
};

/**
 * 「积法则微元几何分解」说明插图的取色（**独立命名空间**）。
 *
 * 与该模式的中屏数学对象不同，这张卡片是静态教学插图：没有图例条目、
 * 也不参与「图例↔画布同源」契约。但它同样是本页学生可见的配色，
 * 故一并集中到本文件，保证「本页颜色只有一个出处」。
 */
export const OPS_CARD_COLORS = {
  /** 卡片底板填充（浅色半透明） */
  panel: MATH_COLORS.labelText,
  /** 卡片描边 */
  panelEdge: MATH_COLORS.textMuted,
  /** 卡片标题文字 */
  title: MATH_COLORS.axis,
  /** 主部 u·v 矩形：填充 20% + 描边，与基函数 f 同色 */
  main: MATH_COLORS.function,
  /** 主部矩形内的反白文字 */
  mainLabel: MATH_COLORS.white,
  /** 增量 u·Δv 矩形 */
  incUdV: MATH_COLORS.paramPrimary,
  /** 增量 v·Δu 矩形 */
  incVDu: MATH_COLORS.paramSecondary,
  /** 高阶小项 Δu·Δv 矩形填充（40%） */
  higher: MATH_COLORS.textMuted,
  /** 高阶小项矩形的虚线描边，取「结构线」令牌与填充分工 */
  higherEdge: MATH_COLORS.axis,
  /** 卡片脚注「两主项构成导数核心」文字 */
  footnote: MATH_COLORS.deltaHighlight,
} as const;

/** 本页配色不随 `opType` 变化，故只有一个调色板 */
export function getOperationsPalette(): ScenePalette {
  return OPERATIONS;
}

/** 图例（由 palette 生成，颜色与线型与画布天然同源） */
export function getOperationsLegendItems() {
  return buildLegendItems(OPERATIONS);
}
