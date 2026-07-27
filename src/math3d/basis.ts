import { Vec3, dot, cross } from "./vector3";

export interface BasisDecompositionResult {
  x: number;
  y: number;
  z: number;
  isValid: boolean; // 基底是否线性无关（不共面）
  det: number; // 混合积 / 行列式
}

/**
 * 计算三向量 a, b, c 的混合积 (a × b) · c
 * 若 |det| < 1e-5，则 a, b, c 共面，无法构成空间基底。
 */
export function computeTripleProduct(a: Vec3, b: Vec3, c: Vec3): number {
  return dot(cross(a, b), c);
}

/**
 * 基于克拉默法则 (Cramer's Rule) 精确解算向量 P 在基底 a, b, c 上的分解系数 x, y, z
 * 满足: P = x * a + y * b + z * c
 */
export function solveBasisCoefficients(
  a: Vec3,
  b: Vec3,
  c: Vec3,
  P: Vec3,
): BasisDecompositionResult {
  const det = computeTripleProduct(a, b, c);

  if (Math.abs(det) < 1e-5) {
    return { x: 0, y: 0, z: 0, isValid: false, det };
  }

  // Cramer's rule:
  // x = det([P, b, c]) / det([a, b, c])
  // y = det([a, P, c]) / det([a, b, c])
  // z = det([a, b, P]) / det([a, b, c])
  const detX = computeTripleProduct(P, b, c);
  const detY = computeTripleProduct(a, P, c);
  const detZ = computeTripleProduct(a, b, P);

  return {
    x: detX / det,
    y: detY / det,
    z: detZ / det,
    isValid: true,
    det,
  };
}

export interface ParallelepipedVertices {
  O: Vec3;
  xa: Vec3;
  yb: Vec3;
  zc: Vec3;
  xy: Vec3; // xa + yb
  xz: Vec3; // xa + zc
  yz: Vec3; // yb + zc
  P: Vec3; // xa + yb + zc
}

/**
 * 根据基底与系数解算平行六面体的 8 个顶点
 */
export function calculateParallelepipedVertices(
  a: Vec3,
  b: Vec3,
  c: Vec3,
  x: number,
  y: number,
  z: number,
): ParallelepipedVertices {
  const xa: Vec3 = { x: x * a.x, y: x * a.y, z: x * a.z };
  const yb: Vec3 = { x: y * b.x, y: y * b.y, z: y * b.z };
  const zc: Vec3 = { x: z * c.x, y: z * c.y, z: z * c.z };

  const xy: Vec3 = { x: xa.x + yb.x, y: xa.y + yb.y, z: xa.z + yb.z };
  const xz: Vec3 = { x: xa.x + zc.x, y: xa.y + zc.y, z: xa.z + zc.z };
  const yz: Vec3 = { x: yb.x + zc.x, y: yb.y + zc.y, z: yb.z + zc.z };

  const P: Vec3 = {
    x: xa.x + yb.x + zc.x,
    y: xa.y + yb.y + zc.y,
    z: xa.z + yb.z + zc.z,
  };

  return {
    O: { x: 0, y: 0, z: 0 },
    xa,
    yb,
    zc,
    xy,
    xz,
    yz,
    P,
  };
}

export interface CoplanarInfo {
  sum: number; // x + y + z
  isCoplanar: boolean; // |x+y+z - 1| < 0.02
  isInsideTriangle: boolean; // 共面且 x>=0, y>=0, z>=0
  isCentroid: boolean; // |x - 1/3| < 0.03 && |y - 1/3| < 0.03 ...
}

/**
 * 检查四点共面条件 (x + y + z = 1) 及其几何意义
 */
export function checkCoplanarCondition(
  x: number,
  y: number,
  z: number,
): CoplanarInfo {
  const sum = x + y + z;
  const isCoplanar = Math.abs(sum - 1) < 0.02;
  const isInsideTriangle = isCoplanar && x >= -0.01 && y >= -0.01 && z >= -0.01;
  const isCentroid =
    isCoplanar &&
    Math.abs(x - 1 / 3) < 0.04 &&
    Math.abs(y - 1 / 3) < 0.04 &&
    Math.abs(z - 1 / 3) < 0.04;

  return {
    sum,
    isCoplanar,
    isInsideTriangle,
    isCentroid,
  };
}
