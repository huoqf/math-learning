/**
 * 立体几何公式纯函数
 *
 * 涵盖：长方体外接球、正棱锥外接/内切球、圆锥外接球、
 *       正四面体外接/内切球、球体积与表面积。
 */

/** 长方体外接球半径：R = √(a²+b²+c²)/2 */
export const cuboidCircumRadius = (a: number, b: number, c: number): number =>
  Math.sqrt(a * a + b * b + c * c) / 2;

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
