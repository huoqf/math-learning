/**
 * src/theme/math/colors.ts
 * 数学对象颜色语义映射 — Canvas / SVG 内唯一颜色来源
 */

export function withAlpha(hex: string, alpha: number): string {
  const clean = hex.replace('#', '');
  if (clean.length === 3) {
    const r = parseInt(clean[0] + clean[0], 16);
    const g = parseInt(clean[1] + clean[1], 16);
    const b = parseInt(clean[2] + clean[2], 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
  if (clean.length === 6) {
    const r = parseInt(clean.substring(0, 2), 16);
    const g = parseInt(clean.substring(2, 4), 16);
    const b = parseInt(clean.substring(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
  return hex;
}

// ─── 代数与分析 (Algebra & Analysis) ──────────────────────────────────────────
export const ALGEBRA_COLORS = {
  sequence:           '#2563EB', // 数列散点 — 经典蓝
  inequality:         '#10B981', // 不等式可行域 — 绿
  complexNum:         '#8B5CF6', // 复数向量 — 紫
} as const;

// ─── 函数与微积分 (Functions & Calculus) ──────────────────────────────────────
export const CALCULUS_COLORS = {
  function:           '#2563EB', // 原函数曲线 f(x) — 经典蓝
  derivative:         '#D97706', // 导函数曲线 f'(x) — 暖橙
  tangentLine:        '#DC2626', // 切线 — 警示红
  secantLine:         '#64748B', // 割线 — 中性灰
  areaFill:           'rgba(37, 99, 235, 0.15)', // 定积分面积填充
  deltaHighlight:     '#93C5FD', // 割线直角三角形 Δx/Δy
} as const;

// ─── 几何 (Geometry) ────────────────────────────────────────────────────────
export const GEOMETRY_COLORS = {
  vectorPrimary:      '#2563EB', // 主向量 a — 经典蓝
  vectorSecondary:    '#10B981', // 辅助向量 b — 绿
  vectorResult:       '#DC2626', // 和向量 c — 亮红
  vectorProjection:   '#8B5CF6', // 投影向量 — 紫
  line:               '#475569', // 直线 — slate-600
  circle:             '#0284C7', // 圆 — sky-600
  ellipse:            '#7C3AED', // 椭圆 — violet-600
  hyperbola:          '#BE185D', // 双曲线 — pink-700
  parabola:           '#D97706', // 抛物线 — amber-600
  asymptote:          '#94A3B8', // 渐近线 — neutral-400
  focusPoint:         '#DC2626', // 焦点 — 亮红
  vertexPoint:        '#1E293B', // 顶点 — neutral-800
} as const;

// ─── 概率与统计 (Probability & Statistics) ──────────────────────────────────
export const PROBABILITY_COLORS = {
  barFill:            '#06B6D4', // 柱状图填充 — cyan-500
  densityCurve:       '#0891B2', // 密度曲线 (正态分布)
} as const;

// ─── 通用 Canvas 元素 (Canvas Commons) ───────────────────────────────────────
export const CANVAS_COLORS = {
  axis:               '#CBD5E1', // 坐标轴、参考线
  grid:               '#E2E8F0', // 网格线
  gridSubtle:         '#F1F5F9', // 浅网格/轻描边
  labelText:          '#1E293B', // 文字标注
  labelTextLight:     '#475569', // 次要文字
  textMuted:          '#64748B', // 禁用/弱化文字
  white:              '#FFFFFF',
} as const;

// ─── 聚合导出 ───────────────────────────────────────────────────────────────
export const MATH_COLORS = {
  ...ALGEBRA_COLORS,
  ...CALCULUS_COLORS,
  ...GEOMETRY_COLORS,
  ...PROBABILITY_COLORS,
  ...CANVAS_COLORS,
} as const;

export type MathColorKey = keyof typeof MATH_COLORS;
