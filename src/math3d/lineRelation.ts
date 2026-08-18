/**
 * 线面位置关系判定纯函数
 *
 * know-solid-position 核心判定逻辑
 */

import type { Vec3 } from "./vector3";
import { cross, dot, normalize, norm, sub } from "./vector3";
import type { Plane } from "./plane";

export type LinePlaneRelation =
  "parallel" | "perpendicular" | "inPlane" | "intersect";

/**
 * 判断直线与平面的位置关系
 */
export function judgeLinePlane(
  dir: Vec3,
  plane: Plane,
  pointOnLine: Vec3,
  eps = 1e-3,
): LinePlaneRelation {
  const nDir = normalize(dir);
  const cosWithNormal = dot(nDir, plane.normal);
  const distToPlane = Math.abs(
    dot(sub(pointOnLine, plane.point), plane.normal),
  );

  if (Math.abs(cosWithNormal) < eps && distToPlane < eps) return "inPlane";
  if (Math.abs(cosWithNormal) < eps) return "parallel";
  if (Math.abs(Math.abs(cosWithNormal) - 1) < eps) return "perpendicular";
  return "intersect";
}

/**
 * 根据极角 θ (线面角/仰角) 与方位角 φ (xy 平面方位) 计算方向向量
 */
export function getLineDirection(thetaDeg: number, phiDeg: number): Vec3 {
  const thetaRad = (thetaDeg * Math.PI) / 180;
  const phiRad = (phiDeg * Math.PI) / 180;
  return {
    x: Math.cos(thetaRad) * Math.cos(phiRad),
    y: Math.cos(thetaRad) * Math.sin(phiRad),
    z: Math.sin(thetaRad),
  };
}

/**
 * 计算线面角 θ 与法向量夹角
 */
export function calcLinePlaneAngle(
  dir: Vec3,
  planeNormal: Vec3 = { x: 0, y: 0, z: 1 },
): {
  sinTheta: number;
  thetaDeg: number;
  cosNormalAngle: number;
} {
  const nDir = normalize(dir);
  const nNorm = normalize(planeNormal);
  const cosNormalAngle = Math.abs(dot(nDir, nNorm));
  const sinTheta = cosNormalAngle; // sin(θ) = |cos(l, n)|
  const thetaRad = Math.asin(Math.min(1, Math.max(0, sinTheta)));
  return {
    sinTheta,
    thetaDeg: (thetaRad * 180) / Math.PI,
    cosNormalAngle,
  };
}

/**
 * 判断两条直线方向向量是否平行
 */
export function judgeLineParallel(dirA: Vec3, dirB: Vec3, eps = 1e-3): boolean {
  const c = cross(dirA, dirB);
  return norm(c) < eps;
}

/**
 * 判断两平面的法向量是否平行 (面面平行)
 */
export function judgePlaneParallel(nA: Vec3, nB: Vec3, eps = 1e-3): boolean {
  return norm(cross(nA, nB)) < eps;
}

/**
 * 计算空间点到平面的垂足坐标
 */
export function projectPointToPlane(point: Vec3, plane: Plane): Vec3 {
  const n = normalize(plane.normal);
  const v = sub(point, plane.point);
  const dist = dot(v, n);
  return {
    x: point.x - dist * n.x,
    y: point.y - dist * n.y,
    z: point.z - dist * n.z,
  };
}

/**
 * 四棱锥 P-ABCD 几何母题：
 * 底面 ABCD 为矩形或正方形，PA ⊥ 底面 ABCD
 * E 为 PB 上的动点 (PE/PB = lambda_E)，F 为 PC 上的动点 (PF/PC = lambda_F)
 */
export interface PyramidModelData {
  P: Vec3;
  A: Vec3;
  B: Vec3;
  C: Vec3;
  D: Vec3;
  E: Vec3;
  F: Vec3;
  isEFParallelBase: boolean;
  isEFParallelPlanePAD: boolean;
  isPlanePABPerpBase: boolean;
  isPlanePADPerpBase: boolean;
}

export function calcPyramidModel(
  a = 4,
  b = 3,
  h = 3.5,
  lambdaE = 0.5,
  lambdaF = 0.5,
): PyramidModelData {
  const A: Vec3 = { x: 0, y: 0, z: 0 };
  const B: Vec3 = { x: a, y: 0, z: 0 };
  const C: Vec3 = { x: a, y: b, z: 0 };
  const D: Vec3 = { x: 0, y: b, z: 0 };
  const P: Vec3 = { x: 0, y: 0, z: h }; // PA ⊥ 底面

  // E on PB: E = P + lambdaE * (B - P)
  const E: Vec3 = {
    x: P.x + lambdaE * (B.x - P.x),
    y: P.y + lambdaE * (B.y - P.y),
    z: P.z + lambdaE * (B.z - P.z),
  };

  // F on PC: F = P + lambdaF * (C - P)
  const F: Vec3 = {
    x: P.x + lambdaF * (C.x - P.x),
    y: P.y + lambdaF * (C.y - P.y),
    z: P.z + lambdaF * (C.z - P.z),
  };

  // 当 lambdaE == lambdaF 时，EF ∥ BC ∥ AD，从而 EF ∥ 面 ABCD 且 EF ∥ 面 PAD
  const isEFParallelBase = Math.abs(lambdaE - lambdaF) < 1e-3;
  const isEFParallelPlanePAD = isEFParallelBase;

  return {
    P,
    A,
    B,
    C,
    D,
    E,
    F,
    isEFParallelBase,
    isEFParallelPlanePAD,
    isPlanePABPerpBase: true, // PA ⊥ 底面且 PA ⊂ 面 PAB
    isPlanePADPerpBase: true, // PA ⊥ 底面且 PA ⊂ 面 PAD
  };
}
