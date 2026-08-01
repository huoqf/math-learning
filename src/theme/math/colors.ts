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

// ─── 集合与逻辑 (Set & Logic) ──────────────────────────────────────────────────
export const SET_COLORS = {
  setA: "#2563EB", // 集合 A 区域/轮廓 — 经典蓝
  setB: "#8B5CF6", // 集合 B 区域/轮廓 — 葡萄紫
  setIntersection: "#10B981", // 集合交集 A ∩ B 高亮 — 翡翠绿
  setUnion: "#3B82F6", // 集合并集 A ∪ B 高亮 — 宝蓝
  setComplement: "#F59E0B", // 补集 ∁_U A 高亮 — 琥珀黄
} as const;

// ─── 代数与数列分析 (Algebra, Sequences & Analysis) ───────────────────────────
export const ALGEBRA_COLORS = {
  sequence: "#2563EB", // 主数列通项 a_n 散点 — 经典蓝
  sequenceSecondary: "#8B5CF6", // 次要/对比数列 b_n 散点 — 葡萄紫
  sequenceSum: "#D97706", // 前 n 项和 S_n 散点/累加柱状图 — 暖橙
  sequenceStem: "#94A3B8", // 散点至 n 轴的离散投影垂线 — 中性 slate-400
  sequenceHighlight: "#EF4444", // 选定项 / S_n 最值高亮点 — 鲜红
  sequenceCobweb: "#EC4899", // 递推数列蛛网图 (a_{n+1}=f(a_n)) 逼近折线 — 玫红
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
  // 1. 频率分布直方图与经验分布
  barFill: "#06B6D4", // 直方图柱子主色 — 亮青 (cyan-500)
  barBorder: "#0891B2", // 直方图柱子描边 — 深青 (cyan-600)
  barHover: "#22D3EE", // 直方图悬浮色 — 浅青 (cyan-400)
  frequencyLine: "#D97706", // 频率折线/频率多边形 — 暖橙 (amber-600)

  // 2. 正态分布 N(μ, σ²) 理论密度曲线
  densityCurve: "#2563EB", // 理论密度曲线 f(x) — 经典蓝 (blue-600)
  meanLine: "#DC2626", // 均值 μ / 期望 E(X) 垂线 — 警示红
  sdLine: "#059669", // 标准差 σ / 范围辅助线 — 翡翠绿

  // 3. 3σ 区间概率填充 (梯度透视，由内向外)
  sigma1Fill: "rgba(37, 99, 235, 0.25)", // 1σ 区间 (68.27%) — 宝蓝半透
  sigma2Fill: "rgba(14, 165, 233, 0.20)", // 2σ 区间 (95.45%) — 天蓝半透
  sigma3Fill: "rgba(168, 85, 247, 0.15)", // 3σ 区间 (99.73%) — 紫色半透

  // 4. 成对数据与线性回归分析 (Regression Analysis)
  statScatter: "#0284C7", // 样本散点 (xi, yi) — 湛蓝 (sky-600)
  regressionLine: "#EF4444", // 最小二乘法回归直线 y^ = bx + a — 鲜红
  sampleMeanPoint: "#D97706", // 样本中心点 (x̄, ȳ) — 暖橙
  residualLine: "#94A3B8", // 残差线/偏差虚线 — slate-400

  // 5. 贝叶斯决策与概率树图 (Tree Diagrams & Bayes)
  bayesPrior: "#3B82F6", // 先验事件 A_i 节点/分支 — 蓝色
  bayesPosterior: "#10B981", // 后验概率 B 节点/高亮 — 绿色
  bayesBranch: "#CBD5E1", // 概率分支连线 — neutral slate-300
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

// ─── 3D 渲染组件专用色 (3D Rendering Components) ───────────────────────────
export const MATH3D_COLORS = {
  accent: "#D97706", // 3D 交互点/高亮
  primary: "#2563EB", // 3D 主色
  secondary: "#059669", // 3D 辅助色
  highlight: "#DC2626", // 3D 角度弧/警示
  line: "#475569", // 3D 几何体边线
  background: "#FFFFFF", // Canvas 背景
  sphereShell: "#93c5fd", // 淡蓝，外接球专用
  inSphereShell: "#fca5a5", // 淡橙红，内切球专用
  sectionPlane: "#a5b4fc", // 冰紫天蓝，3D 截面辅助延伸平面专用
  sectionFill: "#f59e0b", // 高饱和琥珀金，截面多边形主填色
  sectionOutline: "#b45309", // 深琥珀棕，截面多边形高亮边线
  label: "#1e293b", // 标签文字统一深灰色
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
  ...SET_COLORS,
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
  ...MATH3D_COLORS,
} as const;

export type MathColorKey = keyof typeof MATH_COLORS;
