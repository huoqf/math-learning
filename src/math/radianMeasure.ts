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
