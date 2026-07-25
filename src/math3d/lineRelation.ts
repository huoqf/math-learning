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

export function judgeLineParallel(dirA: Vec3, dirB: Vec3, eps = 1e-3): boolean {
  const c = cross(dirA, dirB);
  return norm(c) < eps;
}

export function judgePlaneParallel(nA: Vec3, nB: Vec3, eps = 1e-3): boolean {
  return norm(cross(nA, nB)) < eps;
}
