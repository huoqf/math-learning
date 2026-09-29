/**
 * src/features/derivativeOptimization/scenePalette.ts
 * 导数优化建模（铁皮盒 / 易拉罐 / 经济产量）—— 中屏调色板
 *
 * 本页原先把「数学对象 → 颜色」写了两份：图例写在 Animation、画布写在 Scene。
 * 现统一到本文件，图例由 palette 生成、画布从 palette 取色。
 *
 * 配色依据库内令牌既有语义：
 *  - 目标函数曲线 → functionTransformed（本页的主曲线是「建模后的变换函数」）
 *  - 最优点水平切线 k=0 → tangentLine
 *  - 理论最优点 x* → focusPoint（库内「关注点」令牌）
 *  - 当前可拖拽探究点 P → paramPrimary（由参数直接控制）
 */

import { MATH_COLORS } from "@/theme";
import { buildLegendItems } from "@/components/Math/scenePalette";
import type { ScenePalette } from "@/components/Math/scenePalette";

const OPTIMIZATION: ScenePalette = {
  target: {
    color: MATH_COLORS.functionTransformed,
    kind: "line",
    dash: "solid",
    width: 3,
    label: "目标函数曲线",
  },
  optimalTangent: {
    color: MATH_COLORS.tangentLine,
    kind: "line",
    dash: "dash",
    width: 1.8,
    label: "最优点水平切线 (k=0)",
  },
  optimalPoint: {
    color: MATH_COLORS.paramTertiary,
    kind: "point",
    label: "理论最优点 x*",
    note:
      "原先取 focusPoint，而 focusPoint 与 paramPrimary 同为 #EF4444 —— " +
      "图例里「理论最优点 x*」与「当前探究点 P」两行同色，学生按图例对色必然认错" +
      "（与端点效应页 P₀/T 撞色属同一类缺陷）。改用三号强调色与本页其余对象彻底分开",
  },
  currentPoint: {
    color: MATH_COLORS.paramPrimary,
    kind: "point",
    label: "当前探究点 P",
  },
};

/**
 * 「几何 / 物理建模展开」说明插图的取色（**独立命名空间**）。
 *
 * 与中屏数学对象不同，这张卡片是静态教学插图（三个模型各自一张子图）：
 * 没有图例条目、不参与「图例↔画布同源」契约，但同样是学生可见的配色，
 * 故一并集中到本文件，保证「本页颜色只有一个出处」。
 */
export const OPT_CARD_COLORS = {
  /** 卡片底板填充（浅色半透明） */
  panel: MATH_COLORS.labelText,
  /** 卡片描边 */
  panelEdge: MATH_COLORS.textMuted,
  /** 卡片标题文字 */
  title: MATH_COLORS.axis,
  /** 铁皮盒模型：正方形铁皮（填充 15%） */
  boxSheet: MATH_COLORS.function,
  /** 铁皮盒模型：剪去的四个角（填充 40%） */
  boxCut: MATH_COLORS.paramPrimary,
  /** 白色高对比图元：折叠虚线、反白文字、最优点是白色描边 */
  contrast: MATH_COLORS.white,
  /** 图内反白文字 */
  inkLabel: MATH_COLORS.white,
  /** 图内参数标注（如 x / r 的数值） */
  inkParam: MATH_COLORS.paramPrimary,
  /** 易拉罐模型：上下面（填充 30%） */
  canTop: MATH_COLORS.derivative,
  /** 易拉罐模型：侧面（填充 20%） */
  canSide: MATH_COLORS.functionTransformed,
  /** 经济模型：总收益行 */
  profitRevenue: MATH_COLORS.white,
  /** 经济模型：总成本行 */
  profitCost: MATH_COLORS.textMuted,
  /** 经济模型：边际利润结论行 */
  profitMargin: MATH_COLORS.focusPoint,
} as const;

/** 本页配色不随 `modelType` 变化，故只有一个调色板 */
export function getOptimizationPalette(): ScenePalette {
  return OPTIMIZATION;
}

/** 图例（由 palette 生成，颜色与线型与画布天然同源） */
export function getOptimizationLegendItems() {
  return buildLegendItems(OPTIMIZATION);
}
