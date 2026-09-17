/**
 * src/components/Math/scenePalette.ts
 * 中屏场景调色板 (ScenePalette) —— 图例与画布的唯一颜色 / 线型来源
 *
 * 背景（为什么需要它）
 * --------------------
 * 多模型页过去把「数学对象 → 颜色」写了两份：图例一份（写在 features/xxx/constants.ts），
 * 画布一份（硬编码在 components/XxxScene.tsx）。两侧没有任何机制保证一致，
 * 于是出现「图例说橙、画布画蓝」——学生按图例对色必然认错对象。
 *
 * 现规定（本文件是这条规范的执行者）
 * --------------------------------
 * 1. 每个页面的「数学对象 → 颜色 + 线型 + 线宽」只允许写在该页的 scenePalette.ts 里；
 * 2. 图例由 palette 生成（buildLegendItems），画布从 palette 取色（entry.color / dashArrayOf / width）；
 * 3. 场景文件里不再允许出现直接的取色表达式（由 scenePalette.contract.test.ts 静态守卫）；
 * 4. 不单列进图例的对象必须在 note 里写明原因（例如「与某某同色同族」），
 *    避免「画布上有、图例里没有」的静默遗漏。
 *
 * 注意：本文件只描述「颜色与线型」，不描述数学。数学对象的坐标解算仍在各页 math/*.ts。
 */

import type { SceneLegendItem } from "./SceneLegend";

/** 图元形态：线 / 实心点 / 空心点 / 面积填充 */
export type PaletteKind = "line" | "point" | "hollow-point" | "area";

/** 线的虚线口径（与图例色块的三种线型一一对应） */
export type PaletteDash = "solid" | "dash" | "dot";

/** 供 label / formula 动态求值的上下文（各页自行约定字段名） */
export type PaletteContext = Record<string, string | number | undefined>;

export interface PaletteEntry {
  /** 该数学对象的唯一颜色来源 */
  color: string;
  /** 图元形态 */
  kind: PaletteKind;
  /** 虚线口径，仅 kind === "line" 有意义 */
  dash?: PaletteDash;
  /** 线宽，仅 kind === "line" 有意义 */
  width?: number;
  /** 图例文案（支持 $...$ 行内公式混排）；缺省表示该对象不单列，此时必须写 note */
  label?: string | ((ctx: PaletteContext) => string);
  /** 图例公式（KaTeX 源码） */
  formula?: string | ((ctx: PaletteContext) => string);
  /** 不单列进图例的原因，或该对象在教学上的补充说明 */
  note?: string;
}

/** 一张 palette = 某模式下「该页有哪些数学对象」的完整清单 */
export type ScenePalette = Record<string, PaletteEntry>;

/** 虚线口径 → SVG strokeDasharray（"dot" 比 "dash" 更密，肉眼可与图例色块对应） */
const DASH_ARRAY: Record<PaletteDash, string | undefined> = {
  solid: undefined,
  dash: "6 4",
  dot: "1.5 3.5",
};

export const dashOf = (entry: PaletteEntry): PaletteDash =>
  entry.dash ?? "solid";

/** 画布取用：传入 FunctionGraph 的 strokeDasharray */
export const dashArrayOf = (entry: PaletteEntry): string | undefined =>
  DASH_ARRAY[dashOf(entry)];

/** 图例取用：传入 SceneLegendItem 的 style */
export const legendStyleOf = (
  entry: PaletteEntry,
): NonNullable<SceneLegendItem["style"]> =>
  entry.kind === "line" ? dashOf(entry) : entry.kind;

const resolveText = (
  value: string | ((ctx: PaletteContext) => string) | undefined,
  ctx: PaletteContext,
): string | undefined => (typeof value === "function" ? value(ctx) : value);

/**
 * 由 palette 生成图例条目。
 * 只有声明了 label 的对象才进图例 —— 因此「图例里有的，palette 里一定有」，
 * 「palette 里有的，要么进图例、要么写了 note」，两侧不可能静默漂移。
 */
export function buildLegendItems(
  palette: ScenePalette,
  ctx: PaletteContext = {},
): SceneLegendItem[] {
  return Object.values(palette)
    .filter((entry) => entry.label !== undefined)
    .map((entry) => ({
      color: entry.color,
      label: resolveText(entry.label, ctx),
      formula: resolveText(entry.formula, ctx),
      style: legendStyleOf(entry),
    }));
}

/**
 * 取「画布上所有出现过的颜色」，供契约测试核对颜色是否撞车。
 */
export function paletteColors(palette: ScenePalette): string[] {
  return Object.values(palette).map((entry) => entry.color);
}
