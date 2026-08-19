import { Vec3, dot, cross, norm } from "./vector3";

export interface BasisDecompositionResult {
  x: number;
  y: number;
  z: number;
  isValid: boolean; // 基底是否线性无关（不共面）
  det: number; // 混合积 / 行列式 (a x b) · c
}

export type SolidBasisType = "parallelepiped" | "cube" | "tetrahedron";

/**
 * 获取典型几何体载体的三基底向量 a, b, c
 */
export function getPresetBasisVectors(
  type: SolidBasisType,
  cz = 2.0,
): { a: Vec3; b: Vec3; c: Vec3 } {
  switch (type) {
    case "cube":
      // 正方体正交基底
      return {
        a: { x: 2, y: 0, z: 0 },
        b: { x: 0, y: 2, z: 0 },
        c: { x: 0, y: 0, z: 2 },
      };
    case "tetrahedron":
      // 正四面体基底 (棱长均为 2.2，底面正三角形，顶点的投影在重心)
      return {
        a: { x: 2.2, y: 0, z: 0 },
        b: { x: 1.1, y: 1.905, z: 0 },
        c: { x: 1.1, y: 0.635, z: 1.796 },
      };
    case "parallelepiped":
    default:
      // 一般斜平行六面体基底
      return {
        a: { x: 2, y: 0, z: 0 },
        b: { x: 0.6, y: 2, z: 0 },
        c: { x: 0, y: 0.5, z: cz },
      };
  }
}

/**
 * 计算三向量 a, b, c 的混合积 (a × b) · c
 * 若 |det| < 1e-4，则 a, b, c 共面，无法构成空间基底。
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

  if (Math.abs(det) < 1e-4) {
    return { x: 0, y: 0, z: 0, isValid: false, det };
  }

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
  isCoplanar: boolean; // |x+y+z - 1| < 0.025 (四点共面)
  isInsideTriangle: boolean; // 共面且 x>=0, y>=0, z>=0 (落在 △ABC 闭区域：包含内部及边界)
  isCentroid: boolean; // |x - 1/3| < 0.04 && |y - 1/3| < 0.04 ... (重心 G)
  isInsideTetrahedron: boolean; // x>0, y>0, z>0 且 x+y+z < 1 (四面体 O-ABC 实体内部)
  spatialRegion:
    "plane_inside" | "plane_outside" | "tetra_inside" | "tetra_outside";
}

/**
 * 检查四点共面条件 (x + y + z = 1) 及其空间区域定位
 * - plane_inside: 位于 △ABC 闭区域（内部或边上，x,y,z >= 0 且 x+y+z=1）
 * - plane_outside: 位于平面 (ABC) 外部延展区域（x+y+z=1，但存在负系数）
 * - tetra_inside: 位于四面体 O-ABC 内部（x,y,z > 0 且 x+y+z < 1）
 * - tetra_outside: 位于四面体外部且不共面（x+y+z ≠ 1）
 */
export function checkCoplanarCondition(
  x: number,
  y: number,
  z: number,
): CoplanarInfo {
  const sum = x + y + z;
  const isCoplanar = Math.abs(sum - 1) < 0.025;
  // 截面三角形闭区域（x, y, z >= 0 且 x + y + z = 1）
  const isInsideTriangle = isCoplanar && x >= -0.01 && y >= -0.01 && z >= -0.01;
  const isCentroid =
    isCoplanar &&
    Math.abs(x - 1 / 3) < 0.04 &&
    Math.abs(y - 1 / 3) < 0.04 &&
    Math.abs(z - 1 / 3) < 0.04;

  const isInsideTetrahedron = x > 0.01 && y > 0.01 && z > 0.01 && sum < 0.99;

  let spatialRegion: CoplanarInfo["spatialRegion"] = "tetra_outside";
  if (isInsideTriangle) {
    spatialRegion = "plane_inside";
  } else if (isCoplanar) {
    spatialRegion = "plane_outside";
  } else if (isInsideTetrahedron) {
    spatialRegion = "tetra_inside";
  }

  return {
    sum,
    isCoplanar,
    isInsideTriangle,
    isCentroid,
    isInsideTetrahedron,
    spatialRegion,
  };
}

/**
 * 基底法解算向量模长与内积展开
 * |P|^2 = x^2|a|^2 + y^2|b|^2 + z^2|c|^2 + 2xy(a·b) + 2yz(b·c) + 2zx(c·a)
 */
export function calculateBasisVectorNorm(
  a: Vec3,
  b: Vec3,
  c: Vec3,
  x: number,
  y: number,
  z: number,
): {
  modulus: number;
  modulusSq: number;
  dotAB: number;
  dotBC: number;
  dotCA: number;
  lenA: number;
  lenB: number;
  lenC: number;
} {
  const lenA = norm(a);
  const lenB = norm(b);
  const lenC = norm(c);
  const dotAB = dot(a, b);
  const dotBC = dot(b, c);
  const dotCA = dot(c, a);

  const modulusSq =
    x * x * lenA * lenA +
    y * y * lenB * lenB +
    z * z * lenC * lenC +
    2 * x * y * dotAB +
    2 * y * z * dotBC +
    2 * z * x * dotCA;

  return {
    modulus: Math.sqrt(Math.max(0, modulusSq)),
    modulusSq,
    dotAB,
    dotBC,
    dotCA,
    lenA,
    lenB,
    lenC,
  };
}

