/**
 * 截面积计算与射影面积定理纯函数解算层
 */

import type { Vec3 } from "./vector3";
import { sub, cross, normalize } from "./vector3";

/**
 * 精确计算 3D 凸/简单共面多边形的 3D 面积
 * 使用三角扇向量叉积和：S = 0.5 * || sum_{i=1}^{n-2} (P_i - P_0) x (P_{i+1} - P_0) ||
 */
export function computeSectionArea3D(points: Vec3[]): number {
  if (points.length < 3) return 0;

  const p0 = points[0];
  let sumX = 0;
  let sumY = 0;
  let sumZ = 0;

  for (let i = 1; i < points.length - 1; i++) {
    const v1 = sub(points[i], p0);
    const v2 = sub(points[i + 1], p0);
    const c = cross(v1, v2);
    sumX += c.x;
    sumY += c.y;
    sumZ += c.z;
  }

  return 0.5 * Math.sqrt(sumX * sumX + sumY * sumY + sumZ * sumZ);
}

/**
 * 计算 3D 截面顶点投影到 XY 基准面（z=0）后的 2D 投影面积
 * 使用鞋带公式 (Shoelace formula)
 */
export function computeProjectionArea2D(points: Vec3[]): number {
  if (points.length < 3) return 0;
  let area = 0;
  const n = points.length;
  for (let i = 0; i < n; i++) {
    const current = points[i];
    const next = points[(i + 1) % n];
    area += current.x * next.y - next.x * current.y;
  }
  return Math.abs(area) * 0.5;
}

export interface SectionProjectionDetails {
  /** 3D 截面实际面积 S_截 */
  area3D: number;
  /** 底面 (XY面) 投影面积 S_投 */
  areaProj: number;
  /** 截面法向量与底面法向量夹角的余弦值 cos θ */
  cosTheta: number;
  /** 截面与底面的二面角 (角度 °) */
  thetaDeg: number;
  /** 射影面积公式是否适用 (当 cos θ > 1e-5 且截面非垂直于底面时有效) */
  isProjectionValid: boolean;
}

/**
 * 求解截面射影面积定理参数
 */
export function computeSectionProjectionDetails(
  points: Vec3[],
  planeNormal: Vec3,
): SectionProjectionDetails {
  const area3D = computeSectionArea3D(points);
  const areaProj = computeProjectionArea2D(points);

  const n = normalize(planeNormal);
  // 底面为 z=0，底面法向量为 (0,0,1)
  const cosTheta = Math.abs(n.z);
  const thetaRad = Math.acos(Math.min(1, Math.max(0, cosTheta)));
  const thetaDeg = (thetaRad * 180) / Math.PI;

  // 避免截面垂直于底面 (cos θ = 0) 时除以 0
  const isProjectionValid = cosTheta > 1e-4 && points.length >= 3;

  return {
    area3D,
    areaProj,
    cosTheta,
    thetaDeg,
    isProjectionValid,
  };
}

/**
 * 作图步骤辅助链数据结构
 */
export interface ConstructionStep {
  stepIndex: number;
  title: string;
  description: string;
  /** 辅助延长线/交线段 (数学坐标) */
  lines?: { from: Vec3; to: Vec3; type: "solid" | "dashed" | "extension" }[];
  /** 辅助特征点 (如延线交点 K) */
  points?: { position: Vec3; label: string }[];
}
