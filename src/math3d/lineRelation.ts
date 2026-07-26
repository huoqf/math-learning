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

export function getLineDirection(thetaDeg: number, phiDeg: number): Vec3 {
  const thetaRad = (thetaDeg * Math.PI) / 180;
  const phiRad = (phiDeg * Math.PI) / 180;
  return {
    x: Math.cos(thetaRad) * Math.cos(phiRad),
    y: Math.cos(thetaRad) * Math.sin(phiRad),
    z: Math.sin(thetaRad),
  };
}

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

export function judgeLineParallel(dirA: Vec3, dirB: Vec3, eps = 1e-3): boolean {
  const c = cross(dirA, dirB);
  return norm(c) < eps;
}

export function judgePlaneParallel(nA: Vec3, nB: Vec3, eps = 1e-3): boolean {
  return norm(cross(nA, nB)) < eps;
}
