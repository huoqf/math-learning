/**
 * src/features/derivativeChain/scenePalette.ts
 * 简单复合函数求导 —— 中屏调色板（图例与画布的唯一颜色 / 线型来源）
 *
 * 本页原先把「数学对象 → 颜色」写了三份：图例写在 Animation、画布写在 Scene、
 * 线型（如切线的 `5 3` 虚线）又在画布里再写一次。三处没有任何机制保证一致，
 * 属「图例说 A、画布画 B」的结构性隐患。现统一到本文件。
 *
 * 配色依据库内令牌既有语义：
 *  - 外层基函数 f(x) 是参照底图，不是本模式的主角 → textMuted 弱化
 *  - 复合函数 f(ax+b) 是「变换后函数」→ functionTransformed
 *  - 瞬时切线 → tangentLine；切点 P 由参数 x₀ 控制 → paramPrimary
 */

import { MATH_COLORS } from "@/theme";
import { buildLegendItems } from "@/components/Math/scenePalette";
import type { ScenePalette } from "@/components/Math/scenePalette";

const CHAIN: ScenePalette = {
  outerFn: {
    color: MATH_COLORS.textMuted,
    kind: "line",
    dash: "dash",
    width: 1.5,
    label: "外层基函数 $f(x)$",
    note: "参照底图，画布在 <g> 上整体降到 35% 透明度弱化，避免与复合曲线争夺注意力",
  },
  combinedFn: {
    color: MATH_COLORS.functionTransformed,
    kind: "line",
    dash: "solid",
    width: 3,
    label: "复合函数 $y = f(ax+b)$",
  },
  tangent: {
    color: MATH_COLORS.tangentLine,
    kind: "line",
    dash: "dash",
    width: 2,
    label: "瞬时切线",
  },
  pointP: {
    color: MATH_COLORS.paramPrimary,
    kind: "point",
    label: "切点 $P(x_0, y_0)$",
  },
};

/** 本页为单模式页（`outerType` 只切换解析式，不改配色），故只有一个调色板 */
export function getChainPalette(): ScenePalette {
  return CHAIN;
}

/** 图例（由 palette 生成，颜色与线型与画布天然同源） */
export function getChainLegendItems() {
  return buildLegendItems(CHAIN);
}
