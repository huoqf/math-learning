/**
 * 弧度制、弧长与扇形面积 —— 纯数学计算逻辑
 * 满足铁律 6：零副作用、零 DOM / React / window 依赖
 *
 * 课标依据（人教A版必修一 5.1.2 弧度制）：
 *   1. 长度等于半径长的圆弧所对的圆心角叫做 1 弧度的角，记作 1 rad。
 *   2. 圆心角 α 的弧度数的绝对值 |α| = l / r（l 为弧长，r 为半径）。
 *   3. 正角的弧度数为正数，负角的弧度数为负数，零角的弧度数为 0。
 *
 * ⚠ 本模块**不**再自备「π 的有理倍读数」格式化函数：
 * 该类显示一律走 SSOT `@/utils/mathFormat` 的 `formatPiFraction`（纯文本 "π/3"）与
 * `formatPiFractionLatex`（LaTeX "\frac{\pi}{3}"），避免同一读数出现两套口径与两套容差。
 */

export const TAU = Math.PI * 2;

/** 1 弧度对应的角度值 ≈ 57.2958° */
export const DEG_PER_RAD = 180 / Math.PI;

/** 1 度对应的弧度值 ≈ 0.0175 rad */
export const RAD_PER_DEG = Math.PI / 180;

/** 角度转弧度 */
export function degToRad(deg: number): number {
  return deg * RAD_PER_DEG;
}

/** 弧度转角度 */
export function radToDeg(rad: number): number {
  return rad * DEG_PER_RAD;
}

/** 弧长 l = |α| · r（α 为弧度制圆心角） */
export function arcLength(alphaRad: number, r: number): number {
  return Math.abs(alphaRad) * r;
}

/** 扇形面积 S = ½|α| r² = ½ l r */
export function sectorArea(alphaRad: number, r: number): number {
  return 0.5 * Math.abs(alphaRad) * r * r;
}

/** 扇形周长 = 2r + l（两条半径 + 弧长） */
export function sectorPerimeter(alphaRad: number, r: number): number {
  return 2 * r + arcLength(alphaRad, r);
}

/** 由弧长与半径反解圆心角 α = l / r（弧度制；r ≤ 0 时返回 0） */
export function radianMeasure(l: number, r: number): number {
  if (r <= 0) return 0;
  return l / r;
}

/** 特殊角的度/弧度对照表（教材表格原样） */
export const SPECIAL_ANGLES: ReadonlyArray<{
  deg: number;
  radLatex: string;
}> = [
  { deg: 0, radLatex: "0" },
  { deg: 30, radLatex: "\\frac{\\pi}{6}" },
  { deg: 45, radLatex: "\\frac{\\pi}{4}" },
  { deg: 60, radLatex: "\\frac{\\pi}{3}" },
  { deg: 90, radLatex: "\\frac{\\pi}{2}" },
  { deg: 120, radLatex: "\\frac{2\\pi}{3}" },
  { deg: 135, radLatex: "\\frac{3\\pi}{4}" },
  { deg: 150, radLatex: "\\frac{5\\pi}{6}" },
  { deg: 180, radLatex: "\\pi" },
  { deg: 270, radLatex: "\\frac{3\\pi}{2}" },
  { deg: 360, radLatex: "2\\pi" },
];

/* ============================================================================
 * 特殊角吸附（必修一 5.1.2 弧度制 · 刻度可达性治理）
 *
 * 左屏 alphaRad 滑块的网格是 0.01 rad，而 π 的有理倍几乎全是无理数：
 * 在 [0, 2π] 的 628 个网格点中，没有任何一个能落在 π/12 的倍数上
 * （最接近者偏差 8.9e-5），于是「π/3 rad」这类读数在旧实现下**恒不可达** ——
 * 不是容差太小，而是网格与目标集不相交，放宽容差到 1e-6 依旧是 0 命中。
 *
 * 正确做法是让**取值本身**落到特殊角上（而不是让格式化工具有条件地假装），
 * 这样右屏读数、弧长、扇形面积三者始终同源于一个真实存在的角度。
 * 吸附窗口取半个网格（0.005 rad ≈ 0.29°），落在窗口内才吸附，其余保持连续。
 * ========================================================================== */

/** 吸附步长：15° = π/12，覆盖 30°/45°/60°/90°/120°/135°/150°/180° 等全部课标特殊角 */
export const SPECIAL_ANGLE_STEP_RAD = Math.PI / 12;

/** 吸附窗口（左屏滑块步长 0.01 rad 的一半） */
export const SPECIAL_ANGLE_SNAP_TOL = 0.005;

/**
 * 把弧度值吸附到最近的 15° 整数倍；超出吸附窗口则原样返回。
 *
 * 返回的三元组让调用方可以同时拿到「吸附后取值」与「是否发生吸附」，
 * 便于右屏给出「已吸附到特殊角」的提示，而无需再次比较浮点数。
 */
export function snapToSpecialAngle(
  rad: number,
  tol: number = SPECIAL_ANGLE_SNAP_TOL,
): { value: number; snapped: boolean; multiple: number } {
  if (!Number.isFinite(rad)) return { value: rad, snapped: false, multiple: 0 };
  const multiple = Math.round(rad / SPECIAL_ANGLE_STEP_RAD);
  const candidate = multiple * SPECIAL_ANGLE_STEP_RAD;
  if (Math.abs(candidate - rad) <= tol + 1e-12) {
    return { value: candidate, snapped: multiple !== 0, multiple };
  }
  return { value: rad, snapped: false, multiple: 0 };
}
