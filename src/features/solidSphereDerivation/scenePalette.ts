/**
 * src/features/solidSphereDerivation/scenePalette.ts
 * 祖暅原理与球公式推导实验室 —— 中屏调色板（图例与画布的**唯一**颜色来源）
 *
 * 为什么必须单独一份：图例原先写在 `SphereDerivationAnimation.tsx`、几何色写在
 * `SphereDerivationScene.tsx`，两处各写一遍 `colorKey` 必然漂移。本页历史上就漂移出了两个真缺陷：
 *   1. 图例第 4 项声明的 `accent` 与 `paramSecondary` 在 `src/theme/math/colors.ts` 里**取值完全相同**
 *      （都是 #D97706），且画布上根本没有用它上色的几何体 —— 学生按图例对色必然认错；
 *   2. 微锥模式下「球半径」与「微锥侧棱」两条图例同为 `paramPrimary`，色条一模一样、无法区分。
 *
 * 因此约定（与 `derivativeShift/scenePalette.ts` 同款纪律）：
 *  - Scene 只能经 `pickColor(mode, key)` 取色，不得再出现字面颜色或临时 token；
 *    键名写错会**编译期报错**（keyof 泛型约束），不再靠人眼维持一致；
 *  - 图例由 `buildSphereDerivationLegend(mode)` 从本文件生成，不再手写第二份；
 *  - **不单列进图例的对象（体色、辅助平面、中性线）必须写明理由**，
 *    杜绝「画布上有、图例里没有」的静默遗漏。
 *
 * 配色按库内令牌既有语义逐项落定（src/theme/math/colors.ts）：
 *  - 公共半径 R / 球半径 → paramPrimary 红（几何体的主控长度量）
 *  - 切片高度 h / 微锥侧棱 → paramSecondary 橙（第二参数）
 *  - 半球截面半径 r_半 → paramTertiary 绿（第三参数）
 *  - 等高截面 S(h) 与微锥底面 ΔS 都属「截面/面片」语义 → sectionFill 琥珀金（令牌注释原文即"截面多边形主填色"），
 *    轮廓 → sectionOutline 深琥珀棕
 *  - 公共水平切板是辅助平面 → sectionPlane 冰紫天蓝（令牌注释原文即"3D 截面辅助延伸平面专用"）
 */

import { MATH_COLORS, type MathColorKey } from "@/theme";
import type { LegendItem } from "@/components/Math3D";

export type SphereDerivationMode = "zuxuan" | "micropyramid";

export interface SphereDerivationColorSpec {
  /** 该数学对象在中屏的取色（唯一来源） */
  colorKey: MathColorKey;
  /** 图例条目；`undefined` 表示该对象不单列进图例（理由见上方注释） */
  legend?: Omit<LegendItem, "colorKey">;
}

export type SphereDerivationPalette = Record<string, SphereDerivationColorSpec>;

const ZUXUAN_PALETTE = {
  /** 公共半径 R：半球/圆柱的半径线段、勾股斜边 O₁P₁、切点 Q₁ */
  radius: {
    colorKey: "paramPrimary",
    legend: { swatch: "line", label: "公共半径 R" },
  },
  /** 切片高度 h：高度线段、截面中心 O'、等高连线 */
  height: {
    colorKey: "paramSecondary",
    legend: { swatch: "line", label: "切片高度 h" },
  },
  /**
   * 半球截面半径 r_半：勾股直角边 O'₁P₁、切点 P₁。
   * ⚠️ 仅限**半球侧的 r_半**。倒圆锥截面母线（O₂→Q₂，长 √2·h）
   * 曾误用本键 ⇒ 学生按图例把母线读成 r_半 = √(R²−h²)，属色彩语义串扰；
   * 该母线已归入 `muted` 中性轮廓线。
   */
  cutRadius: {
    colorKey: "paramTertiary",
    legend: { swatch: "line", tex: "r_{\\text{半}}" },
  },
  /** 等高截面 S(h)：半球截面圆盘与挖锥柱体截面圆环（同面积、同色，便于直接比对） */
  equalSection: {
    colorKey: "sectionFill",
    legend: { swatch: "area", label: "等面积截面 S(h)" },
  },
  /** 截面轮廓线：与截面同族，不单列图例 */
  equalSectionOutline: { colorKey: "sectionOutline" },
  /** 公共水平切板：辅助平面（延伸矩形玻璃板），不单列图例 */
  sectionPlane: { colorKey: "sectionPlane" },
  /**
   * 「被挖去的倒圆锥」：体积相减阶段的视觉主角。
   * 用库内 degeneracy（退化/空集警示色）表达"这一块是要被扣掉的"，
   * 属教学语义高亮而非独立数学对象，故不单列图例。
   */
  removedCone: { colorKey: "degeneracy" },
  /** 半球体色：体本身不是待比较的量，不单列图例 */
  hemisphereBody: { colorKey: "primary" },
  /** 挖锥圆柱体色：同上，不单列图例 */
  cylinderBody: { colorKey: "secondary" },
  /** 公共基准板 / 轴线 / 倒圆锥挖空轮廓：中性辅助，不单列图例 */
  muted: { colorKey: "textMuted" },
} satisfies SphereDerivationPalette;

