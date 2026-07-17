/**
 * src/theme/index.ts
 * 主题系统统一导出入口
 */

// ─── UI 语义色 ────────────────────────────────────────────────────────────────
export { colors } from './colors';
export type { ColorScale, PrimaryColor } from './colors';

// ─── 数学语义色 ────────────────────────────────────────────────────────────────
export {
  MATH_COLORS,
  ALGEBRA_COLORS,
  CALCULUS_COLORS,
  GEOMETRY_COLORS,
  PROBABILITY_COLORS,
  CANVAS_COLORS,
  withAlpha,
} from './math/colors';
export type { MathColorKey } from './math/colors';

// ─── 间距 / 布局 ──────────────────────────────────────────────────────────────
export { spacing, LAYOUT, DENSITY, CANVAS_PRESETS } from './spacing';

// ─── 圆角 ─────────────────────────────────────────────────────────────────────
export { radius } from './radius';
export type { RadiusKey } from './radius';

// ─── 阴影 ─────────────────────────────────────────────────────────────────────
export { shadow, glowRing } from './shadow';
export type { ShadowKey } from './shadow';

// ─── 动效 ─────────────────────────────────────────────────────────────────────
export {
  duration,
  easing,
  transition,
  canvasAnimation,
} from './motion';

// ─── 字体缩放 ───────────────────────────────────────────────────────────────
export { identityFontScaler } from './fontScaler';
export type { FontScaler } from './fontScaler';
