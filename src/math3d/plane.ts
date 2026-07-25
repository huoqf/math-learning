/**
 * 平面相关纯函数
 */

import type { Vec3 } from "./vector3";
import { sub, cross, normalize, dot, scale, norm } from "./vector3";

export interface Plane {
  point: Vec3;
  normal: Vec3;
}

export const planeFromPoints = (p1: Vec3, p2: Vec3, p3: Vec3): Plane => ({
  point: p1,
  normal: normalize(cross(sub(p2, p1), sub(p3, p1))),
});

export const pointPlaneDistance = (pt: Vec3, plane: Plane): number =>
  Math.abs(dot(sub(pt, plane.point), plane.normal));

export const projectPointToPlane = (pt: Vec3, plane: Plane): Vec3 =>
  sub(pt, scale(plane.normal, dot(sub(pt, plane.point), plane.normal)));

/** 二面角（取锐角） */
export const planeAngle = (p1: Plane, p2: Plane): number => {
  const n1 = p1.normal;
  const n2 = p2.normal;
  const c = Math.abs(dot(n1, n2)) / (norm(n1) * norm(n2));
  return Math.acos(Math.min(1, Math.max(-1, c)));
};

/** 直线与平面所成角 */
export const linePlaneAngle = (dir: Vec3, plane: Plane): number => {
  const nDir = normalize(dir);
  const c = Math.abs(dot(nDir, plane.normal));
  return Math.PI / 2 - Math.acos(Math.min(1, Math.max(-1, c)));
};

/** 点是否在平面上 */
export const isPointOnPlane = (pt: Vec3, plane: Plane, eps = 1e-6): boolean =>
  pointPlaneDistance(pt, plane) < eps;