const MICROPYRAMID_PALETTE = {
  /** 球半径（即微锥高的逼近目标）：球表皮、经纬线框、高线、微锥侧面 */
  radius: {
    colorKey: "paramPrimary",
    legend: { swatch: "line", label: "球半径 (微锥高) R" },
  },
  /** 微锥底面 ΔS_i：面片语义 → 与截面同用琥珀金 */
  microBase: {
    colorKey: "sectionFill",
    legend: { swatch: "area", label: "微底面 ΔS" },
  },
  /** 微锥侧棱：必须与「球半径」异色，否则图例两条色条相同、无法区分 */
  microEdge: {
    colorKey: "paramSecondary",
    legend: { swatch: "line", label: "微锥侧棱" },
  },
  /** 球面底座印记 / 原位骨架 / 球心特征点：中性辅助，不单列图例 */
  muted: { colorKey: "textMuted" },
} satisfies SphereDerivationPalette;

export const SPHERE_DERIVATION_PALETTES = {
  zuxuan: ZUXUAN_PALETTE,
  micropyramid: MICROPYRAMID_PALETTE,
};

/**
 * 唯一取「令牌名」入口。键名受 `keyof` 约束 ⇒ 写错键名编译期即报错，
 * 不会退化成 `undefined` 在运行时把几何体染黑。
 * 供 `Segment3D / Point3D / RightTriangle3D / Legend3D` 这类以 `colorKey` 传色的组件使用。
 *
 * 注：函数体内部把调色板收敛到统一的 `SphereDerivationPalette` 再索引 ——
 * 这是泛型索引访问 `T[M][K]` 在「异质对象联合」上的 TS 限制，不影响对外层的键名约束。
 */
export const pickColorKey = <
  M extends SphereDerivationMode,
  K extends keyof (typeof SPHERE_DERIVATION_PALETTES)[M],
>(
  mode: M,
  key: K,
): MathColorKey => {
  const palette: SphereDerivationPalette = SPHERE_DERIVATION_PALETTES[mode];
  return palette[key as string].colorKey;
};

/** 唯一取「色值」入口。供 `meshStandardMaterial` / `lineBasicMaterial` 等直接吃色值的 props 使用。 */
export const pickColor = <
  M extends SphereDerivationMode,
  K extends keyof (typeof SPHERE_DERIVATION_PALETTES)[M],
>(
  mode: M,
  key: K,
): string => MATH_COLORS[pickColorKey(mode, key)];

const toLegendItems = (palette: SphereDerivationPalette): LegendItem[] =>
  Object.entries(palette)
    .filter(([, spec]) => Boolean(spec.legend))
    .map(([, spec]) => ({ colorKey: spec.colorKey, ...spec.legend }));

/** 由调色板生成图例 —— 图例与画布同源，结构上不可能再漂移 */
export const buildSphereDerivationLegend = (
  mode: SphereDerivationMode,
): LegendItem[] =>
  mode === "zuxuan"
    ? toLegendItems(ZUXUAN_PALETTE)
    : toLegendItems(MICROPYRAMID_PALETTE);
