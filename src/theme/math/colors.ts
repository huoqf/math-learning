/**
 * src/theme/math/colors.ts
 * 数学对象颜色语义映射 — Canvas / SVG 内唯一颜色来源
 */

export function withAlpha(hex: string, alpha: number): string {
  const clean = hex.replace("#", "");
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
  sequence: "#2563EB", // 数列散点 — 经典蓝
  inequality: "#10B981", // 不等式可行域 — 绿
  complexNum: "#8B5CF6", // 复数向量 — 紫
} as const;

// ─── 函数与微积分 (Functions & Calculus) ──────────────────────────────────────
export const CALCULUS_COLORS = {
  function: "#2563EB", // 原函数曲线 f(x) — 经典蓝
  functionSecondary: "#8B5CF6", // 对比函数/复合内层函数 g(x) — 紫色
  functionTransformed: "#EC4899", // 变换后函数 f(ax+b) — 粉红（强对比）
  derivative: "#D97706", // 导函数曲线 f'(x) — 暖橙
  tangentLine: "#DC2626", // 切线 — 警示红
  secantLine: "#64748B", // 割线 — 中性灰
  areaFill: "rgba(37, 99, 235, 0.15)", // 定积分面积填充
  deltaHighlight: "#3B82F6", // 割线直角三角形 Δx/Δy 描边
} as const;

// ─── 三角学与单位圆 (Trigonometry & Unit Circle) ──────────────────────────────
export const TRIGONOMETRY_COLORS = {
  sin: "#EF4444", // 正弦线 / sin(x) 曲线 — 鲜红
  cos: "#10B981", // 余弦线 / cos(x) 曲线 — 翠绿
  tan: "#8B5CF6", // 正切线 / tan(x) 曲线 — 葡萄紫
} as const;

// ─── 几何与解析几何 (Geometry & Conics) ────────────────────────────────────────
export const GEOMETRY_COLORS = {
  vectorPrimary: "#1E3A8A", // 主向量 a — 深邃蓝
  vectorSecondary: "#059669", // 辅助向量 b — 深绿
  vectorResult: "#DC2626", // 和向量 c — 亮红
  vectorProjection: "#8B5CF6", // 投影向量 — 紫
  line: "#475569", // 直线 — slate-600
  circle: "#0284C7", // 圆 — sky-600
  ellipse: "#7C3AED", // 椭圆 — violet-600
  hyperbola: "#BE185D", // 双曲线 — pink-700
  parabola: "#D97706", // 抛物线 — amber-600
  asymptote: "#94A3B8", // 渐近线 — neutral-400
  focusPoint: "#EF4444", // 焦点 — 鲜红
  directrix: "#F59E0B", // 准线 — 琥珀黄
  symmetryAxis: "#64748B", // 对称轴 — 中性灰
  vertexPoint: "#1E293B", // 顶点 — neutral-800
  trace: "#A855F7", // 动点轨迹残影 — 紫
  normalLine: "#059669", // 法线 — 翡翠绿
} as const;

// ─── 3D 空间直角坐标系 (3D Coordinates & Space Vectors) ────────────────────────
export const SPACE_3D_COLORS = {
  axis3D_X: "#EF4444", // 空间 X 轴 — 红 (RGB惯例)
  axis3D_Y: "#10B981", // 空间 Y 轴 — 绿
  axis3D_Z: "#3B82F6", // 空间 Z 轴 — 蓝
  planeFill: "rgba(148, 163, 184, 0.15)", // 空间平面填充
} as const;

// ─── 公式参数与 UI 滑块联动 (Param & Formula Coloring) ────────────────────────
export const PARAM_COLORS = {
  paramPrimary: "#EF4444", // 对应 a 或 k 等一号主控参数 — 红色
  paramSecondary: "#D97706", // 对应 b 等二号参数 — 橙色
  paramTertiary: "#059669", // 对应 c 或者是 θ 等三号参数 — 绿色
} as const;

// ─── 交互反馈与特殊状态 (Interactive Feedback & Status) ────────────────────────
export const STATUS_COLORS = {
  interactiveHover: "#3B82F6", // 拖拽点悬停外圈发光色
  interactiveActive: "#2563EB", // 拖拽中激活色
  degeneracy: "#DC2626", // 退化/无解/空集警示色
  limitPoint: "#D97706", // 极限逼近目标点
} as const;

// ─── 概率、统计与组合计数 (Probability, Statistics & Combinatorics) ────────────
export const PROBABILITY_COLORS = {
  barFill: "#06B6D4", // 柱状图填充 — cyan-500
  densityCurve: "#0891B2", // 密度曲线 (正态分布)
} as const;

export const COMBINATORICS_COLORS = {
  pascalNodeBg: "#F8FAFC",
  pascalNodeBorder: "#CBD5E1",
  pascalSelectedGlow: "rgba(239, 68, 68, 0.25)",
  pascalLinkLine: "#94A3B8",
  permCardBg: "#FFF1F2",
  permCardBorder: "#FDA4AF",
  permHeader: "#E11D48",
  combCardBg: "#F0FDF4",
  combCardBorder: "#86EFAC",
  combHeader: "#059669",
  poolBg: "#F8FAFC",
  poolBorder: "#E2E8F0",
  tipBg: "#F0F9FF",
  tipBorder: "#BAE6FD",
  tipText: "#0284C7",
} as const;

// ─── 通用 Canvas 元素 (Canvas Commons) ───────────────────────────────────────
export const CANVAS_COLORS = {
  axis: "#CBD5E1", // 坐标轴、参考线
  grid: "#E2E8F0", // 网格线
  gridSubtle: "#F1F5F9", // 浅网格/轻描边
  labelText: "#1E293B", // 文字标注
  labelTextLight: "#475569", // 次要文字
  textMuted: "#64748B", // 禁用/弱化文字
  white: "#FFFFFF",
} as const;

// ─── 聚合导出 ───────────────────────────────────────────────────────────────
export const MATH_COLORS = {
  ...ALGEBRA_COLORS,
  ...CALCULUS_COLORS,
  ...TRIGONOMETRY_COLORS,
  ...GEOMETRY_COLORS,
  ...SPACE_3D_COLORS,
  ...PARAM_COLORS,
  ...STATUS_COLORS,
  ...PROBABILITY_COLORS,
  ...COMBINATORICS_COLORS,
  ...CANVAS_COLORS,
} as const;

export type MathColorKey = keyof typeof MATH_COLORS;