/**
 * 计算空间点 P 到由 A, B, C 确定的平面 (ABC) 的垂直投影垂足与垂直距离
 */
export function projectPointOnPlaneABC(
  P: Vec3,
  A: Vec3,
  B: Vec3,
  C: Vec3,
): {
  projectedPoint: Vec3;
  distance: number;
  normal: Vec3;
} {
  const AB = { x: B.x - A.x, y: B.y - A.y, z: B.z - A.z };
  const AC = { x: C.x - A.x, y: C.y - A.y, z: C.z - A.z };
  const nRaw = cross(AB, AC);
  const nLen = norm(nRaw);

  if (nLen < 1e-6) {
    return { projectedPoint: P, distance: 0, normal: { x: 0, y: 0, z: 1 } };
  }

  const normal = { x: nRaw.x / nLen, y: nRaw.y / nLen, z: nRaw.z / nLen };
  const AP = { x: P.x - A.x, y: P.y - A.y, z: P.z - A.z };
  const d = dot(AP, normal); // 有向距离

  const projectedPoint: Vec3 = {
    x: P.x - d * normal.x,
    y: P.y - d * normal.y,
    z: P.z - d * normal.z,
  };

  return {
    projectedPoint,
    distance: Math.abs(d),
    normal,
  };
}

export interface FrameworkEdge {
  from: Vec3;
  to: Vec3;
  label?: string;
}

/**
 * 获取正方体 / 正四面体等典型几何体的实体棱骨架列表
 */
export function getSolidFrameworkEdges(
  type: SolidBasisType,
  a: Vec3,
  b: Vec3,
  c: Vec3,
): FrameworkEdge[] {
  const A: Vec3 = { x: 0, y: 0, z: 0 }; // 空间分解原点 A
  if (type === "cube" || type === "parallelepiped") {
    const B = a;
    const D = b;
    const C = { x: a.x + b.x, y: a.y + b.y, z: a.z + b.z };
    const A1 = c;
    const B1 = { x: a.x + c.x, y: a.y + c.y, z: a.z + c.z };
    const D1 = { x: b.x + c.x, y: b.y + c.y, z: b.z + c.z };
    const C1 = { x: a.x + b.x + c.x, y: a.y + b.y + c.y, z: a.z + b.z + c.z };

    return [
      // 底面 ABCD (4 棱)
      { from: A, to: B },
      { from: B, to: C },
      { from: C, to: D },
      { from: D, to: A },
      // 顶面 A1B1C1D1 (4 棱)
      { from: A1, to: B1 },
      { from: B1, to: C1 },
      { from: C1, to: D1 },
      { from: D1, to: A1 },
      // 4 条直立侧棱
      { from: A, to: A1 },
      { from: B, to: B1 },
      { from: C, to: C1 },
      { from: D, to: D1 },
    ];
  }

  if (type === "tetrahedron") {
    // 正四面体 A-BCD
    return [
      { from: A, to: a },
      { from: A, to: b },
      { from: A, to: c },
      { from: a, to: b },
      { from: b, to: c },
      { from: c, to: a },
    ];
  }

  return [];
}

export interface FrameworkVertex {
  position: Vec3;
  base: string;
  subscript?: string;
  offset?: [number, number, number];
}

/**
 * 获取正方体 / 正四面体等典型几何体的全部顶点及标签列表
 * 严格遵循全国高考标准命名：底面 ABCD，顶面 A1B1C1D1，基向量为 AB, AD, AA1
 */
export function getSolidFrameworkVertices(
  type: SolidBasisType,
  a: Vec3,
  b: Vec3,
  c: Vec3,
): FrameworkVertex[] {
  const A: Vec3 = { x: 0, y: 0, z: 0 };
  if (type === "cube" || type === "parallelepiped") {
    const B = a;
    const D = b;
    const C = { x: a.x + b.x, y: a.y + b.y, z: a.z + b.z };
    const A1 = c;
    const B1 = { x: a.x + c.x, y: a.y + c.y, z: a.z + c.z };
    const D1 = { x: b.x + c.x, y: b.y + c.y, z: b.z + c.z };
    const C1 = { x: a.x + b.x + c.x, y: a.y + b.y + c.y, z: a.z + b.z + c.z };

    return [
      // 底面 4 顶点
      { position: A, base: "A", offset: [-0.22, -0.22, 0] },
      { position: B, base: "B", offset: [0.22, -0.2, 0] },
      { position: C, base: "C", offset: [0.25, 0, 0] },
      { position: D, base: "D", offset: [-0.22, 0.22, 0] },
      // 顶面 4 顶点 (带有 +Z 向上立体拔高)
      { position: A1, base: "A", subscript: "1", offset: [-0.22, -0.22, 0.25] },
      { position: B1, base: "B", subscript: "1", offset: [0.22, -0.2, 0.25] },
      { position: C1, base: "C", subscript: "1", offset: [0.22, 0.18, 0.25] },
      { position: D1, base: "D", subscript: "1", offset: [-0.22, 0.22, 0.25] },
    ];
  }

  if (type === "tetrahedron") {
    return [
      { position: A, base: "A", offset: [-0.22, -0.22, 0] },
      { position: a, base: "B", offset: [0.22, -0.2, 0] },
      { position: b, base: "C", offset: [-0.22, 0.22, 0] },
      { position: c, base: "D", offset: [0, 0, 0.25] },
    ];
  }

  return [];
}
