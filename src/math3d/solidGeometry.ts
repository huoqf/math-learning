/**
 * 立体几何公式纯函数
 *
 * 涵盖：长方体外接球、正棱锥外接/内切球、圆锥外接球、
 *       正四面体外接/内切球、球体积与表面积。
 */

/** 正四面体外接球半径：R = (√6/4)a */
export const regularTetrahedronCircumRadius = (edge: number): number =>
  (edge * Math.sqrt(6)) / 4;

/** 正四面体内切球半径：r = (√6/12)a */
export const regularTetrahedronInRadius = (edge: number): number =>
  (edge * Math.sqrt(6)) / 12;

/** 正棱锥外接球半径：R = (r²+h²)/(2h) ，r 为底面外接圆半径 */
export const regularPyramidCircumRadius = (
  baseCircumR: number,
  h: number,
): number => (baseCircumR * baseCircumR + h * h) / (2 * h);

/** 圆锥外接球半径 */
export const coneCircumRadius = (r: number, h: number): number =>
  (r * r + h * h) / (2 * h);

/** 球体积 */
export const sphereVolume = (r: number): number => (4 / 3) * Math.PI * r ** 3;

/** 球表面积 */
export const sphereSurfaceArea = (r: number): number => 4 * Math.PI * r ** 2;

/** 圆锥/棱锥内切球半径（体积法）：r = 3V / S_total */
export const inSphereRadiusByVolume = (
  volume: number,
  totalSurfaceArea: number,
): number => (3 * volume) / totalSurfaceArea;

/** 正 n 棱锥底面外接圆半径 */
export const regularPolygonCircumRadius = (
  sideLength: number,
  n: number,
): number => sideLength / (2 * Math.sin(Math.PI / n));

/** 正 n 棱锥底面面积 */
export const regularPolygonArea = (sideLength: number, n: number): number =>
  (n * sideLength * sideLength) / (4 * Math.tan(Math.PI / n));

/** 圆柱轴截面对角线：d = √((2r)² + h²) */
export const cylinderAxialDiagonal = (r: number, h: number): number =>
  Math.sqrt(4 * r * r + h * h);

/** 圆柱侧面展开最短路径：L = √((2πr)² + h²) */
export const cylinderLateralShortestPath = (r: number, h: number): number =>
  Math.sqrt((2 * Math.PI * r) ** 2 + h * h);

/**
 * 球截面圆半径（球心距 d 截球）：r = √(R² − d²)
 * d ≥ R 时截面退化为切点或无公共点，返回 0
 */
export const sphereSectionRadius = (R: number, d: number): number =>
  Math.abs(d) >= R ? 0 : Math.sqrt(Math.max(0, R * R - d * d));

/** 圆锥母线长：l = √(r² + h²) */
export const coneGeneratrix = (r: number, h: number): number =>
  Math.hypot(r, h);

/** 圆台母线长：l = √((r1 - r2)² + h²) */
export const frustumGeneratrix = (r1: number, r2: number, h: number): number =>
  Math.hypot(r1 - r2, h);
